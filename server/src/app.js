import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { expressCorsOptions } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

import healthRoutes from './routes/health.js';
import movieRoutes from './routes/movies.js';
import ragRoutes from './routes/rag.js';
import timelineRoutes from './routes/timelines.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Security and CORS supporting LAN origins
app.use(cors(expressCorsOptions));

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Rate Limiting (60 requests per minute per IP)
app.use(rateLimiter({ windowMs: 60000, maxRequests: 90 }));

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
