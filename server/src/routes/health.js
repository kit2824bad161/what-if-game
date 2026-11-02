import { Router } from 'express';
import { getConnectionStatus } from '../config/db.js';
import { getIntegrationStatus } from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = getConnectionStatus();
  const integrations = getIntegrationStatus();

  const isHealthy = dbStatus.isConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    integrations,
  });
});

export default router;
