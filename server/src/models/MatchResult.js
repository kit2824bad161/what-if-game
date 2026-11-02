import mongoose from 'mongoose';

const MatchResultSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  mode: { type: String, required: true },
  players: [{
    playerId: { type: String, required: true },
    name: { type: String, required: true },
    score: { type: Number, default: 0 },
  }],
  winnerId: { type: String, default: '' },
  winnerName: { type: String, default: '' },
  isDraw: { type: Boolean, default: false },
  roundHistory: [{ type: mongoose.Schema.Types.Mixed }],
  aiSummary: { type: String, default: '' },
}, {
  timestamps: true,
});

export const MatchResult = mongoose.model('MatchResult', MatchResultSchema);
