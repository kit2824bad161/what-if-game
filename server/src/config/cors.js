import { config } from './env.js';

/**
 * Checks whether an incoming origin is permitted.
 * Allows:
 * 1. Requests with no origin header (curl, mobile apps, server-to-server)
 * 2. Explicitly configured config.clientUrl (supports single URL or comma-separated list)
 * 3. Localhost & 127.0.0.1 on ports 5173 (Vite), 4173 (preview), 5000 (backend)
 * 4. Standard private IPv4 LAN addresses (RFC 1918): 10.x, 172.16-31.x, 192.168.x on port 5173, 4173, or 5000
 * 5. Production and preview deployments on Vercel (*.vercel.app)
 */
export const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  // Trim trailing slash for normalized comparison
  const normalized = origin.trim().replace(/\/+$/, '');

  // 1. Explicitly configured CLIENT_URL (supports comma-separated list)
  if (config.clientUrl && typeof config.clientUrl === 'string') {
    const configuredOrigins = config.clientUrl
      .split(',')
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    if (configuredOrigins.includes(normalized)) {
      return true;
    }
  }

  // 2. Localhost & Loopback on game dev ports
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:(5173|4173|5000))?$/.test(normalized)) {
    return true;
  }

  // 3. Private LAN Subnets (10.x.x.x, 172.16-31.x.x, 192.168.x.x) on game dev ports
  const lanPattern = /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:(5173|4173|5000))?$/;
  if (lanPattern.test(normalized)) {
    return true;
  }

  // 4. Vercel deployment domains (production and git preview branches)
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(normalized)) {
    return true;
  }

  return false;
};

/**
 * Express CORS middleware options
 */
export const expressCorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked unauthorized origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  maxAge: 86400,
};

/**
 * Socket.IO CORS options
 */
export const socketCorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[Socket.IO CORS] Blocked unauthorized origin: ${origin}`);
      callback(new Error(`Socket.IO CORS blocked for unauthorized origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};
