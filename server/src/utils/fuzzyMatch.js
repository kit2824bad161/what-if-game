import Fuse from 'fuse.js';

/**
 * Fuzzy movie title matcher using Fuse.js
 * Checks if a player's guess matches the target movie or its aliases.
 */
export function isCorrectGuess(guess, targetMovie) {
  if (!guess || !targetMovie) return false;

  const normalizedGuess = guess.toLowerCase().trim().replace(/[^\w\s]/g, '');

  // 1. Direct normalized match against title or original title
  const directTitles = [
    targetMovie.title,
    targetMovie.originalTitle,
    ...(targetMovie.aliases || []),
  ].map(t => (t || '').toLowerCase().trim().replace(/[^\w\s]/g, ''));

  if (directTitles.includes(normalizedGuess)) {
    return true;
  }

  // 2. Fuzzy search using Fuse.js
  const candidates = directTitles.map(t => ({ title: t }));
  const fuse = new Fuse(candidates, {
    keys: ['title'],
    threshold: 0.25, // strict threshold to avoid false positives
    distance: 10,
  });

  const results = fuse.search(normalizedGuess);
  return results.length > 0;
}
