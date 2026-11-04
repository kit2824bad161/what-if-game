import mongoose from 'mongoose';
import { config } from './env.js';

/**
 * Global cache across warm serverless function invocations (Vercel / AWS Lambda)
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Sanitizes connection URI for logs and diagnostics
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return 'not_configured';
  return uri.replace(/\/\/[^:@]+:[^@]+@/, '//***:***@');
};

/**
 * Connects to MongoDB with connection reuse for serverless and persistent runtimes
 */
export const connectDB = async () => {
  // If connection is already open, reuse it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection attempt is currently in-flight, await the same promise
  if (cached.promise && mongoose.connection.readyState === 2) {
    return cached.promise;
  }

  if (!config.mongodbUri) {
    console.warn('[Database] MONGODB_URI is not configured in environment.');
    return null;
  }

  const opts = {
    bufferCommands: false, // Fail fast in serverless rather than buffering operations until 504 timeout
    serverSelectionTimeoutMS: 5000, // 5 second timeout for replica set discovery
    connectTimeoutMS: 10000,
    maxPoolSize: 10, // Optimal pool size for serverless lambda instances
  };

  cached.promise = mongoose
    .connect(config.mongodbUri, opts)
    .then((m) => {
      console.log(`[Database] MongoDB connected successfully: ${m.connection.host}/${m.connection.name}`);
      cached.conn = m.connection;
      return cached.conn;
    })
    .catch((error) => {
      const sanitizedMsg = error.message ? error.message.replace(/:[^:@]+@/, ':****@') : 'Unknown error';
      console.error(`[Database] MongoDB connection failed: ${sanitizedMsg}`);
      console.warn(`[Database] Target URI: ${sanitizeMongoUri(config.mongodbUri)}`);
      cached.promise = null;
      cached.conn = null;
      return null;
    });

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    return null;
  }

  return cached.conn;
};

/**
 * Safe connection diagnostics without exposing credentials
 */
export const getConnectionStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    isConnected: readyState === 1,
    status: states[readyState] || 'unknown',
    readyState,
    database: mongoose.connection.name || null,
    host: mongoose.connection.host ? mongoose.connection.host.split('.')[0] + '.[...]' : null,
  };
};
