import { Router } from 'express';
import { Movie } from '../models/Movie.js';
import { ragService } from '../services/rag/ragService.js';
import { groqService } from '../services/groq/groqService.js';
import { continuityChecker } from '../services/continuity/continuityChecker.js';
import { externalMovieService } from '../services/retrieval/externalMovieService.js';
import { isMovieUnreleased } from '../utils/movieLookup.js';

const router = Router();

/**
 * POST /api/rag/retrieve
 * Directly inspect retrieved chunks and similarity scores
 */
router.post('/retrieve', async (req, res, next) => {
  try {
    const { movieId, query, topK = 6, sectionType = null } = req.body;
    if (!movieId || !query) {
      return res.status(400).json({ success: false, message: 'movieId and query are required.' });
    }

    const retrievalResult = await ragService.retrieveContext({
      movieId,
      query,
      sectionType,
      topK: parseInt(topK, 10),
    });

    res.json({ success: true, ...retrievalResult });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rag/generate-branches
 * Core signature What-If branch generation
 */
router.post('/generate-branches', async (req, res, next) => {
  const reqStart = Date.now();
  try {
    const { movieId, movieTitle, whatIfQuestion, selectedEventId = null } = req.body;

    const targetIdentifier = movieId || movieTitle;
    if (!targetIdentifier || !whatIfQuestion || !whatIfQuestion.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie title or ID and whatIfQuestion are required to forge an alternate timeline.',
      });
    }

    // 1. Search database first
    let movie = null;
    if (movieId) {
      movie = await Movie.findOne({ movieId }).lean();
    }
    if (!movie && (movieTitle || movieId)) {
      movie = await Movie.findOne({
        $or: [
          { title: { $regex: new RegExp(`^${(movieTitle || movieId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { aliases: { $regex: new RegExp(`^${(movieTitle || movieId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ]
      }).lean();
    }

    // 2. If movie not in MongoDB, dynamically resolve from verified external source
    if (!movie) {
      console.log(`[RAG Endpoint] Movie "${targetIdentifier}" not found in DB. Initiating dynamic retrieval...`);
      const resolveResult = await externalMovieService.resolveAndIngestMovie(targetIdentifier);
      if (!resolveResult.success) {
        return res.status(404).json({
          success: false,
          message: resolveResult.message || `Movie "${targetIdentifier}" could not be verified or retrieved.`,
          reason: resolveResult.reason,
        });
      }
      movie = resolveResult.movie;
    }

    let selectedEvent = null;
    if (selectedEventId && movie.canonEvents) {
      selectedEvent = movie.canonEvents.find(e => e.eventId === selectedEventId) || null;
    }

    // 1. Retrieve relevant canon facts using RAG
    const ragQuery = `${whatIfQuestion} ${selectedEvent ? selectedEvent.description : ''}`;
    const retrievedContext = await ragService.retrieveContext({
      movieId: movie.movieId,
      query: ragQuery,
      topK: 6,
    });

    console.log(`[RAG Endpoint] Retrieved ${retrievedContext.chunks.length} chunks for movie "${movie.movieId}" | query: "${whatIfQuestion.slice(0, 50)}..."`);

    // 2. Generate two alternate branches via Groq (or fallback if no key configured)
    const generationResult = await groqService.generateAlternateBranches({
      movie,
      whatIfQuestion: whatIfQuestion.trim(),
      selectedEvent,
      retrievedContext,
    });

    // 3. Run continuity checks on both branches
    const analyzedBranches = generationResult.branches.map(branch => {
      const continuity = continuityChecker.evaluateContinuity({
        movie,
        retrievedCanonChunks: retrievedContext.chunks,
        priorTimelineTurns: [],
        proposedText: `${branch.summary} ${(branch.plotConsequences || []).join(' ')}`,
        changedEvent: whatIfQuestion,
      });

      return {
        ...branch,
        continuityAnalysis: continuity,
        continuityWarnings: [
          ...(branch.continuityWarnings || []),
          ...(continuity.warnings || []),
        ],
      };
    });

    const totalDurationMs = Date.now() - reqStart;
    console.log(`[RAG Endpoint] Generation finished | engine: ${generationResult.engine} | model: ${generationResult.model || 'N/A'} | totalDuration: ${totalDurationMs}ms`);

    res.json({
      success: true,
      data: {
        movieId: movie.movieId,
        movieTitle: movie.title,
        whatIfQuestion: whatIfQuestion.trim(),
        selectedEvent,
        branches: analyzedBranches,
        retrievedChunks: retrievedContext.chunks,
        diagnostics: retrievedContext.diagnostics,
        engine: generationResult.engine,
        model: generationResult.model,
      },
    });
  } catch (err) {
    console.error(`[RAG Endpoint Error] ${err.message} (${Date.now() - reqStart}ms)`);
    next(err);
  }
});

/**
 * POST /api/rag/continue-timeline
 * Continue an active timeline branch with next what-if turn
 */
router.post('/continue-timeline', async (req, res, next) => {
  try {
    const { movieId, priorTurns = [], chosenBranch, userFollowUp } = req.body;

    if (!movieId || !chosenBranch || !userFollowUp) {
      return res.status(400).json({
        success: false,
        message: 'movieId, chosenBranch, and userFollowUp are required to continue the timeline.',
      });
    }

    let movie = await Movie.findOne({ movieId }).lean();
    if (!movie) {
      const resolveRes = await externalMovieService.resolveAndIngestMovie(movieId);
      if (resolveRes.success) {
        movie = resolveRes.movie;
      } else {
        return res.status(404).json({ success: false, message: `Movie with id "${movieId}" not found.` });
      }
    }

    // 1. Retrieve relevant canon facts for follow-up
    const retrievedContext = await ragService.retrieveContext({
      movieId: movie.movieId,
      query: `${userFollowUp} ${chosenBranch.title}`,
      topK: 5,
    });

    // 2. Generate turn continuation
    const continuationResult = await groqService.continueTimeline({
      movie,
      priorTurns,
      chosenBranch,
      userFollowUp: userFollowUp.trim(),
      retrievedContext,
    });

    // 3. Continuity check
    const continuity = continuityChecker.evaluateContinuity({
      movie,
      retrievedCanonChunks: retrievedContext.chunks,
      priorTimelineTurns: priorTurns,
      proposedText: continuationResult.turn.narrativeText,
      changedEvent: userFollowUp,
    });

    const turn = {
      turnNumber: priorTurns.length + 1,
      userPrompt: userFollowUp.trim(),
      chosenBranchId: chosenBranch.branchId,
      ...continuationResult.turn,
      continuityWarnings: continuity.warnings.map(w => w.message),
      continuityAnalysis: continuity,
      retrievedChunks: retrievedContext.chunks,
    };

    res.json({
      success: true,
      data: {
        turn,
        engine: continuationResult.engine,
        model: continuationResult.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rag/exact-story
 * Explains the exact, authentic movie storyline and canon facts in human-understandable English
 */
router.post('/exact-story', async (req, res, next) => {
  const reqStart = Date.now();
  try {
    const { movieId, movieTitle, whatIfQuestion = '', selectedEventId = null } = req.body;
    const targetIdentifier = movieId || movieTitle;

    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Movie title or ID is required to explain the exact story.',
      });
    }

    // 1. Search database first
    let movie = null;
    if (movieId) {
      movie = await Movie.findOne({ movieId }).lean();
    }
    if (!movie && (movieTitle || movieId)) {
      movie = await Movie.findOne({
        $or: [
          { title: { $regex: new RegExp(`^${(movieTitle || movieId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { aliases: { $regex: new RegExp(`^${(movieTitle || movieId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ]
      }).lean();
    }

    // 2. Dynamic ingestion if not found
    if (!movie) {
      const resolveResult = await externalMovieService.resolveAndIngestMovie(targetIdentifier);
      if (!resolveResult.success) {
        return res.status(404).json({
          success: false,
          message: resolveResult.message || `Movie "${targetIdentifier}" could not be verified or retrieved.`,
        });
      }
      movie = resolveResult.movie;
    }

    // Check if the movie has not been released yet
    const unreleased = isMovieUnreleased(movie);
    if (unreleased) {
      console.log(`[RAG Endpoint] Movie "${movie.title}" is not yet released. Refusing exact story generation.`);
      return res.json({
        success: true,
        data: {
          isUnreleased: true,
          movieId: movie.movieId,
          movieTitle: movie.title,
          releaseYear: movie.releaseYear,
          director: movie.director,
          posterUrl: movie.posterUrl,
          backdropUrl: movie.backdropUrl,
          languageLabel: movie.languageLabel,
          message: `"${movie.title}" has not been released yet! Because the movie is not yet released, the exact canon story and climax cannot be generated.`,
        },
      });
    }

    let selectedEvent = null;
    if (selectedEventId && movie.canonEvents) {
      selectedEvent = movie.canonEvents.find(e => e.eventId === selectedEventId) || null;
    }

    // 3. Retrieve canon facts using RAG
    const ragQuery = whatIfQuestion && whatIfQuestion.trim()
      ? `${whatIfQuestion.trim()} ${selectedEvent ? selectedEvent.description : ''} ${movie.plotSummary?.slice(0, 200) || ''}`
      : `${movie.title} plot overview characters climax canon events`;

    const retrievedContext = await ragService.retrieveContext({
      movieId: movie.movieId,
      query: ragQuery,
      topK: 6,
    });

    // 4. Generate Exact Story via Groq or fallback
    const exactResult = await groqService.generateExactStory({
      movie,
      whatIfQuestion: (whatIfQuestion || '').trim(),
      selectedEvent,
      retrievedContext,
    });

    const totalDurationMs = Date.now() - reqStart;
    console.log(`[RAG Endpoint] Exact story generated for "${movie.title}" | engine: ${exactResult.engine} | duration: ${totalDurationMs}ms`);

    res.json({
      success: true,
      data: {
        movieId: movie.movieId,
        movieTitle: movie.title,
        releaseYear: movie.releaseYear,
        languageLabel: movie.languageLabel,
        director: movie.director,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        whatIfQuestion: (whatIfQuestion || '').trim(),
        selectedEvent,
        story: exactResult.story,
        retrievedChunks: retrievedContext.chunks,
        engine: exactResult.engine,
        model: exactResult.model,
      },
    });
  } catch (err) {
    console.error(`[RAG Endpoint Exact Story Error] ${err.message}`);
    next(err);
  }
});

export default router;
