import mongoose from 'mongoose';

const MovieChunkSchema = new mongoose.Schema({
  movieId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  sectionType: {
    type: String,
    enum: ['plot', 'character', 'world_rule', 'turning_point'],
    required: true,
    index: true,
  },
  chunkText: { type: String, required: true },
  metadata: {
    characters: [{ type: String }],
    events: [{ type: String }],
    importance: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },
  },
  sourceAttribution: {
    source: { type: String, default: 'Curated Movie Canon & Verified Script Knowledge Base' },
    license: { type: String, default: 'Educational / Interactive RAG Analysis' },
  },
  embedding: {
    type: [Number],
    default: [],
  },
  embeddingModel: {
    type: String,
    default: 'whatif-semantic-v1',
  },
}, {
  timestamps: true,
});

MovieChunkSchema.index({ movieId: 1, sectionType: 1 });
MovieChunkSchema.index({ chunkText: 'text' });

export const MovieChunk = mongoose.model('MovieChunk', MovieChunkSchema);
