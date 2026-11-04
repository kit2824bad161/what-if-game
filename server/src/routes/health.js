import { Router } from 'express';
import { getConnectionStatus, connectDB } from '../config/db.js';
import { config, getIntegrationStatus } from '../config/env.js';

const router = Router();

/**
 * GET /api/health
 * Public, safe operational health probe for Vercel, monitoring, and frontend status checks
 * Never exposes passwords, API keys, or connection credentials
 */
router.get('/', async (req, res) => {
  let dbStatus = getConnectionStatus();

  // If disconnected, try a quick reconnect before reporting degraded status
  if (!dbStatus.isConnected) {
    try {
      await connectDB();
      dbStatus = getConnectionStatus();
    } catch {
      // Continue to report status
    }
  }

  const integrations = getIntegrationStatus();
  const isHealthy = dbStatus.isConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.status,
      isConnected: dbStatus.isConnected,
      name: dbStatus.database,
    },
    integrations: {
      groq: integrations.groq,
      embeddings: integrations.embeddings,
      tmdb: integrations.tmdb,
    },
  });
});

export default router;
