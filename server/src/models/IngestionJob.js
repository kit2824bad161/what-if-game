import mongoose from 'mongoose';

const IngestionJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  movieId: { type: String, required: true, index: true },
  movieTitle: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  stage: {
    type: String,
    enum: ['metadata_fetch', 'plot_extraction', 'chunking', 'embedding_generation', 'indexing', 'completed', 'error'],
    default: 'metadata_fetch',
  },
  chunksCreated: { type: Number, default: 0 },
  errorLogs: [{
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  metadata: {
    source: { type: String, default: 'TMDB & Curated Movie Knowledge Base' },
    embeddingModel: { type: String, default: 'whatif-semantic-v1' },
    durationMs: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

export const IngestionJob = mongoose.model('IngestionJob', IngestionJobSchema);
