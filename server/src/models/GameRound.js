import mongoose from 'mongoose';

const PlayerSubmissionSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  submissionText: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
  feedback: {
    creativityScore: { type: Number, default: 0 },
    canonScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    commentary: { type: String, default: '' },
    strongestElement: { type: String, default: '' },
    weakestElement: { type: String, default: '' },
  },
}, { _id: false });

const GameRoundSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  roundNumber: { type: Number, required: true },
  mode: { type: String, required: true },
  publicScenario: { type: String, default: '' },
  // Server-side private data (never sent to guesser or competitor client)
  privateData: {
    secretMovieId: { type: String, default: '' },
    secretMovieTitle: { type: String, default: '' },
    hiddenStoryPrompt: { type: String, default: '' },
    blocklist: [{ type: String }],
    hintsAvailable: [{ type: String }],
    hintsUnlocked: { type: Number, default: 0 },
  },
  submissions: [PlayerSubmissionSchema],
  aiJudgeReport: {
    winnerPlayerId: { type: String, default: '' },
    summary: { type: String, default: '' },
    detailedAnalysis: { type: String, default: '' },
  },
  isRevealed: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const GameRound = mongoose.model('GameRound', GameRoundSchema);
