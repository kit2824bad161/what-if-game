import crypto from 'crypto';
import { config } from '../../config/env.js';

/**
 * Pluggable Embedding Service
 * Keeps embedding generation independent from LLM generation.
 * Supports:
 * - 'local': High-performance deterministic n-gram semantic vectorizer (128 dimensions)
 * - 'openai' / 'huggingface': External provider adapter when configured
 */

const VECTOR_DIMENSIONS = 128;

// Curated movie domain stop words
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'this', 'but', 'they', 'have', 'had', 'what', 'if', 'when', 'who', 'how'
]);

/**
 * Tokenize and normalize text into meaningful terms and bigrams
 */
function tokenize(text) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  const tokens = [...words];
  // Add bigrams for contextual phrase matching
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]}_${words[i + 1]}`);
  }
  return tokens;
}

/**
 * Fast string hash into a vector dimension bucket [0, VECTOR_DIMENSIONS)
 */
function hashToBucket(str, dim) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % dim;
}

/**
 * Generate a dense L2-normalized semantic vector for text
 */
function generateLocalEmbedding(text) {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return vector;
  }

  // Frequency weighting
  const termCounts = new Map();
  for (const token of tokens) {
    termCounts.set(token, (termCounts.get(token) || 0) + 1);
  }

  for (const [token, count] of termCounts.entries()) {
    const bucket = hashToBucket(token, VECTOR_DIMENSIONS);
    // Sublinear term frequency weighting
    const weight = 1 + Math.log(count);
    // Secondary hash for sign to reduce collision interference
    const signBucket = hashToBucket(token + '_sign', 2);
    const sign = signBucket === 0 ? 1 : -1;
    vector[bucket] += sign * weight;
  }

  // L2 Normalization so dot product = cosine similarity
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}

export class EmbeddingService {
  constructor() {
    this.provider = config.embeddings.provider || 'local';
    this.dimensions = VECTOR_DIMENSIONS;
    this.modelName = `whatif-${this.provider}-v1`;
  }

  /**
   * Generates embedding vector for a single string
   */
  async generateEmbedding(text) {
    if (this.provider === 'local') {
      return generateLocalEmbedding(text);
    }

    // Extensible hook for external providers
    if (this.provider === 'openai' && config.embeddings.apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.embeddings.apiKey}`,
          },
          body: JSON.stringify({
            input: text,
            model: 'text-embedding-3-small',
          }),
        });
        const data = await response.json();
        if (data?.data?.[0]?.embedding) {
          return data.data[0].embedding;
        }
      } catch (err) {
        console.warn(`[EmbeddingService] External embedding provider failed, falling back to local: ${err.message}`);
      }
    }

    return generateLocalEmbedding(text);
  }

  /**
   * Batch embedding generation
   */
  async generateBatchEmbeddings(texts) {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }

  /**
   * Cosine similarity between two normalized vectors
   */
  computeCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  }
}

export const embeddingService = new EmbeddingService();
