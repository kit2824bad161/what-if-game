import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  branchId: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  immediateConsequences: [{ type: String }],
  characterConsequences: [{
    character: { type: String, required: true },
    change: { type: String, required: true },
  }],
  plotConsequences: [{ type: String }],
  canonFactsUsed: [{ type: String }],
  hypotheticalEvents: [{ type: String }],
  continuityWarnings: [{
    type: { type: String, default: 'warning' },
    message: { type: String, required: true },
  }],
  isSelected: { type: Boolean, default: false },
}, { _id: false });

const TurnSchema = new mongoose.Schema({
  turnNumber: { type: Number, required: true },
  userPrompt: { type: String, required: true },
  chosenBranchId: { type: String, default: '' },
  continuationTitle: { type: String, default: '' },
  narrativeText: { type: String, required: true },
  canonFactsReferenced: [{ type: String }],
  newHypotheticalFacts: [{ type: String }],
  characterStatusUpdates: [{
    character: { type: String },
    status: { type: String },
  }],
  continuityWarnings: [{ type: String }],
  contributedBy: { type: String, default: 'solo' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const StoryTimelineSchema = new mongoose.Schema({
  timelineId: { type: String, required: true, unique: true, index: true },
  guestId: { type: String, required: true, index: true },
  movieId: { type: String, required: true, index: true },
  movieTitle: { type: String, required: true },
  posterUrl: { type: String, default: '' },
  customTitle: { type: String, default: 'Untitled Alternate Universe' },
  initialScenario: { type: String, required: true },
  initialBranches: [BranchSchema],
  activeBranchId: { type: String, default: '' },
  turns: [TurnSchema],
  currentSummary: { type: String, default: '' },
  isSaved: { type: Boolean, default: false, index: true },
  mode: { type: String, enum: ['solo', 'coop'], default: 'solo' },
}, {
  timestamps: true,
});

StoryTimelineSchema.index({ guestId: 1, isSaved: 1 });

export const StoryTimeline = mongoose.model('StoryTimeline', StoryTimelineSchema);
