import { MovieChunk } from '../../models/MovieChunk.js';
import { embeddingService } from '../embeddings/embeddingService.js';

export class RagService {
  /**
   * Retrieve relevant movie chunks for a given query and movieId
   */
  async retrieveContext({ movieId, query, sectionType = null, topK = 6, contextBudgetWords = 1200 }) {
    const startTime = Date.now();

    // 1. Generate query embedding vector
    const queryVector = await embeddingService.generateEmbedding(query);

    // 2. Query filter
    const filter = { movieId };
    if (sectionType) {
      filter.sectionType = sectionType;
    }

    // 3. Fetch chunks for this movie
    const chunks = await MovieChunk.find(filter).lean();

    if (!chunks || chunks.length === 0) {
      return {
        chunks: [],
        formattedContext: 'No verified canon chunks found for this movie.',
        diagnostics: {
          totalCandidateChunks: 0,
          retrievedCount: 0,
          durationMs: Date.now() - startTime,
          topScore: 0,
          method: 'vector_semantic_hybrid',
        },
      };
    }

    // 4. Tokenize query for lexical scoring
    const queryTerms = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(t => t.length > 2);

    // 5. Score each chunk
    const scoredChunks = chunks.map(chunk => {
      // Semantic vector cosine similarity
      const vectorScore = chunk.embedding && chunk.embedding.length > 0
        ? embeddingService.computeCosineSimilarity(queryVector, chunk.embedding)
        : 0;

      // Lexical keyword match score
      const chunkLower = chunk.chunkText.toLowerCase();
      let lexicalHits = 0;
      for (const term of queryTerms) {
        if (chunkLower.includes(term)) {
          lexicalHits++;
        }
      }
      const lexicalScore = queryTerms.length > 0 ? Math.min(1, lexicalHits / queryTerms.length) : 0;

      // Metadata importance bonus
      let bonus = 0;
      if (chunk.sectionType === 'turning_point') bonus += 0.05;
      if (chunk.metadata?.importance === 'high') bonus += 0.03;

      // Hybrid combined score: 70% semantic, 30% lexical + bonus
      const combinedScore = (vectorScore * 0.7) + (lexicalScore * 0.3) + bonus;

      return {
        ...chunk,
        score: Number(combinedScore.toFixed(4)),
        semanticScore: Number(vectorScore.toFixed(4)),
        lexicalScore: Number(lexicalScore.toFixed(4)),
      };
    });

    // 6. Sort by combined score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // 7. Enforce top-K and word budget
    const selectedChunks = [];
    let currentWords = 0;

    for (const chunk of scoredChunks) {
      if (selectedChunks.length >= topK) break;
      const wordCount = chunk.chunkText.split(/\s+/).length;
      if (currentWords + wordCount > contextBudgetWords && selectedChunks.length >= 2) {
        break; // Stop if budget exceeded unless we have fewer than 2 chunks
      }
      selectedChunks.push(chunk);
      currentWords += wordCount;
    }

    // 8. Build formatted context string with attribution & tags
    const formattedContext = selectedChunks
      .map((c, i) => `[CANON FACT #${i + 1} | Section: ${c.sectionType.toUpperCase()} | Attribution: ${c.sourceAttribution?.source || 'Movie Canon'}]\n${c.chunkText}`)
      .join('\n\n');

    return {
      chunks: selectedChunks.map(c => ({
        id: c._id,
        chunkIndex: c.chunkIndex,
        sectionType: c.sectionType,
        text: c.chunkText,
        score: c.score,
        semanticScore: c.semanticScore,
        metadata: c.metadata,
        attribution: c.sourceAttribution,
      })),
      formattedContext,
      diagnostics: {
        totalCandidateChunks: chunks.length,
        retrievedCount: selectedChunks.length,
        durationMs: Date.now() - startTime,
        topScore: selectedChunks[0]?.score || 0,
        lowestScore: selectedChunks[selectedChunks.length - 1]?.score || 0,
        contextWords: currentWords,
        method: 'vector_semantic_hybrid',
      },
    };
  }
}

export const ragService = new RagService();
