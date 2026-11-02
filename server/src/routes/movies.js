import { Router } from 'express';
import { Movie } from '../models/Movie.js';
import { externalMovieService } from '../services/retrieval/externalMovieService.js';

const router = Router();

/**
 * POST /api/movies/resolve
 * Dynamically resolves a movie title: reuses existing MongoDB lore or retrieves from external sources,
 * verifies movie identity, structures canon lore, indexes semantic vectors, and returns verified movie.
 */
router.post('/resolve', async (req, res, next) => {
  try {
    const { title, year, language } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Valid movie title is required.' });
    }

    const result = await externalMovieService.resolveAndIngestMovie(title.trim(), { year, language });
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        reason: result.reason,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/movies
 * Query params: language, search, genre, page, limit
 */
router.get('/', async (req, res, next) => {
  try {
    const { language, search, genre, page = 1, limit = 24 } = req.query;
    const filter = {};

    if (language && language !== 'all') {
      filter.language = language;
    }

    if (genre && genre !== 'all') {
      filter.genres = genre;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { originalTitle: { $regex: search.trim(), $options: 'i' } },
        { overview: { $regex: search.trim(), $options: 'i' } },
        { director: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Movie.countDocuments(filter);
    const movies = await Movie.find(filter)
      .select('-plotSummary') // Exclude full plot summary in list for performance
      .sort({ isFeatured: -1, releaseYear: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: movies,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movies/featured
 */
router.get('/featured', async (req, res, next) => {
  try {
    const featured = await Movie.find({ isFeatured: true })
      .limit(6)
      .lean();
    res.json({ success: true, data: featured });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movies/:movieId
 */
router.get('/:movieId', async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ movieId: req.params.movieId }).lean();
    if (!movie) {
      return res.status(404).json({ success: false, message: `Movie with id "${req.params.movieId}" not found.` });
    }
    res.json({ success: true, data: movie });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movies/:movieId/canon
 * Detailed canon view (characters, events, rules, sources)
 */
router.get('/:movieId/canon', async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ movieId: req.params.movieId })
      .select('title originalTitle releaseYear languageLabel director characters canonEvents worldRules sourceAttribution dataStatus')
      .lean();

    if (!movie) {
      return res.status(404).json({ success: false, message: `Movie "${req.params.movieId}" not found.` });
    }

    res.json({
      success: true,
      data: {
        movieInfo: {
          title: movie.title,
          originalTitle: movie.originalTitle,
          releaseYear: movie.releaseYear,
          languageLabel: movie.languageLabel,
          director: movie.director,
          dataStatus: movie.dataStatus,
        },
        characters: movie.characters,
        canonEvents: movie.canonEvents,
        worldRules: movie.worldRules,
        sourceAttribution: movie.sourceAttribution,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
