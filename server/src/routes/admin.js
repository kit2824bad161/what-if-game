import { Router } from 'express';
import { Movie } from '../models/Movie.js';
import { MovieChunk } from '../models/MovieChunk.js';
import { IngestionJob } from '../models/IngestionJob.js';
import { config, getIntegrationStatus } from '../config/env.js';
import { ragService } from '../services/rag/ragService.js';
import { ingestionPipeline } from '../services/ingestion/ingestionPipeline.js';
import { seedMovies } from '../data/seedMovies.js';

const router = Router();

// Admin auth middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['x-admin-key'] || req.query.adminKey;
  if (!authHeader || authHeader !== config.admin.secretKey) {
    return res.status(401).json({
      error: true,
      message: 'Unauthorized: Valid x-admin-key header required to access developer console.',
    });
  }
  next();
};

/**
 * GET /api/admin/status
 * High-level knowledge base and system diagnostics
 */
router.get('/status', verifyAdmin, async (req, res, next) => {
  try {
    const movieCount = await Movie.countDocuments();
    const chunkCount = await MovieChunk.countDocuments();
    const jobCount = await IngestionJob.countDocuments();
    const verifiedMovies = await Movie.countDocuments({ dataStatus: 'verified' });

    const chunksByType = await MovieChunk.aggregate([
      { $group: { _id: '$sectionType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      diagnostics: {
        movieCount,
        verifiedMovies,
        chunkCount,
        jobCount,
        chunksByType: Object.fromEntries(chunksByType.map(c => [c._id, c.count])),
        integrations: getIntegrationStatus(),
        embeddingDimensions: 128,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/jobs
 */
router.get('/jobs', verifyAdmin, async (req, res, next) => {
  try {
    const jobs = await IngestionJob.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/chunks/:movieId
 * Inspect chunks and vector data for a specific movie
 */
router.get('/chunks/:movieId', verifyAdmin, async (req, res, next) => {
  try {
    const chunks = await MovieChunk.find({ movieId: req.params.movieId })
      .sort({ chunkIndex: 1 })
      .lean();

    res.json({
      success: true,
      movieId: req.params.movieId,
      chunkCount: chunks.length,
      chunks: chunks.map(c => ({
        id: c._id,
        chunkIndex: c.chunkIndex,
        sectionType: c.sectionType,
        text: c.chunkText,
        metadata: c.metadata,
        attribution: c.sourceAttribution,
        embeddingSample: c.embedding?.slice(0, 5) || [],
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/test-retrieval
 * Benchmark test for RAG search
 */
router.post('/test-retrieval', verifyAdmin, async (req, res, next) => {
  try {
    const { movieId = 'vikram-2022', query = 'Amar discovers Vikram is alive' } = req.body;
    const result = await ragService.retrieveContext({ movieId, query, topK: 5 });

    res.json({
      success: true,
      testQuery: query,
      movieId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/reseed
 * Re-seed movies from curated seed library
 */
router.post('/reseed', verifyAdmin, async (req, res, next) => {
  try {
    const results = await ingestionPipeline.seedAllMovies(seedMovies);
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

export default router;
