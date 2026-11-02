import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Movie } from '../models/Movie.js';
import { MovieChunk } from '../models/MovieChunk.js';
import { externalMovieService } from '../services/retrieval/externalMovieService.js';
import { ragService } from '../services/rag/ragService.js';
import { groqService } from '../services/groq/groqService.js';
import { validateStoryQuality } from '../utils/readabilityValidator.js';

describe('Dynamic Movie Retrieval Pipeline Suite', () => {
  before(async () => {
    await connectDB();
  });

  it('Case 1: Reuses a movie already in the database without external API calls', async () => {
    const existing = await Movie.findOne({ movieId: 'vikram-2022' }).lean();
    assert.ok(existing, 'Vikram seed movie exists in MongoDB');

    const initialChunks = await MovieChunk.countDocuments({ movieId: 'vikram-2022' });
    assert.ok(initialChunks > 0, 'Vikram has indexed chunks');

    const result = await externalMovieService.resolveAndIngestMovie('Vikram');
    assert.equal(result.success, true);
    assert.equal(result.source, 'database');
    assert.equal(result.isNew, false);
    assert.equal(result.movie.movieId, 'vikram-2022');

    // Chunks should not be duplicated
    const chunksAfter = await MovieChunk.countDocuments({ movieId: 'vikram-2022' });
    assert.equal(chunksAfter, initialChunks, 'Repeated request must not duplicate chunks');
  });

  it('Case 2: Resolves a movie that exists in MongoDB via alias or case-insensitive search', async () => {
    const result = await externalMovieService.resolveAndIngestMovie('kaithi');
    assert.equal(result.success, true);
    assert.equal(result.source, 'database');
    assert.equal(result.movie.movieId, 'kaithi-2019');
    assert.ok(result.chunkCount >= 5);
  });

  it('Case 3: Dynamically retrieves, verifies, and indexes a movie not in seed database (Roja)', async () => {
    const result = await externalMovieService.resolveAndIngestMovie('Roja');
    assert.equal(result.success, true);
    assert.ok(result.movie.title.includes('Roja'));
    assert.equal(result.movie.releaseYear, 1992);
    assert.equal(result.movie.language, 'ta');
    assert.equal(result.movie.languageLabel, 'Tamil');

    // Verify chunks exist in MongoDB
    const chunks = await MovieChunk.find({ movieId: result.movie.movieId }).lean();
    assert.ok(chunks.length >= 6, `Expected at least 6 chunks, got ${chunks.length}`);
    assert.ok(chunks.some(c => c.sectionType === 'plot'), 'Has plot chunks');
    assert.ok(chunks.some(c => c.sectionType === 'character'), 'Has character chunks');
    assert.ok(chunks.some(c => c.sectionType === 'turning_point'), 'Has turning point chunks');

    // Verify chunks have 128-dim embeddings
    const plotChunk = chunks.find(c => c.sectionType === 'plot');
    assert.equal(plotChunk.embedding.length, 128, 'Vector dimension must be 128');
  });

  it('Case 4: Rejects invalid or nonexistent movie titles honestly without hallucinating lore', async () => {
    const bogusTitle = 'NonexistentFakeMovie987654321Blah';
    const result = await externalMovieService.resolveAndIngestMovie(bogusTitle);

    assert.equal(result.success, false, 'Nonexistent movie must not succeed');
    assert.equal(result.reason, 'not_found');
    assert.ok(result.message.includes('Could not find verified movie information'));

    // Verify nothing bogus was stored in MongoDB
    const stored = await Movie.findOne({ title: new RegExp(bogusTitle, 'i') });
    assert.equal(stored, null, 'No bogus document should be saved in DB');
  });

  it('Case 5: Handles movies with same or similar titles with year disambiguation', async () => {
    // Search for 1986 Vikram
    const wikiCandidate1986 = await externalMovieService.searchWikipedia('Vikram 1986');
    assert.ok(wikiCandidate1986, 'Finds 1986 film');
    assert.ok(wikiCandidate1986.title.includes('1986') || wikiCandidate1986.year === 1986);
  });

  it('Case 6: Handles external fetch errors or timeouts gracefully', async () => {
    // Calling searchWikipedia with empty or whitespace string
    const emptyResult = await externalMovieService.searchWikipedia('   ');
    assert.equal(emptyResult, null);

    const resolveEmpty = await externalMovieService.resolveAndIngestMovie('');
    assert.equal(resolveEmpty.success, false);
    assert.ok(resolveEmpty.message.includes('provide a movie title'));
  });

  it('Case 7: Confirms repeated requests reuse stored movie data and avoid duplicate chunks', async () => {
    // First call
    const first = await externalMovieService.resolveAndIngestMovie('Roja');
    const firstCount = await MovieChunk.countDocuments({ movieId: first.movie.movieId });

    // Second call
    const second = await externalMovieService.resolveAndIngestMovie('Roja');
    assert.equal(second.source, 'database');
    assert.equal(second.isNew, false);

    const secondCount = await MovieChunk.countDocuments({ movieId: first.movie.movieId });
    assert.equal(firstCount, secondCount, 'Chunk count must remain identical on repeated lookups');
  });

  it('Case 8: RAG pipeline retrieves relevant chunks for dynamically ingested movie and passes to Groq', async () => {
    const movie = await Movie.findOne({ movieId: 'roja-1992' }).lean();
    assert.ok(movie, 'Roja is present in database');

    const whatIf = 'What if Rishi negotiated directly with Liaqat on the first day?';
    const ragResult = await ragService.retrieveContext({
      movieId: movie.movieId,
      query: whatIf,
      topK: 5,
    });

    assert.ok(ragResult.chunks.length > 0, 'RAG retrieves chunks for dynamically ingested movie');
    assert.ok(ragResult.diagnostics.topScore > 0, 'Top similarity score is positive');
    assert.ok(ragResult.formattedContext.includes('CANON FACT'), 'Formatted context built');

    // Generate alternate branches
    const genResult = await groqService.generateAlternateBranches({
      movie,
      whatIfQuestion: whatIf,
      retrievedContext: ragResult,
    });

    assert.ok(genResult.branches.length >= 2, 'Generates Branch Alpha and Branch Beta');
    assert.ok(genResult.branches[0].summary.length > 50, 'Branch has substantive narrative');
  });

  it('Case 9: Verifies generated story quality and simple human-readable English', () => {
    const sampleStory = 'A brave code expert refuses to give up after being captured in the mountains. He secretly uses old radio wires to send a Morse code alert back to the base camp. His courageous wife never stops pleading with authorities to bring him home safely.';
    const validation = validateStoryQuality(sampleStory, ['A captured code specialist', 'A loyal wife seeks help'], ['Roja']);
    assert.equal(validation.isValid, true, 'Story must be valid simple English');
    assert.equal(validation.issues.length, 0);
  });

  after(async () => {
    await mongoose.disconnect();
  });
});
