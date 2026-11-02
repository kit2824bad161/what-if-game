import mongoose from 'mongoose';
import { GameRoom } from '../models/GameRoom.js';

// In-memory active room cache for instant sub-millisecond socket sync
const activeRooms = new Map();

/**
 * Generate clean 6-character room code (e.g. "WHAT42", "NEXUS7")
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class RoomManager {
  /**
   * Create a new room
   */
  async createRoom({ hostId, hostName, socketId, mode = 'movieGuess' }) {
    let roomCode = generateRoomCode();
    while (activeRooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const hostPlayer = {
      playerId: hostId,
      name: hostName,
      socketId,
      isHost: true,
      isReady: true,
      score: 0,
      connected: true,
    };

    const room = {
      roomCode,
      mode,
      status: 'lobby',
      hostId,
      players: [hostPlayer],
      maxPlayers: 2,
      currentRoundNumber: 1,
      totalRounds: 3,
      selectedMovieId: '',
      roomState: {},
      createdAt: Date.now(),
    };

    activeRooms.set(roomCode, room);

    // Save to DB asynchronously if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const dbRoom = new GameRoom(room);
        await dbRoom.save();
      } catch (err) {
        console.warn(`[RoomManager] DB room save deferred: ${err.message}`);
      }
    }

    return room;
  }

  /**
   * Get room by code
   */
  getRoom(roomCode) {
    if (!roomCode) return null;
    return activeRooms.get(roomCode.toUpperCase()) || null;
  }

  /**
   * Join existing room
   */
  async joinRoom({ roomCode, playerId, playerName, socketId }) {
    const code = roomCode.toUpperCase();
    const room = activeRooms.get(code);

    if (!room) {
      throw new Error(`Room "${code}" not found.`);
    }

    // Check if player is reconnecting
    const existingPlayer = room.players.find(p => p.playerId === playerId);
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      existingPlayer.name = playerName || existingPlayer.name;
      return room;
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error(`Room "${code}" is already full (Max 2 players).`);
    }

    const newPlayer = {
      playerId,
      name: playerName,
      socketId,
      isHost: false,
      isReady: false,
      score: 0,
      connected: true,
    };

    room.players.push(newPlayer);
    return room;
  }

  /**
   * Player toggle readiness
   */
  toggleReady(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.playerId === playerId);
    if (player) {
      player.isReady = !player.isReady;
    }
    return room;
  }

  /**
   * Change room mode (host only)
   */
  setMode(roomCode, hostId, newMode) {
    const room = this.getRoom(roomCode);
    if (!room || room.hostId !== hostId) return null;
    room.mode = newMode;
    return room;
  }

  /**
   * Remove player on disconnect
   */
  handleDisconnect(socketId) {
    for (const [code, room] of activeRooms.entries()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.connected = false;
        return { roomCode: code, player, room };
      }
    }
    return null;
  }
}

export const roomManager = new RoomManager();
