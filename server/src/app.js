import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { expressCorsOptions } from './config/cors.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

import healthRoutes from './routes/health.js';
import movieRoutes from './routes/movies.js';
import ragRoutes from './routes/rag.js';
import timelineRoutes from './routes/timelines.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Trust reverse proxy (Vercel, AWS, Cloudflare) for accurate client IP resolution
app.set('trust proxy', 1);

// Security and CORS supporting production Vercel domains, custom domains, and local/LAN origins
app.use(cors(expressCorsOptions));
app.options('*', cors(expressCorsOptions));

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Rate Limiting (90 requests per minute per IP)
app.use(rateLimiter({ windowMs: 60000, maxRequests: 90 }));

// Database connection middleware: ensures MongoDB connection is established / reused
// across both serverless invocations (Vercel) and long-running container processes
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn(`[DB Middleware] Connection error: ${err.message}`);
  }
  next();
});

// Root informational endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'WHAT IF — The Alternate Movie Universe API',
    version: '1.0.0',
    status: 'online',
    health: '/api/health',
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'WHAT IF API Root',
    status: 'online',
    endpoints: [
      '/api/health',
      '/api/movies',
      '/api/movies/featured',
      '/api/rag/retrieve',
      '/api/rag/generate-branches',
      '/api/rag/exact-story',
      '/api/timelines',
      '/api/admin/status',
    ],
  });
});

// REST API routes
app.use('/api/health', healthRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/timelines', timelineRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

export default app;
