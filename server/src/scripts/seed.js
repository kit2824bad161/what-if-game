import { connectDB } from '../config/db.js';
import { seedMovies } from '../data/seedMovies.js';
import { ingestionPipeline } from '../services/ingestion/ingestionPipeline.js';
import mongoose from 'mongoose';

async function runSeed() {
  console.log('[Seed] Starting WHAT IF movie database seeding...');
  await connectDB();

  console.log(`[Seed] Processing ${seedMovies.length} curated movie universes...`);
  const results = await ingestionPipeline.seedAllMovies(seedMovies);

  console.log('\n--- SEEDING RESULTS ---');
  results.forEach(r => {
    console.log(`[${r.status.toUpperCase()}] ${r.title} (${r.movieId}) -> ${r.chunks || 0} chunks`);
  });
  console.log('-----------------------\n');

  console.log('[Seed] Seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch(err => {
  console.error('[Seed] Seeding failed with error:', err);
  process.exit(1);
});
