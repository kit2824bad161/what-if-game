import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback if started from workspace root or other working directory
if (!process.env.GROQ_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
}
if (!process.env.GROQ_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatif_movies',
  groq: {
    apiKey: (process.env.GROQ_API_KEY || '').trim(),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    fallbackModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
    ],
    hasKey: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0),
  },
  tmdb: {
    apiKey: (process.env.TMDB_API_KEY || '').trim(),
    hasKey: Boolean(process.env.TMDB_API_KEY && process.env.TMDB_API_KEY.trim().length > 0),
  },
  embeddings: {
    provider: process.env.EMBEDDING_PROVIDER || 'local',
    apiKey: process.env.EMBEDDING_API_KEY || '',
  },
  admin: {
    secretKey: process.env.ADMIN_SECRET_KEY || 'whatif_dev_admin_secret_2026',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

export const getIntegrationStatus = () => ({
  groq: {
    configured: config.groq.hasKey,
    model: config.groq.model,
    mode: config.groq.hasKey ? 'live_api' : 'simulated_fallback',
  },
  tmdb: {
    configured: config.tmdb.hasKey,
    mode: config.tmdb.hasKey ? 'live_api' : 'curated_seed_data',
  },
  embeddings: {
    provider: config.embeddings.provider,
    status: 'active',
  },
  database: {
    uriConfigured: Boolean(config.mongodbUri),
    type: config.mongodbUri.includes('mongodb+srv') ? 'mongodb_atlas' : 'local_mongodb',
  },
});
