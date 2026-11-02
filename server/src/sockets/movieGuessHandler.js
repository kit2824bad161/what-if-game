import { Movie } from '../models/Movie.js';
import { ragService } from '../services/rag/ragService.js';
import { groqService } from '../services/groq/groqService.js';
import { buildMovieBlocklist, detectAndSanitizeLeaks } from '../utils/leakDetector.js';
import { isCorrectGuess } from '../utils/fuzzyMatch.js';
import { findMovieByTitleOrId } from '../utils/movieLookup.js';
import { externalMovieService } from '../services/retrieval/externalMovieService.js';

export function registerMovieGuessHandlers(io, socket, roomManager) {
  /**
   * Get current round state (for initial page load, refresh, or reconnect)
   */
  socket.on('movie_guess:get_state', ({ roomCode, playerId, playerName }) => {
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

    const state = room.roomState?.movieGuess;
    const isHost = (room.hostId === playerId);

    let clientGameState = 'setup';
    if (state?.isSolved) {
      clientGameState = 'resolved';
    } else if (state?.mysteryStory) {
      clientGameState = isHost ? 'host_active' : 'guessing';
    } else if (state?.isGenerating) {
      clientGameState = 'generating';
    } else {
      clientGameState = isHost ? 'setup' : 'waiting_host';
    }

    const activeMode = state?.mode || room.mode || 'movieGuess';

    const payload = {
      room: {
        roomCode: room.roomCode,
        hostId: room.hostId,
        players: room.players,
        status: room.status,
        mode: activeMode,
        currentRoundNumber: room.currentRoundNumber || 1,
      },
      isHost,
      mode: activeMode,
      gameState: clientGameState,
      isGenerating: state?.isGenerating || false,
      mysteryStory: state?.mysteryStory || '',
      clues: state?.clues ? state.clues.slice(0, state.hintsUnlocked || 1) : [],
      totalCluesCount: state?.clues?.length || 0,
      hintsUnlocked: state?.hintsUnlocked || 1,
      currentPoints: state?.currentGuesserPoints || 100,
      guessHistory: state?.guessHistory || [],
      prompt: state?.whatIfPrompt || '',
      isSolved: state?.isSolved || false,
      ragDiagnostics: state?.ragDiagnostics || null,
    };

    // Secret movie is ONLY revealed to the host or once the round is solved!
    if (isHost || state?.isSolved) {
      if (state?.secretMovieId) {
        payload.secretMovie = {
          movieId: state.secretMovieId,
          title: state.secretMovieTitle,
          releaseYear: state.secretMovieReleaseYear,
          director: state.secretMovieDirector,
          posterUrl: state.secretMoviePoster,
        };
      }
    }

    if (state?.isSolved && state.resolvedData) {
      payload.resolvedResult = state.resolvedData;
    }

    socket.emit('movie_guess:state', payload);
  });

  /**
   * Creator picks secret movie & starts round
   * Supports both:
   * 1. What If? Movie Guess (with whatIfPrompt)
   * 2. Mystery Movie Challenge (title only, genuine RAG fictional transformation)
   */
  socket.on('movie_guess:setup_round', async ({ roomCode, movieId, movieTitle, whatIfPrompt, mode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Room not found.' });

    if (!room.roomState) room.roomState = {};

    // 1. Guard against duplicate generation requests
    if (room.roomState.movieGuess?.isGenerating) {
      console.warn(`[MovieGuess] Round generation already in progress for room ${roomCode}`);
      return;
    }
    if (room.roomState.movieGuess?.mysteryStory && !room.roomState.movieGuess?.isSolved) {
      console.warn(`[MovieGuess] Round already active for room ${roomCode}, re-broadcasting state.`);
      const state = room.roomState.movieGuess;
      io.to(roomCode).emit('movie_guess:story_ready', {
        mode: state.mode || room.mode,
        mysteryStory: state.mysteryStory,
        clues: state.clues.slice(0, state.hintsUnlocked),
        totalCluesCount: state.clues.length,
        hintsUnlocked: state.hintsUnlocked,
        currentPoints: state.currentGuesserPoints,
        prompt: state.whatIfPrompt,
      });
      return;
    }

    const activeMode = mode || room.mode || 'movieGuess';
    const isMysteryChallenge = (activeMode === 'mysteryMovie' || !whatIfPrompt || !whatIfPrompt.trim());

    // 2. Lookup and validate movie in database or dynamically retrieve
    const movieTarget = movieTitle || movieId;
    let movie = null;
    const lookup = await findMovieByTitleOrId(movieTarget);

    if (lookup.success) {
      movie = lookup.movie;
    } else {
      // Attempt dynamic retrieval from verified external sources
      const resolveResult = await externalMovieService.resolveAndIngestMovie(movieTarget);
      if (resolveResult.success) {
        movie = resolveResult.movie;
      } else {
        console.warn(`[MovieGuess] Movie lookup failed for "${movieTarget}": ${lookup.message}`);
        return socket.emit('error', {
          message: lookup.message,
          supportedMovies: lookup.supportedMovies,
        });
      }
    }

    try {
      // Mark generation as active
      room.roomState.movieGuess = {
        isGenerating: true,
      };
      io.to(roomCode).emit('movie_guess:generating');

      // 3. Build server-side secret blocklist (movie title, characters, actors)
      const blocklist = buildMovieBlocklist(movie);

      // 4. Retrieve canon facts via genuine RAG
      const ragQuery = isMysteryChallenge
        ? 'Core plot narrative, main character motivations, defining turning points, and universe rules'
        : whatIfPrompt;

      console.log(`[RAG Verification] Movie: "${movie.title}" (${movie.movieId}) | Mode: ${isMysteryChallenge ? 'mysteryMovie' : 'movieGuess'} | Query: "${ragQuery}"`);

      const retrievedContext = await ragService.retrieveContext({
        movieId: movie.movieId,
        query: ragQuery,
        topK: 6,
      });

      console.log(`[RAG Verification] Retrieved ${retrievedContext.chunks.length} chunks | Top Score: ${retrievedContext.diagnostics.topScore} | Word Budget: ${retrievedContext.diagnostics.contextWords} words`);

      // 5. Generate mystery story via Groq (Simple English applied to both modes)
      let mysteryResult;
      if (isMysteryChallenge) {
        mysteryResult = await groqService.generateMysteryMovieChallenge({
          movie,
          retrievedContext,
          blocklist,
        });
      } else {
        mysteryResult = await groqService.generateMovieGuessStory({
          movie,
          whatIfPrompt,
          retrievedContext,
          blocklist,
        });
      }

      // 6. Final safety check on text
      const leakCheck = detectAndSanitizeLeaks(mysteryResult.mysteryStory, blocklist);
      const safeStory = leakCheck.sanitizedText;

      // 7. Store private state on server ONLY
      room.roomState.movieGuess = {
        mode: isMysteryChallenge ? 'mysteryMovie' : 'movieGuess',
        secretMovieId: movie.movieId,
        secretMovieTitle: movie.title,
        secretMoviePoster: movie.posterUrl,
        secretMovieReleaseYear: movie.releaseYear,
        secretMovieDirector: movie.director,
        whatIfPrompt: isMysteryChallenge ? '' : whatIfPrompt,
        mysteryStory: safeStory,
        clues: mysteryResult.clues || [],
        hintsUnlocked: 1, // First clue unlocked automatically
        currentGuesserPoints: 100,
        guessHistory: [],
        isSolved: false,
        creatorPlayerId: room.hostId,
        isGenerating: false,
        ragDiagnostics: {
          movieId: movie.movieId,
          movieTitle: movie.title,
          retrievedCount: retrievedContext.chunks.length,
          topScore: retrievedContext.diagnostics.topScore,
        },
      };

      room.status = 'playing';

      // 8. Broadcast public state to room (NO movie title, NO secret ID!)
      io.to(roomCode).emit('movie_guess:story_ready', {
        mode: isMysteryChallenge ? 'mysteryMovie' : 'movieGuess',
        mysteryStory: safeStory,
        clues: [mysteryResult.clues[0]],
        totalCluesCount: mysteryResult.clues.length,
        hintsUnlocked: 1,
        currentPoints: 100,
        prompt: isMysteryChallenge ? '' : whatIfPrompt,
      });

      // 9. Deliver secret confirmation specifically to host socket
      socket.emit('movie_guess:host_round_ready', {
        mode: isMysteryChallenge ? 'mysteryMovie' : 'movieGuess',
        secretMovie: {
          movieId: movie.movieId,
          title: movie.title,
          releaseYear: movie.releaseYear,
          director: movie.director,
          posterUrl: movie.posterUrl,
        },
      });
    } catch (err) {
      console.error('[MovieGuess] setup_round error:', err.message);
      if (room?.roomState?.movieGuess) {
        room.roomState.movieGuess.isGenerating = false;
      }
      socket.emit('error', { message: err.message || 'Failed to generate mystery story.' });
      io.to(roomCode).emit('movie_guess:generation_failed', { message: err.message || 'Failed to generate mystery story.' });
    }
  });

  /**
   * Guesser unlocks next clue
   */
  socket.on('movie_guess:unlock_hint', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    const state = room?.roomState?.movieGuess;
    if (!state || state.isSolved) return;

    if (state.hintsUnlocked < state.clues.length) {
      state.hintsUnlocked++;
      state.currentGuesserPoints = Math.max(10, state.currentGuesserPoints - 15);

      const unlockedClues = state.clues.slice(0, state.hintsUnlocked);

      io.to(roomCode).emit('movie_guess:hint_unlocked', {
        hintsUnlocked: state.hintsUnlocked,
        clues: unlockedClues,
        currentPoints: state.currentGuesserPoints,
      });
    }
  });

  /**
   * Guesser submits a guess
   */
  socket.on('movie_guess:submit_guess', async ({ roomCode, guessText, guesserPlayerId }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      const state = room?.roomState?.movieGuess;
      if (!state || state.isSolved) return;

      const targetMovie = await Movie.findOne({ movieId: state.secretMovieId }).lean();
      const isCorrect = isCorrectGuess(guessText, targetMovie);

      const guessRecord = {
        guess: guessText,
        isCorrect,
        timestamp: Date.now(),
      };
      state.guessHistory.push(guessRecord);

      if (isCorrect) {
        state.isSolved = true;
        room.status = 'round_complete';

        // Award points to guesser
        const guesser = room.players.find(p => p.playerId === guesserPlayerId);
        if (guesser) {
          guesser.score += state.currentGuesserPoints;
        }

        const resolvedPayload = {
          isCorrect: true,
          guesserPlayerId,
          pointsAwarded: state.currentGuesserPoints,
          secretMovie: {
            movieId: targetMovie.movieId,
            title: targetMovie.title,
            originalTitle: targetMovie.originalTitle,
            releaseYear: targetMovie.releaseYear,
            director: targetMovie.director,
            posterUrl: targetMovie.posterUrl,
            overview: targetMovie.overview,
          },
          guessHistory: state.guessHistory,
          players: room.players,
        };

        state.resolvedData = resolvedPayload;
        io.to(roomCode).emit('movie_guess:round_resolved', resolvedPayload);
      } else {
        // Penalty for wrong guess
        state.currentGuesserPoints = Math.max(10, state.currentGuesserPoints - 10);

        io.to(roomCode).emit('movie_guess:incorrect_guess', {
          guess: guessText,
          remainingPoints: state.currentGuesserPoints,
          guessHistory: state.guessHistory,
        });
      }
    } catch (err) {
      console.error('[MovieGuess] submit_guess error:', err.message);
    }
  });

  /**
   * Next round setup (Host triggers next round)
   */
  socket.on('movie_guess:next_round', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    room.roomState.movieGuess = null;
    room.status = 'playing';
    room.currentRoundNumber = (room.currentRoundNumber || 1) + 1;

    io.to(roomCode).emit('movie_guess:round_reset', {
      currentRoundNumber: room.currentRoundNumber,
    });
  });

  /**
   * Guesser forfeits or time runs out
   */
  socket.on('movie_guess:surrender', async ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    const state = room?.roomState?.movieGuess;
    if (!state) return;

    state.isSolved = true;
    room.status = 'round_complete';

    const targetMovie = await Movie.findOne({ movieId: state.secretMovieId }).lean();

    const resolvedPayload = {
      isCorrect: false,
      secretMovie: {
        movieId: targetMovie.movieId,
        title: targetMovie.title,
        releaseYear: targetMovie.releaseYear,
        director: targetMovie.director,
        posterUrl: targetMovie.posterUrl,
      },
      guessHistory: state.guessHistory,
      players: room.players,
    };

    state.resolvedData = resolvedPayload;
    io.to(roomCode).emit('movie_guess:round_resolved', resolvedPayload);
  });
}
