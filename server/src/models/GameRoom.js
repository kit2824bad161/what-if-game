import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  socketId: { type: String, default: '' },
  isHost: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  connected: { type: Boolean, default: true },
}, { _id: false });

const GameRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  mode: {
    type: String,
    enum: ['movieGuess', 'coOpStory', 'storyBattle'],
    required: true,
  },
  status: {
    type: String,
    enum: ['lobby', 'in_progress', 'round_complete', 'game_over'],
    default: 'lobby',
    index: true,
  },
  hostId: { type: String, required: true },
  players: [PlayerSchema],
  maxPlayers: { type: Number, default: 2 },
  currentRoundNumber: { type: Number, default: 1 },
  totalRounds: { type: Number, default: 3 },
  selectedMovieId: { type: String, default: '' },
  roomState: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastActive: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export const GameRoom = mongoose.model('GameRoom', GameRoomSchema);
