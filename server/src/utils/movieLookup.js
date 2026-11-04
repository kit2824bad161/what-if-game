import mongoose from 'mongoose';
import { Movie } from '../models/Movie.js';
import { MovieChunk } from '../models/MovieChunk.js';
import { isCorrectGuess } from './fuzzyMatch.js';
import { connectDB } from '../config/db.js';

/**
 * Normalizes movie titles for comparison
 */
function cleanTitle(str) {
  return (str || '')
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find movie by exact ID, title, alias, or fuzzy match.
 * Returns { success: true, movie } or { success: false, message, supportedMovies }
 */
export async function findMovieByTitleOrId(input) {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch {
      // Handled below
    }
  }

  if (mongoose.connection.readyState !== 1) {
    return {
      success: false,
      message: 'Database connection unavailable.',
      supportedMovies: [],
    };
  }

  if (!input || typeof input !== 'string') {
    const supported = await getSupportedMovieTitles();
    return {
      success: false,
      message: 'Please provide a movie title.',
      supportedMovies: supported,
    };
  }

  const raw = input.trim();
  const cleaned = cleanTitle(raw);

  // 1. Direct movieId exact match
  let movie = await Movie.findOne({ movieId: raw.toLowerCase() }).lean();
  if (movie) return verifyMovieChunks(movie);

  // 2. Direct case-insensitive title match
  movie = await Movie.findOne({
    title: { $regex: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  }).lean();
  if (movie) return verifyMovieChunks(movie);

  // 3. Match against aliases or original title
  movie = await Movie.findOne({
    $or: [
      { aliases: { $regex: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      { originalTitle: { $regex: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
    ]
  }).lean();
  if (movie) return verifyMovieChunks(movie);

  // 4. Fuzzy match against all available movies in DB
  const allMovies = await Movie.find({}, 'movieId title originalTitle aliases releaseYear languageLabel posterUrl director').lean();
  
  for (const m of allMovies) {
    if (isCorrectGuess(raw, m)) {
      return verifyMovieChunks(m);
    }
    // Also test cleaned title match
    if (cleanTitle(m.title) === cleaned) {
      return verifyMovieChunks(m);
    }
    if (m.aliases && m.aliases.some(a => cleanTitle(a) === cleaned)) {
      return verifyMovieChunks(m);
    }
  }

  // 5. Partial substring match as fallback
  for (const m of allMovies) {
    const mClean = cleanTitle(m.title);
    if (mClean.includes(cleaned) || cleaned.includes(mClean)) {
      return verifyMovieChunks(m);
    }
  }

  // Not found: return clear guidance with supported movies
  const supported = allMovies.map(m => m.title);
  return {
    success: false,
    message: `Movie "${raw}" is not yet in our database. Please select from our supported movies: ${supported.slice(0, 8).join(', ')}${supported.length > 8 ? ', etc.' : ''}.`,
    supportedMovies: supported,
  };
}

async function verifyMovieChunks(movie) {
  const chunkCount = await MovieChunk.countDocuments({ movieId: movie.movieId });
  if (chunkCount === 0) {
    return {
      success: false,
      message: `Movie "${movie.title}" exists in our catalog but has no verified canon lore chunks yet.`,
      supportedMovies: await getSupportedMovieTitles(),
    };
  }
  return {
    success: true,
    movie,
    chunkCount,
  };
}

export async function getSupportedMovieTitles() {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch {
      return [];
    }
  }
  if (mongoose.connection.readyState !== 1) return [];
  const movies = await Movie.find({}, 'title').lean();
  return movies.map(m => m.title);
}

/**
 * Determines whether a movie has not been released yet
 */
export function isMovieUnreleased(movie) {
  if (!movie) return false;

  // 1. Explicit boolean flag
  if (movie.isReleased === false) return true;

  // 2. Explicit status enum
  if (movie.releaseStatus === 'unreleased' || movie.releaseStatus === 'upcoming') return true;

  // 3. Year check: If releaseYear is in future or 2026+ unconfirmed
  const currentYear = new Date().getFullYear();
  if (movie.releaseYear && typeof movie.releaseYear === 'number') {
    if (movie.releaseYear > currentYear) return true;
    // Films from 2026 or later are upcoming unless explicitly marked isReleased === true
    if (movie.releaseYear >= 2026 && movie.isReleased !== true) return true;
  }

  // 4. Release date check if specified
  if (movie.releaseDate) {
    const rDate = new Date(movie.releaseDate);
    if (!isNaN(rDate.getTime()) && rDate > new Date()) {
      return true;
    }
  }

  // 5. Keyword indicators in title, overview, or plotSummary
  const textToCheck = `${movie.title || ''} ${movie.overview || ''} ${movie.plotSummary || ''}`.toLowerCase();
  const unreleasedIndicators = [
    /\bis an upcoming\b/i,
    /\bupcoming (?:indian|american|tamil|telugu|hindi|action|sci-fi|superhero|drama)?\s*(?:film|movie)\b/i,
    /\bscheduled to be released\b/i,
    /\byet to be released\b/i,
    /\bnot yet released\b/i,
    /\bcurrently in (?:production|development|filming|post-production)\b/i,
    /\bprincipal photography began\b/i,
    /\brelease date (?:is|to be) announced\b/i,
    /\brelease date tba\b/i,
    /\bplot is kept under wraps\b/i,
    /\bplot details are under wraps\b/i,
    /\bthe plot is currently unknown\b/i,
    /\bexpected to release in\b/i,
  ];

  for (const regex of unreleasedIndicators) {
    if (regex.test(textToCheck)) {
      return true;
    }
  }

  // 6. Known unreleased / upcoming titles
  const cleanTitle = (movie.title || '').toLowerCase().trim();
  const knownUpcoming = ['baththa', 'jailer 2', 'kaithi 2', 'rolex', 'avengers: secret wars', 'avatar 3'];
  if (knownUpcoming.some(u => cleanTitle.includes(u))) {
    return true;
  }

  return false;
}
