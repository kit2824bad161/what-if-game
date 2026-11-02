import mongoose from 'mongoose';

const CharacterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  actor: { type: String, default: '' },
  role: { type: String, default: '' },
  summary: { type: String, default: '' },
  relationships: [{ type: String }],
  traits: [{ type: String }],
}, { _id: false });

const CanonEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  significance: { type: String, default: 'critical' },
  charactersInvolved: [{ type: String }],
  canBeWhatIfTrigger: { type: Boolean, default: true },
  suggestedWhatIf: { type: String, default: '' },
}, { _id: false });

const MovieSchema = new mongoose.Schema({
  movieId: { type: String, required: true, unique: true, index: true },
  tmdbId: { type: Number, default: null },
  title: { type: String, required: true, index: true },
  originalTitle: { type: String, default: '' },
  aliases: [{ type: String }],
  releaseYear: { type: Number, required: true },
  language: { type: String, required: true, index: true }, // 'ta' for Tamil, 'en', etc.
  languageLabel: { type: String, default: 'Tamil' },
  genres: [{ type: String, index: true }],
  director: { type: String, default: '' },
  overview: { type: String, required: true },
  plotSummary: { type: String, required: true },
  posterUrl: { type: String, default: '' },
  backdropUrl: { type: String, default: '' },
  characters: [CharacterSchema],
  canonEvents: [CanonEventSchema],
  worldRules: [{ type: String }],
  isReleased: { type: Boolean, default: true },
  releaseStatus: {
    type: String,
    enum: ['released', 'unreleased', 'upcoming'],
    default: 'released',
  },
  releaseDate: { type: String, default: '' },
  dataStatus: {
    type: String,
    enum: ['verified', 'partial', 'pending'],
    default: 'verified',
  },
  chunkCount: { type: Number, default: 0 },
  sourceAttribution: {
    sources: [{ type: String }],
    lastVerified: { type: Date, default: Date.now },
  },
  isFeatured: { type: Boolean, default: false },
}, {
  timestamps: true,
});

MovieSchema.index({ title: 'text', overview: 'text', plotSummary: 'text' });

export const Movie = mongoose.model('Movie', MovieSchema);
