/**
 * Movie Guess Leak Detector
 * Server-side security check to ensure generated alternate stories never leak
 * the movie title, character names, actor names, or director.
 */

export function buildMovieBlocklist(movie) {
  const terms = new Set();

  // 1. Movie title and aliases
  if (movie.title) terms.add(movie.title.toLowerCase().trim());
  if (movie.originalTitle) terms.add(movie.originalTitle.toLowerCase().trim());
  if (movie.aliases) {
    movie.aliases.forEach(a => terms.add(a.toLowerCase().trim()));
  }

  // 2. Character names and parts of names
  if (movie.characters) {
    movie.characters.forEach(c => {
      if (c.name) {
        terms.add(c.name.toLowerCase().trim());
        // Add individual name tokens (e.g. "Vikram", "Amar", "Santhanam")
        c.name.toLowerCase().split(/\s+/).forEach(token => {
          if (token.length > 3) terms.add(token);
        });
      }
      if (c.actor) {
        terms.add(c.actor.toLowerCase().trim());
        c.actor.toLowerCase().split(/\s+/).forEach(token => {
          if (token.length > 3) terms.add(token);
        });
      }
    });
  }

  // 3. Director
  if (movie.director) {
    terms.add(movie.director.toLowerCase().trim());
  }

  return Array.from(terms);
}

/**
 * Scan text for any terms from the blocklist.
 * Returns { hasLeak: boolean, leakedTerms: string[], sanitizedText: string }
 */
export function detectAndSanitizeLeaks(text, blocklist) {
  if (!text) return { hasLeak: false, leakedTerms: [], sanitizedText: '' };

  const leakedTerms = [];
  let sanitizedText = text;

  for (const term of blocklist) {
    if (!term || term.length < 3) continue;

    // Word boundary regex
    const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
    if (regex.test(text)) {
      leakedTerms.push(term);
      // Replace with generic archetype placeholder
      sanitizedText = sanitizedText.replace(regex, '[REDACTED]');
    }
  }

  return {
    hasLeak: leakedTerms.length > 0,
    leakedTerms,
    sanitizedText,
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
