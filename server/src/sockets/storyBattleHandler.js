import { Movie } from '../models/Movie.js';
import { ragService } from '../services/rag/ragService.js';
import { groqService } from '../services/groq/groqService.js';
import { MatchResult } from '../models/MatchResult.js';

export function registerStoryBattleHandlers(io, socket, roomManager) {
  /**
   * Host starts the Story Battle
   */
  socket.on('battle:start', async ({ roomCode, movieId, scenarioPrompt, timerSeconds = 90 }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found.' });

      const movie = await Movie.findOne({ movieId }).lean();
      if (!movie) return socket.emit('error', { message: 'Movie not found.' });

      // Retrieve canon context for the battle
      const retrievedContext = await ragService.retrieveContext({
        movieId,
        query: scenarioPrompt,
        topK: 6,
      });

      room.roomState.storyBattle = {
        movieId: movie.movieId,
        movieTitle: movie.title,
        scenarioPrompt,
        canonContext: retrievedContext.formattedContext,
        timerSeconds,
        startTime: Date.now(),
        // Private server submissions container
        submissions: {}, // [playerId]: { playerName, text, submittedAt }
        isJudged: false,
      };

      room.status = 'in_progress';

      io.to(roomCode).emit('battle:started', {
        movieId: movie.movieId,
        movieTitle: movie.title,
        scenarioPrompt,
        timerSeconds,
        canonFacts: retrievedContext.chunks.map(c => c.text),
      });
    } catch (err) {
      console.error('[StoryBattle] start error:', err.message);
      socket.emit('error', { message: 'Failed to start Story Battle.' });
    }
  });

  /**
   * Player submits private story continuation
   */
  socket.on('battle:submit_entry', async ({ roomCode, playerId, playerName, text }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      const state = room?.roomState?.storyBattle;
      if (!state || state.isJudged) return;

      // Store privately on server
      state.submissions[playerId] = {
        playerId,
        playerName,
        submissionText: text.trim(),
        submittedAt: Date.now(),
      };

      // Notify room that this player has submitted (WITHOUT exposing the text!)
      io.to(roomCode).emit('battle:player_ready_state', {
        submittedPlayerIds: Object.keys(state.submissions),
      });

      // Check if all players in the room have submitted
      const totalPlayers = room.players.length;
      const submittedCount = Object.keys(state.submissions).length;

      if (submittedCount >= Math.min(2, totalPlayers)) {
        await resolveBattle(io, roomCode, room, state);
      }
    } catch (err) {
      console.error('[StoryBattle] submit_entry error:', err.message);
    }
  });

  /**
   * Timer expired - force resolution with available submissions
   */
  socket.on('battle:timer_expired', async ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    const state = room?.roomState?.storyBattle;
    if (state && !state.isJudged) {
      await resolveBattle(io, roomCode, room, state);
    }
  });
}

/**
 * Impartial evaluation & simultaneous reveal
 */
async function resolveBattle(io, roomCode, room, state) {
  state.isJudged = true;
  room.status = 'round_complete';

  const playerEntries = Object.values(state.submissions);
  const p1 = playerEntries[0] || { playerId: 'p1', playerName: 'Player 1', submissionText: '(No submission)' };
  const p2 = playerEntries[1] || { playerId: 'p2', playerName: 'Player 2', submissionText: '(No submission)' };

  // 1. Simultaneous reveal of submissions
  io.to(roomCode).emit('battle:submissions_revealed', {
    submissions: [
      { playerId: p1.playerId, playerName: p1.playerName, text: p1.submissionText },
      { playerId: p2.playerId, playerName: p2.playerName, text: p2.submissionText },
    ],
    status: 'evaluating_with_ai',
  });

  // 2. Call Groq AI Grand Judge
  try {
    const judgeResult = await groqService.judgeStoryBattle({
      movieTitle: state.movieTitle,
      publicScenario: state.scenarioPrompt,
      player1: p1,
      player2: p2,
      canonContext: state.canonContext,
    });

    // Update player scores
    const player1Obj = room.players.find(p => p.playerId === p1.playerId);
    const player2Obj = room.players.find(p => p.playerId === p2.playerId);

    if (player1Obj) player1Obj.score += (judgeResult.player1Feedback?.totalScore || 20);
    if (player2Obj) player2Obj.score += (judgeResult.player2Feedback?.totalScore || 20);

    const winnerObj = room.players.find(p => p.playerId === judgeResult.winnerPlayerId);

    // Save match result to MongoDB
    try {
      const matchResult = new MatchResult({
        roomCode,
        mode: 'storyBattle',
        players: room.players.map(p => ({ playerId: p.playerId, name: p.name, score: p.score })),
        winnerId: judgeResult.winnerPlayerId,
        winnerName: winnerObj?.name || 'Grand Storyteller',
        isDraw: judgeResult.isDraw,
        roundHistory: [{
          scenario: state.scenarioPrompt,
          p1Submission: p1.submissionText,
          p2Submission: p2.submissionText,
          scores: judgeResult,
        }],
        aiSummary: judgeResult.verdictSummary,
      });
      await matchResult.save();
    } catch (saveErr) {
      console.warn('[StoryBattle] MatchResult save deferred:', saveErr.message);
    }

    // Broadcast final judge report
    io.to(roomCode).emit('battle:judging_complete', {
      judgeResult,
      winnerPlayerId: judgeResult.winnerPlayerId,
      winnerName: winnerObj?.name || 'Winner',
      isDraw: judgeResult.isDraw,
      players: room.players,
    });
  } catch (judgeErr) {
    console.error('[StoryBattle] AI judging failed:', judgeErr.message);
  }
}
