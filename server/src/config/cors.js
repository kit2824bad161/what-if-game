import { config } from './env.js';

/**
 * Checks whether an incoming origin is permitted.
 * Allows:
 * 1. Requests with no origin header (curl, mobile apps, local tools)
 * 2. Explicitly configured config.clientUrl
 * 3. Localhost & 127.0.0.1 on ports 5173 (Vite), 4173 (preview), 5000 (backend)
 * 4. Standard private IPv4 LAN addresses (RFC 1918):
 *    - 10.0.0.0 - 10.255.255.255
 *    - 172.16.0.0 - 172.31.255.255
 *    - 192.168.0.0 - 192.168.255.255
 *    on port 5173, 4173, or 5000
 */
export const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  // Trim trailing slash for normalized comparison
  const normalized = origin.replace(/\/$/, '');

  // 1. Explicitly configured CLIENT_URL
  if (config.clientUrl && (normalized === config.clientUrl || normalized === config.clientUrl.replace(/\/$/, ''))) {
    return true;
  }

  // 2. Localhost & Loopback
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:(5173|4173|5000))?$/.test(normalized)) {
    return true;
  }

  // 3. Private LAN Subnets (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
  const lanPattern = /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:(5173|4173|5000))?$/;
  if (lanPattern.test(normalized)) {
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
      callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
};

/**
 * Socket.IO CORS options
 */
export const socketCorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Socket.IO CORS blocked for unauthorized origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};
