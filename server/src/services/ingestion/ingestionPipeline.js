import { v4 as uuidv4 } from 'uuid';
import { Movie } from '../../models/Movie.js';
import { MovieChunk } from '../../models/MovieChunk.js';
import { IngestionJob } from '../../models/IngestionJob.js';
import { embeddingService } from '../embeddings/embeddingService.js';

export class IngestionPipeline {
  /**
   * Ingest a movie into the database and build its semantic vector index
   */
  async ingestMovie(movieData, options = { forceReingest: false }) {
    const startTime = Date.now();
    const jobId = `job_${uuidv4().slice(0, 8)}`;

    const job = new IngestionJob({
      jobId,
      movieId: movieData.movieId,
      movieTitle: movieData.title,
      status: 'processing',
      stage: 'metadata_fetch',
    });
    await job.save();

    try {
      // 1. Check existing movie
      let movie = await Movie.findOne({ movieId: movieData.movieId });

      if (movie && !options.forceReingest) {
        // If movie already exists with verified chunks, return it
        const existingChunks = await MovieChunk.countDocuments({ movieId: movieData.movieId });
        if (existingChunks > 0) {
          job.status = 'completed';
          job.stage = 'completed';
          job.chunksCreated = existingChunks;
          job.metadata.durationMs = Date.now() - startTime;
          await job.save();
          return { movie, job, chunksCreated: existingChunks, status: 'already_ingested' };
        }
      }

      // 2. Upsert Movie Document
      if (!movie) {
        movie = new Movie(movieData);
      } else {
        Object.assign(movie, movieData);
      }
      await movie.save();

      job.stage = 'chunking';
      await job.save();

      // 3. Clear existing chunks if re-ingesting
      await MovieChunk.deleteMany({ movieId: movie.movieId });

      // 4. Generate structured semantic chunks
      const rawChunks = [];

      // A. Plot summary chunks
      const plotParagraphs = movie.plotSummary
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 50);

      plotParagraphs.forEach((paragraph, idx) => {
        rawChunks.push({
          movieId: movie.movieId,
          chunkIndex: rawChunks.length,
          sectionType: 'plot',
          chunkText: paragraph,
          metadata: {
            characters: movie.characters.map(c => c.name),
            events: [`Plot Narrative Act ${idx + 1}`],
            importance: idx === 0 || idx === plotParagraphs.length - 1 ? 'high' : 'medium',
          },
          sourceAttribution: movie.sourceAttribution || {
            source: 'Curated Screenplay Lore',
            license: 'RAG Knowledge Base',
          },
        });
      });

      // B. Character & relationship chunks
      if (movie.characters && movie.characters.length > 0) {
        const charOverview = movie.characters
          .map(c => `${c.name} (${c.role}, played by ${c.actor}): ${c.summary}. Key relationships: ${c.relationships?.join(', ') || 'Independent'}. Key traits: ${c.traits?.join(', ')}.`)
          .join('\n\n');

        rawChunks.push({
          movieId: movie.movieId,
          chunkIndex: rawChunks.length,
          sectionType: 'character',
          chunkText: `MAIN CHARACTERS & RELATIONSHIPS IN "${movie.title}":\n${charOverview}`,
          metadata: {
            characters: movie.characters.map(c => c.name),
            events: ['Character Roster'],
            importance: 'high',
          },
          sourceAttribution: movie.sourceAttribution,
        });
      }

      // C. Canon turning points
      if (movie.canonEvents && movie.canonEvents.length > 0) {
        movie.canonEvents.forEach(evt => {
          rawChunks.push({
            movieId: movie.movieId,
            chunkIndex: rawChunks.length,
            sectionType: 'turning_point',
            chunkText: `CANON TURNING POINT [${evt.title}]: ${evt.description} Significance: ${evt.significance}. Involved characters: ${evt.charactersInvolved?.join(', ')}. Suggested Divergence: ${evt.suggestedWhatIf || 'None'}.`,
            metadata: {
              characters: evt.charactersInvolved || [],
              events: [evt.title],
              importance: 'high',
            },
            sourceAttribution: movie.sourceAttribution,
          });
        });
      }

      // D. World Rules & Universe Lore
      if (movie.worldRules && movie.worldRules.length > 0) {
        const rulesText = movie.worldRules.map((r, i) => `Rule #${i + 1}: ${r}`).join('\n');
        rawChunks.push({
          movieId: movie.movieId,
          chunkIndex: rawChunks.length,
          sectionType: 'world_rule',
          chunkText: `CANON UNIVERSE RULES FOR "${movie.title}":\n${rulesText}`,
          metadata: {
            characters: [],
            events: ['World Lore'],
            importance: 'high',
          },
          sourceAttribution: movie.sourceAttribution,
        });
      }

      // 5. Generate semantic embeddings in batch
      job.stage = 'embedding_generation';
      await job.save();

      for (const chunk of rawChunks) {
        chunk.embedding = await embeddingService.generateEmbedding(chunk.chunkText);
        chunk.embeddingModel = embeddingService.modelName;
      }

      // 6. Insert all chunks
      job.stage = 'indexing';
      await job.save();

      await MovieChunk.insertMany(rawChunks);

      // 7. Update movie metadata
      movie.chunkCount = rawChunks.length;
      movie.dataStatus = 'verified';
      await movie.save();

      job.status = 'completed';
      job.stage = 'completed';
      job.chunksCreated = rawChunks.length;
      job.metadata.durationMs = Date.now() - startTime;
      await job.save();

      return {
        movie,
        job,
        chunksCreated: rawChunks.length,
        status: 'ingested_successfully',
      };
    } catch (error) {
      job.status = 'failed';
      job.stage = 'error';
      job.errorLogs.push({ message: error.message });
      job.metadata.durationMs = Date.now() - startTime;
      await job.save();
      throw error;
    }
  }

  /**
   * Seed all pre-configured movies
   */
  async seedAllMovies(moviesList) {
    const results = [];
    for (const movieData of moviesList) {
      try {
        const res = await this.ingestMovie(movieData, { forceReingest: false });
        results.push({ movieId: movieData.movieId, title: movieData.title, status: res.status, chunks: res.chunksCreated });
      } catch (err) {
        console.error(`Failed to seed ${movieData.title}:`, err.message);
        results.push({ movieId: movieData.movieId, title: movieData.title, status: 'error', error: err.message });
      }
    }
    return results;
  }
}

export const ingestionPipeline = new IngestionPipeline();
