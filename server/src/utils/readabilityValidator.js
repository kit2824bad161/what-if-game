import { detectAndSanitizeLeaks } from './leakDetector.js';

// Words considered overly complex, academic, or unnatural for college-level storytelling
const DIFFICULT_VOCABULARY = [
  'catastrophic',
  'indefensible',
  'machinations',
  'clandestine',
  'labyrinthine',
  'nefarious',
  'pusillanimous',
  'obfuscation',
  'surreptitiously',
  'unforeseen',
  'paramount',
  'dichotomy',
  'inscrutable',
  'concomitant',
  'inexorable',
  'reprehensible',
  'superfluous',
  'vicissitudes',
  'meretricious',
  'perspicacious',
  'sesquipedalian',
  'truculent',
  'ubiquitous',
  'tactical',
  'ideological',
  'fissures',
  'realignment',
  'preempts',
  'disillusioned',
  'subjugation',
  'precipitate',
  'unilateral',
  'contingency',
  'ostensibly',
  'bureaucratic'
];

/**
 * Validates generated mystery story and clues for readability, simple English, and leak safety
 */
export function validateStoryQuality(storyText, clues = [], blocklist = []) {
  const issues = [];
  const text = (storyText || '').trim();

  // 1. Length & Emptiness check
  if (!text || text.length < 50) {
    issues.push('Story is too short or empty');
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 25) {
    issues.push(`Story has only ${words.length} words (minimum 25 words needed)`);
  } else if (words.length > 300) {
    issues.push(`Story is too long (${words.length} words, maximum 300 words allowed)`);
  }

  // 2. Sentence Length & Complexity
  const rawSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentenceCount = rawSentences.length || 1;
  const avgSentenceLength = Math.round(words.length / sentenceCount);

  if (avgSentenceLength > 32) {
    issues.push(`Sentences are too long and complex (average ${avgSentenceLength} words/sentence, recommend < 25)`);
  }

  // 3. Difficult Vocabulary Check
  const textLower = text.toLowerCase();
  const difficultFound = [];
  for (const word of DIFFICULT_VOCABULARY) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(textLower)) {
      difficultFound.push(word);
    }
  }

  if (difficultFound.length > 0) {
    issues.push(`Found difficult vocabulary: ${difficultFound.join(', ')}`);
  }

  // 4. Spoiler / Leak Check on Story
  const leakCheck = detectAndSanitizeLeaks(text, blocklist);
  if (leakCheck.hasLeak) {
    issues.push(`Direct spoiler terms detected: ${leakCheck.leakedTerms.join(', ')}`);
  }
  const sanitizedStory = leakCheck.sanitizedText;

  // 5. Clues Quality & Leak Check
  const sanitizedClues = [];
  if (!Array.isArray(clues) || clues.length < 2) {
    issues.push('Must provide at least 2 clues');
  } else {
    for (let i = 0; i < clues.length; i++) {
      const clue = (clues[i] || '').trim();
      if (!clue || clue.length < 8) {
        issues.push(`Clue #${i + 1} is too brief or empty`);
      }
      const clueLeak = detectAndSanitizeLeaks(clue, blocklist);
      if (clueLeak.hasLeak) {
        issues.push(`Clue #${i + 1} contains spoiler terms: ${clueLeak.leakedTerms.join(', ')}`);
      }
      sanitizedClues.push(clueLeak.sanitizedText);
    }
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    sanitizedStory,
    sanitizedClues: sanitizedClues.length > 0 ? sanitizedClues : clues,
    issues,
    diagnostics: {
      wordCount: words.length,
      sentenceCount,
      avgSentenceLength,
      leaksDetected: leakCheck.leakedTerms || [],
      difficultWordsDetected: difficultFound,
    },
  };
}
