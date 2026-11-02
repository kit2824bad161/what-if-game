import { Movie } from '../models/Movie.js';
import { ragService } from '../services/rag/ragService.js';
import { groqService } from '../services/groq/groqService.js';
import { continuityChecker } from '../services/continuity/continuityChecker.js';

export function registerCoOpStoryHandlers(io, socket, roomManager) {
  /**
   * Host initializes co-op story
   */
  socket.on('coop:init_story', async ({ roomCode, movieId, initialPrompt }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found.' });

      const movie = await Movie.findOne({ movieId }).lean();
      if (!movie) return socket.emit('error', { message: 'Movie not found.' });

      // 1. RAG retrieval
      const retrievedContext = await ragService.retrieveContext({
        movieId,
        query: initialPrompt,
        topK: 5,
      });

      // 2. Generate initial branch/chapter
      const initialBranch = await groqService.generateAlternateBranches({
        movie,
        whatIfQuestion: initialPrompt,
        retrievedContext,
      });

      const primaryBranch = initialBranch.branches[0];

      // Assign first turn to player 2 (or host if 1 player)
      const nextTurnPlayerId = room.players.length > 1
        ? (room.players.find(p => p.playerId !== room.hostId)?.playerId || room.hostId)
        : room.hostId;

      room.roomState.coOpStory = {
        movieId: movie.movieId,
        movieTitle: movie.title,
        posterUrl: movie.posterUrl,
        initialPrompt,
        currentTurnPlayerId: nextTurnPlayerId,
        turns: [
          {
            turnNumber: 1,
            contributedBy: room.players.find(p => p.playerId === room.hostId)?.name || 'Host',
            userPrompt: initialPrompt,
            continuationTitle: primaryBranch.title,
            narrativeText: primaryBranch.summary,
            canonFactsReferenced: primaryBranch.canonFactsUsed,
            newHypotheticalFacts: primaryBranch.hypotheticalEvents,
            continuityWarnings: primaryBranch.continuityWarnings || [],
            timestamp: Date.now(),
          }
        ],
      };

      room.status = 'in_progress';

      io.to(roomCode).emit('coop:story_updated', room.roomState.coOpStory);
    } catch (err) {
      console.error('[CoOpStory] init_story error:', err.message);
      socket.emit('error', { message: 'Failed to start co-op story.' });
    }
  });

  /**
   * Player submits their turn continuation
   */
  socket.on('coop:submit_turn', async ({ roomCode, playerId, whatIfFollowUp }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      const state = room?.roomState?.coOpStory;
      if (!state) return;

      // Verify turn authorization
      if (state.currentTurnPlayerId !== playerId) {
        return socket.emit('error', { message: 'It is not your turn to write!' });
      }

      const movie = await Movie.findOne({ movieId: state.movieId }).lean();
      const player = room.players.find(p => p.playerId === playerId);

      // 1. RAG retrieval for follow-up
      const retrievedContext = await ragService.retrieveContext({
        movieId: state.movieId,
        query: whatIfFollowUp,
        topK: 5,
      });

      // 2. Groq continuation
      const continuation = await groqService.continueTimeline({
        movie,
        priorTurns: state.turns,
        chosenBranch: { title: state.turns[state.turns.length - 1]?.continuationTitle || 'Active Timeline' },
        userFollowUp: whatIfFollowUp,
        retrievedContext,
      });

      // 3. Continuity check
      const continuity = continuityChecker.evaluateContinuity({
        movie,
        retrievedCanonChunks: retrievedContext.chunks,
        priorTimelineTurns: state.turns,
        proposedText: continuation.turn.narrativeText,
        changedEvent: whatIfFollowUp,
      });

      // 4. Record turn
      const newTurn = {
        turnNumber: state.turns.length + 1,
        contributedBy: player?.name || 'Player',
        userPrompt: whatIfFollowUp,
        continuationTitle: continuation.turn.continuationTitle || `Act ${state.turns.length + 1}`,
        narrativeText: continuation.turn.narrativeText,
        canonFactsReferenced: continuation.turn.canonFactsReferenced || [],
        newHypotheticalFacts: continuation.turn.newHypotheticalFacts || [],
        characterStatusUpdates: continuation.turn.characterStatusUpdates || [],
        continuityWarnings: continuity.warnings.map(w => w.message),
        timestamp: Date.now(),
      };

      state.turns.push(newTurn);

      // 5. Flip turn to the other player
      const otherPlayer = room.players.find(p => p.playerId !== playerId);
      state.currentTurnPlayerId = otherPlayer ? otherPlayer.playerId : playerId;

      io.to(roomCode).emit('coop:story_updated', state);
    } catch (err) {
      console.error('[CoOpStory] submit_turn error:', err.message);
      socket.emit('error', { message: 'Failed to process turn.' });
    }
  });
}
