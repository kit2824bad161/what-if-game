import os from 'os';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initializeSockets } from './sockets/socketHandler.js';
import { socketCorsOptions } from './config/cors.js';

const server = http.createServer(app);

// Helper to find local IPv4 network address
function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Socket.IO server initialization supporting LAN testing
const io = new Server(server, {
  cors: socketCorsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
});

initializeSockets(io);

// Boot server
async function startServer() {
  await connectDB();

  server.listen(config.port, '0.0.0.0', () => {
    const lanIp = getLanIp();
    console.log(`====================================================`);
    console.log(`   WHAT IF — The Alternate Movie Universe Backend   `);
    console.log(`====================================================`);
    console.log(`[Server] Local:   http://localhost:${config.port}`);
    console.log(`[Server] Network: http://${lanIp}:${config.port}`);
    console.log(`[Server] Host:    0.0.0.0 (Port ${config.port})`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    console.log(`[Server] Groq Mode: ${config.groq.hasKey ? 'Live API (' + config.groq.model + ')' : 'Simulated Fallback Engine'}`);
    console.log(`[Server] Embeddings: ${config.embeddings.provider} (128-dim normalized cosine)`);
    console.log(`[Server] Real-time Multiplayer: Socket.IO initialized (WebSocket + Polling)`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

// Graceful shutdown handling for container and persistent cloud hosts
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  try {
    io.close(() => {
      console.log('[Server] Socket.IO server closed.');
    });

    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await mongoose.disconnect();
        console.log('[Database] MongoDB disconnected cleanly.');
      } catch (err) {
        console.error('[Database] Disconnect error:', err.message);
      }
      process.exit(0);
    });

    // Fallback force shutdown if connections hang beyond 10 seconds
    setTimeout(() => {
      console.error('[Server] Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000).unref();
  } catch (err) {
    console.error('[Server] Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
