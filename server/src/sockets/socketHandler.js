import { roomManager } from './roomManager.js';
import { registerMovieGuessHandlers } from './movieGuessHandler.js';
import { registerCoOpStoryHandlers } from './coOpStoryHandler.js';
import { registerStoryBattleHandlers } from './storyBattleHandler.js';

export function initializeSockets(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Room: Create Room
    socket.on('room:create', async ({ hostId, hostName, mode }) => {
      try {
        const room = await roomManager.createRoom({
          hostId,
          hostName,
          socketId: socket.id,
          mode: mode || 'movieGuess',
        });
        socket.join(room.roomCode);
        socket.emit('room:created', room);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Room: Join Room
    socket.on('room:join', async ({ roomCode, playerId, playerName }) => {
      try {
        const room = await roomManager.joinRoom({
          roomCode,
          playerId,
          playerName,
          socketId: socket.id,
        });
        socket.join(room.roomCode);
        io.to(room.roomCode).emit('room:updated', room);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Room: Toggle Ready
    socket.on('room:toggle_ready', ({ roomCode, playerId }) => {
      const room = roomManager.toggleReady(roomCode, playerId);
      if (room) {
        io.to(roomCode).emit('room:updated', room);
      }
    });

    // Room: Set Mode (Host only)
    socket.on('room:set_mode', ({ roomCode, hostId, mode }) => {
      const room = roomManager.setMode(roomCode, hostId, mode);
      if (room) {
        io.to(roomCode).emit('room:updated', room);
      }
    });

    // Room: Return to Lobby
    socket.on('room:return_to_lobby', ({ roomCode }) => {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        room.status = 'lobby';
        room.roomState = {};
        io.to(roomCode).emit('room:updated', room);
      }
    });

    // Room: Start Game (Host only)
    socket.on('room:start_game', ({ roomCode, hostId }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found.' });

      const callerPlayer = room.players.find(p => p.socketId === socket.id || (hostId && p.playerId === hostId));
      if (!callerPlayer || callerPlayer.playerId !== room.hostId) {
        return socket.emit('error', { message: 'Only the host can start the game.' });
      }

      room.status = 'playing';
      io.to(room.roomCode).emit('room:updated', room);
      io.to(room.roomCode).emit('room:game_started', room);
    });

    // Room: Sync socket connection / re-bind player
    socket.on('room:sync', ({ roomCode, playerId, playerName }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found.' });

      socket.join(room.roomCode);
      if (playerId) {
        const player = room.players.find(p => p.playerId === playerId);
        if (player) {
          player.socketId = socket.id;
          player.connected = true;
          if (playerName) player.name = playerName;
        }
      }
      socket.emit('room:updated', room);
    });

    // Register mode-specific handlers
    registerMovieGuessHandlers(io, socket, roomManager);
    registerCoOpStoryHandlers(io, socket, roomManager);
    registerStoryBattleHandlers(io, socket, roomManager);

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const dis = roomManager.handleDisconnect(socket.id);
      if (dis) {
        io.to(dis.roomCode).emit('room:updated', dis.room);
      }
    });
  });
}
