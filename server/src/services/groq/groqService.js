import Groq from 'groq-sdk';
import { config } from '../../config/env.js';
import { continuityChecker } from '../continuity/continuityChecker.js';
import { validateStoryQuality } from '../../utils/readabilityValidator.js';
import { isMovieUnreleased } from '../../utils/movieLookup.js';

export class GroqService {
  constructor() {
    this._initClient();
  }

  _initClient() {
    this.apiKey = (config.groq.apiKey || '').trim();
    this.hasKey = Boolean(this.apiKey && this.apiKey.length > 0);
    this.client = this.hasKey
      ? new Groq({ apiKey: this.apiKey, timeout: 35000 })
      : null;
    this.model = config.groq.model || 'llama-3.3-70b-versatile';
    this.fallbackModels = config.groq.fallbackModels || ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'];
  }

  isLive() {
    if (!this.client && config.groq.hasKey) {
      this._initClient();
    }
    return Boolean(this.client && this.hasKey);
  }

  /**
   * Safe operational logging: NEVER logs keys, secrets, or full auth headers
   */
  _logSafe(level, message, meta = {}) {
    const safeData = {
      apiKeyConfigured: this.hasKey,
      model: meta.model || this.model,
      durationMs: meta.durationMs !== undefined ? `${meta.durationMs}ms` : undefined,
      httpStatus: meta.httpStatus,
      errorCategory: meta.errorCategory,
      retrievedChunksCount: meta.retrievedChunksCount,
    };
    Object.keys(safeData).forEach(k => safeData[k] === undefined && delete safeData[k]);
    console[level](`[GroqService] ${message} | ${JSON.stringify(safeData)}`);
  }

  /**
   * Helper: call Groq API with JSON schema instruction, model resilience, and safe error handling
   */
  async _callGroqJson(messages, temperature = 0.7, meta = {}) {
    if (!this.isLive()) {
      return null;
    }

    const candidateModels = Array.from(new Set([
      this.model,
      ...(this.fallbackModels || []),
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
    ])).filter(Boolean);

    let lastError = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const modelToTry = candidateModels[i];
      const startTime = Date.now();

      try {
        this._logSafe('info', `Starting Groq generation request`, {
          model: modelToTry,
          retrievedChunksCount: meta.retrievedChunksCount,
        });

        const response = await this.client.chat.completions.create({
          model: modelToTry,
          messages,
          temperature,
          response_format: { type: 'json_object' },
          max_tokens: 3500,
        });

        const durationMs = Date.now() - startTime;
        const rawContent = response.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new Error('Groq returned empty response content');
        }

        let cleaned = rawContent.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleaned);

        // Update active model to the successful one
        this.model = modelToTry;

        this._logSafe('info', `Groq request completed successfully`, {
          model: modelToTry,
          durationMs,
          httpStatus: 200,
          retrievedChunksCount: meta.retrievedChunksCount,
        });

        return { data: parsed, model: modelToTry, durationMs };
      } catch (err) {
        lastError = err;
        const durationMs = Date.now() - startTime;
        const httpStatus = err.status || err.statusCode || (err.response ? err.response.status : undefined);
        const errMsg = err.message || '';
        const isModelNotFound = httpStatus === 404 || errMsg.includes('model_not_found') || errMsg.includes('does not exist');
        const isRateLimit = httpStatus === 429;
        const isAuthError = httpStatus === 401 || httpStatus === 403;

        let errorCategory = 'api_error';
        if (isModelNotFound) errorCategory = 'unsupported_model_or_not_found';
        else if (isRateLimit) errorCategory = 'rate_limit_exceeded';
        else if (isAuthError) errorCategory = 'authentication_failed';
        else if (err instanceof SyntaxError) errorCategory = 'malformed_json_response';
        else if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') errorCategory = 'network_failure';

        this._logSafe('warn', `Groq attempt failed on model "${modelToTry}" (${errorCategory}): ${errMsg}`, {
          model: modelToTry,
          durationMs,
          httpStatus,
          errorCategory,
        });

        // If it was a model not found error and we have more fallback models, try the next
        if (isModelNotFound && i < candidateModels.length - 1) {
          continue;
        }

        // For auth or rate limit errors, don't keep hammering
        break;
      }
    }

    // When live Groq is configured, never silently swallow errors or forge simulated success
    const finalError = new Error(`Live Groq API request failed: ${lastError?.message || 'Unknown error'}`);
    finalError.statusCode = lastError?.status || 502;
    throw finalError;
  }

  /**
   * Generate 2 distinct alternate branches for a movie and a what-if query
   */
  async generateAlternateBranches({ movie, whatIfQuestion, selectedEvent = null, retrievedContext }) {
    if (!this.isLive()) {
      return this._generateSimulatedBranches(movie, whatIfQuestion, selectedEvent, retrievedContext);
    }

    const prompt = `
You are the master narrative architect for WHAT IF — The Alternate Movie Universe.
Analyze the movie "${movie.title}" (${movie.releaseYear}, Language: ${movie.languageLabel}).
The user asks this hypothetical "What If" question:
"${whatIfQuestion}"

${selectedEvent ? `Targeted original canon event: "${selectedEvent.title} - ${selectedEvent.description}"` : ''}

VERIFIED CANON FACTS RETRIEVED VIA RAG:
${retrievedContext.formattedContext}

CRITICAL RULES:
1. Generate TWO meaningfully different alternate story branches:
   - Branch A: Focus on direct action, quick reactions, and immediate physical consequences.
   - Branch B: Focus on emotional shock, broken trust, new alliances, or unexpected danger.
2. Ground the narrative in the verified canon facts retrieved above, but explore bold, authentic cause-and-effect fiction.
3. NEVER describe a newly generated hypothetical event as an original movie event.
4. Explicitly list the verified canon facts used versus newly forged hypothetical fiction.

MANDATORY HUMAN-READABLE ENGLISH STYLE:
1. Write in clear, natural, everyday English that any regular person can easily read and enjoy.
2. Use short, punchy sentences (about 10 to 18 words each). Avoid complex run-on sentences.
3. Tell the story like an excited friend describing a thrilling movie scene.
4. DO NOT use difficult, robotic, academic, or pretentious vocabulary.
   - Strictly avoid words like: "clandestine", "machinations", "tactical realignment", "ideological fractures", "catastrophic collateral damage", "preempts", "concomitant", "dichotomy", "paramount", "inscrutable", "unprecedented", "fissures", "disillusioned", "subjugation", "precipitate", "unilateral", "contingency", "bureaucratic", "ostensibly".
   - Use simple, strong words instead: "secret", "trap", "fight", "team up", "danger", "shock", "escape", "stop", "catch", "surprise attack", "hidden truth".
5. Make character actions and the cause-and-effect sequence crystal clear: show exactly who did what, why they did it, and what happens next.

Output MUST be valid JSON adhering strictly to this schema:
{
  "branches": [
    {
      "branchId": "branch-alpha",
      "title": "Short cinematic branch title in simple English",
      "summary": "3-4 sentence vivid, exciting narrative summary in simple everyday English.",
      "immediateConsequences": ["First immediate ripple effect in simple English", "Second ripple effect in simple English"],
      "characterConsequences": [
        { "character": "Character Name", "change": "Specific outcome or mindset shift in simple words" },
        { "character": "Second Character", "change": "Specific fate in simple words" }
      ],
      "plotConsequences": ["Key story fallout in simple English", "Climax change in simple English"],
      "canonFactsUsed": ["Specific canon fact referenced from retrieved context"],
      "hypotheticalEvents": ["New fictional event fabricated by this timeline"],
      "continuityWarnings": []
    },
    {
      "branchId": "branch-beta",
      "title": "Contrasting cinematic branch title in simple English",
      "summary": "3-4 sentence vivid, exciting narrative summary in simple everyday English.",
      "immediateConsequences": ["Contrasting immediate ripple effect in simple English", "Second ripple effect in simple English"],
      "characterConsequences": [
        { "character": "Character Name", "change": "Specific outcome or mindset shift in simple words" },
        { "character": "Second Character", "change": "Specific fate in simple words" }
      ],
      "plotConsequences": ["Alternative climax or major change in simple English"],
      "canonFactsUsed": ["Specific canon fact referenced from retrieved context"],
      "hypotheticalEvents": ["New fictional event fabricated by this timeline"],
      "continuityWarnings": []
    }
  ]
}
`;

    const messages = [
      { role: 'system', content: 'You are an exciting cinematic storyteller. Write in simple, natural, everyday English that is easy for humans to read. Always respond in valid JSON.' },
      { role: 'user', content: prompt }
    ];

    const result = await this._callGroqJson(messages, 0.75, {
      retrievedChunksCount: retrievedContext?.chunks?.length || 0,
    });

    if (result && result.data && Array.isArray(result.data.branches) && result.data.branches.length >= 2) {
      return {
        branches: result.data.branches.map((b, idx) => ({
          ...b,
          branchId: b.branchId || `branch-${idx === 0 ? 'alpha' : 'beta'}`,
          isSelected: false,
          immediateConsequences: Array.isArray(b.immediateConsequences) ? b.immediateConsequences : [],
          characterConsequences: Array.isArray(b.characterConsequences) ? b.characterConsequences : [],
          plotConsequences: Array.isArray(b.plotConsequences) ? b.plotConsequences : [],
          canonFactsUsed: Array.isArray(b.canonFactsUsed) ? b.canonFactsUsed : [],
          hypotheticalEvents: Array.isArray(b.hypotheticalEvents) ? b.hypotheticalEvents : [],
        })),
        engine: 'groq-live',
        model: result.model,
        durationMs: result.durationMs,
      };
    }

    throw new Error('Groq output did not produce valid alternate branches.');
  }

  /**
   * Continue a timeline branch for a subsequent turn
   */
  async continueTimeline({ movie, priorTurns = [], chosenBranch, userFollowUp, retrievedContext }) {
    if (!this.isLive()) {
      return this._generateSimulatedContinuation(movie, priorTurns, chosenBranch, userFollowUp, retrievedContext);
    }

    const prompt = `
You are continuing an ongoing alternate timeline for "${movie.title}".
Active Branch: "${chosenBranch.title}"
Prior Timeline Summary:
${priorTurns.map(t => `Turn ${t.turnNumber}: Prompt "${t.userPrompt}" -> ${t.narrativeText}`).join('\n')}

New What-If Direction for Next Turn:
"${userFollowUp}"

VERIFIED CANON FACTS:
${retrievedContext.formattedContext}

MANDATORY HUMAN-READABLE ENGLISH STYLE:
1. Write the chapter in clear, simple, conversational English that is very easy for a human to read.
2. Keep sentences short, active, and punchy (10-18 words each).
3. Tell what happens next like an exciting movie scene.
4. DO NOT use difficult, robotic, or pretentious vocabulary (no words like "clandestine", "machinations", "tactical realignment", "catastrophic", "fissures").
5. Focus on clear character choices, intense action, and immediate results.

Generate the next sequential turn in this universe. Output valid JSON:
{
  "continuationTitle": "Cinematic episode/chapter title in simple words",
  "narrativeText": "4-5 sentence exciting, easy-to-read chapter continuing the alternate story in simple English.",
  "canonFactsReferenced": ["Fact from original movie that anchors this turn"],
  "newHypotheticalFacts": ["New event forged in this turn in simple words"],
  "characterStatusUpdates": [
    { "character": "Name", "status": "Updated condition or role in simple words" }
  ],
  "continuityWarnings": []
}
`;

    const messages = [
      { role: 'system', content: 'You are continuing an alternate movie universe. Write in simple, natural everyday English. Output valid JSON.' },
      { role: 'user', content: prompt }
    ];

    const result = await this._callGroqJson(messages, 0.7, {
      retrievedChunksCount: retrievedContext?.chunks?.length || 0,
    });

    if (result && result.data && result.data.narrativeText) {
      return {
        turn: result.data,
        engine: 'groq-live',
        model: result.model,
        durationMs: result.durationMs,
      };
    }

    throw new Error('Groq continuation did not return valid narrativeText.');
  }

  /**
   * Explain the exact, authentic movie story in simple, human-understandable English
   */
  async generateExactStory({ movie, whatIfQuestion = '', selectedEvent = null, retrievedContext }) {
    if (isMovieUnreleased(movie)) {
      return {
        story: null,
        isUnreleased: true,
        message: `"${movie.title}" has not been released yet! Because this movie is not yet released, the exact canon story and climax cannot be revealed or generated.`,
        engine: 'canon-guard',
      };
    }

    if (!this.isLive()) {
      return this._generateSimulatedExactStory(movie, whatIfQuestion, selectedEvent, retrievedContext);
    }

    const prompt = `
You are an expert movie storyteller and film fan.
Explain the EXACT, REAL movie story of "${movie.title}" (${movie.releaseYear}, dir. ${movie.director || 'Cinema'}, language: ${movie.languageLabel}).
${whatIfQuestion ? `The user also asked this question / turning point: "${whatIfQuestion}". Clearly explain what ACTUALLY happened in the original film canon regarding this scene or question!` : ''}
${selectedEvent ? `Targeted original canon turning point: "${selectedEvent.title} - ${selectedEvent.description}"` : ''}

VERIFIED CANON FACTS RETRIEVED VIA RAG FROM DATABASE:
${retrievedContext.formattedContext}

CRITICAL UNRELEASED CHECK:
If "${movie.title}" has NOT been released yet (upcoming, in production, future release year), DO NOT make up an exact plot, ending, or fake canon events!
Instead, output JSON:
{
  "isUnreleased": true,
  "movieTitle": "${movie.title}",
  "releaseYear": ${movie.releaseYear},
  "message": "This film has not been released yet, so the exact canon story is not available."
}

MANDATORY HUMAN-READABLE ENGLISH STYLE:
1. Write in clear, simple, natural, everyday English that any regular human can easily read and understand.
2. Use short, active, punchy sentences.
3. Tell the exact story like an excited movie fan explaining the plot to a friend.
4. DO NOT use difficult, robotic, academic, or pretentious words (no "clandestine", "machinations", "paramount", "catastrophic", "tactical realignment", etc.).
5. Clearly break down:
   - A simple 2-sentence summary of the real movie.
   - Canon Reality Check: If a question was asked (e.g., "What if Karnan was captured alive..."), explain what ACTUALLY happened in the real movie (e.g., "In the real movie, Karnan was never captured. He faked his death to protect his grandson...").
   - Act 1 (Beginning), Act 2 (The Rising Conflict & Twist), Act 3 (Climax & Real Ending).
   - What really happens to each key character in the end.
   - Key canon facts from the real film.

Output strictly valid JSON adhering to this schema:
{
  "movieTitle": "${movie.title}",
  "releaseYear": ${movie.releaseYear},
  "director": "${movie.director || ''}",
  "languageLabel": "${movie.languageLabel || 'Cinema'}",
  "quickSummary": "2 clear, exciting, simple English sentences summarizing the real movie plot.",
  "canonRealityCheck": {
    "question": "${(whatIfQuestion || '').replace(/"/g, '\\"')}",
    "whatActuallyHappened": "Clear, direct explanation in simple English of what really occurred in the original movie regarding this question or turning point."
  },
  "acts": [
    {
      "actNumber": 1,
      "title": "Act 1: The Beginning & Setup",
      "description": "3-4 simple, engaging sentences describing how the story starts and who the characters are."
    },
    {
      "actNumber": 2,
      "title": "Act 2: The Rising Conflict & Twists",
      "description": "3-4 simple, engaging sentences describing the big revelations, fights, and challenges."
    },
    {
      "actNumber": 3,
      "title": "Act 3: The Climax & True Ending",
      "description": "3-4 simple, engaging sentences describing the final confrontation and how the movie actually concludes."
    }
  ],
  "characterFates": [
    {
      "character": "Character Name",
      "role": "Role in the movie",
      "realFate": "What actually happens to them in the end in simple words."
    }
  ],
  "keyCanonFacts": [
    "A simple verified fact from the real movie",
    "Another simple verified fact from the real movie"
  ]
}
`;

    const messages = [
      { role: 'system', content: 'You are an engaging film historian and storyteller. Write in simple, natural, everyday English. Output strictly valid JSON.' },
      { role: 'user', content: prompt }
    ];

    try {
      const result = await this._callGroqJson(messages, 0.7, {
        retrievedChunksCount: retrievedContext?.chunks?.length || 0,
      });

      if (result && result.data) {
        if (result.data.isUnreleased) {
          return {
            story: null,
            isUnreleased: true,
            message: result.data.message || `"${movie.title}" has not been released yet! Because this movie is not yet released, the exact canon story and climax cannot be revealed or generated.`,
            engine: 'groq-live',
            model: result.model,
          };
        }

        if (result.data.acts && result.data.quickSummary) {
          return {
            story: result.data,
            engine: 'groq-live',
            model: result.model,
            durationMs: result.durationMs,
          };
        }
      }
    } catch (err) {
      console.warn('[GroqService] Live exact story generation failed, using high-fidelity fallback:', err.message);
    }

    return this._generateSimulatedExactStory(movie, whatIfQuestion, selectedEvent, retrievedContext);
  }

  /**
   * Judge a Story Battle between two players
   */
  async judgeStoryBattle({ movieTitle, publicScenario, player1, player2, canonContext }) {
    if (!this.isLive()) {
      return this._generateSimulatedJudge(movieTitle, publicScenario, player1, player2, canonContext);
    }

    const prompt = `
You are the impartial, elite AI Grand Story Judge for WHAT IF Story Battle.
Movie: "${movieTitle}"
Starting Scenario: "${publicScenario}"
VERIFIED CANON CONTEXT:
${canonContext}

PLAYER 1 (${player1.playerName}) SUBMISSION:
"""
${player1.submissionText}
"""

PLAYER 2 (${player2.playerName}) SUBMISSION:
"""
${player2.submissionText}
"""

EVALUATION CRITERIA (Score 1 to 10 for each):
1. Creativity & Narrative Drama: How cinematic, original, and compelling is the continuation?
2. Canon Fact Integration: How authentically does it weave in the world rules and verified movie context?
3. Internal Consistency: Does the logic hold together without glaring plotholes?

Output valid JSON:
{
  "player1Feedback": {
    "creativityScore": 8,
    "canonScore": 9,
    "consistencyScore": 8,
    "totalScore": 25,
    "strongestElement": "Praise for specific element",
    "weakestElement": "Constructive critique",
    "commentary": "Two sentences evaluating Player 1."
  },
  "player2Feedback": {
    "creativityScore": 9,
    "canonScore": 8,
    "consistencyScore": 9,
    "totalScore": 26,
    "strongestElement": "Praise for specific element",
    "weakestElement": "Constructive critique",
    "commentary": "Two sentences evaluating Player 2."
  },
  "winnerPlayerId": "${player1.submissionText.length > player2.submissionText.length ? player1.playerId : player2.playerId}",
  "isDraw": false,
  "verdictSummary": "Detailed explanation of why the winner won or why it was a draw."
}
`;

    const messages = [
      { role: 'system', content: 'You are a fair, expert AI Judge. Output strictly valid JSON.' },
      { role: 'user', content: prompt }
    ];

    const result = await this._callGroqJson(messages, 0.5);
    if (result && result.data && result.data.player1Feedback && result.data.player2Feedback) {
      return {
        ...result.data,
        engine: 'groq-live',
        model: result.model,
      };
    }

    throw new Error('Groq Story Battle judging failed to produce feedback.');
  }

  /**
   * Generate alternate story for Movie Guess with a What-If prompt (Feature 1 Simple English)
   */
  async generateMovieGuessStory({ movie, whatIfPrompt, retrievedContext, blocklist = [] }) {
    if (!this.isLive()) {
      return this._generateSimulatedMovieGuessStory(movie, whatIfPrompt, retrievedContext);
    }

    const buildPrompt = (feedback = '') => `
You are creating a movie-guessing challenge based on an alternate timeline What-If scenario.
A player must read the story and deduce the original movie.

WHAT-IF SCENARIO:
"${whatIfPrompt}"

CANON FACTS FROM THE ORIGINAL MOVIE (RETRIEVED VIA RAG):
${retrievedContext.formattedContext}

STRICT SPOILER RULES (NEVER BREAK THESE):
1. NEVER mention the movie title ("${movie.title}") or aliases (${movie.aliases?.join(', ') || 'none'}).
2. NEVER mention actor names (${movie.characters?.map(c => c.actor).filter(Boolean).join(', ')}).
3. NEVER mention director name (${movie.director}).
4. NEVER use real character names from this list: ${blocklist.join(', ')}.
Instead, use clear descriptive labels or fictional names (e.g., "the undercover agent", "the prison convict", "the drug lord", "the honest inspector").

LANGUAGE STYLE (MANDATORY SIMPLE ENGLISH):
1. Use simple, everyday English that an average college student can easily understand.
2. Use short, clear sentences and familiar words.
3. Make the story sound like a human storyteller describing an exciting movie plot to a friend.
4. Maintain logical connections between events, characters, and consequences.
5. Avoid difficult or pretentious vocabulary (do NOT use words like "catastrophic", "indefensible", "machinations", "clandestine", "labyrinthine", "nefarious").
6. Keep character motivations and the cause-and-effect sequence easy to follow.
7. Write clues in simple, clear English too.
${feedback ? `\nPREVIOUS ATTEMPT FEEDBACK (FIX THESE ISSUES):\n${feedback}\n` : ''}
OUTPUT STRICT JSON:
{
  "mysteryStory": "A 4-5 sentence exciting, easy-to-read story in simple English describing the alternate events.",
  "clues": [
    "Clue 1: A simple clue about the main character's situation or goal",
    "Clue 2: A simple clue about the unique plot conflict or action",
    "Clue 3: A simple clue about the movie's recognizable style or theme"
  ]
}
`;

    const messages = [
      { role: 'system', content: 'You are an exciting cinematic storyteller. Write in simple, natural English. Always output strictly valid JSON.' },
      { role: 'user', content: buildPrompt() }
    ];

    let result = await this._callGroqJson(messages, 0.7, {
      retrievedChunksCount: retrievedContext?.chunks?.length || 0,
    });

    if (result?.data?.mysteryStory) {
      let validation = validateStoryQuality(result.data.mysteryStory, result.data.clues, blocklist);
      if (!validation.isValid && validation.issues.length > 0) {
        this._logSafe('warn', `Movie Guess generation had readability/leak issues: ${validation.issues.join('; ')}. Retrying once with targeted feedback.`);
        messages.push({ role: 'assistant', content: JSON.stringify(result.data) });
        messages.push({ role: 'user', content: `Please rewrite the story and clues to fix these issues:\n- ${validation.issues.join('\n- ')}\nRemember: use simple everyday English, short sentences, and keep secret names hidden.` });
        const retryResult = await this._callGroqJson(messages, 0.6, {
          retrievedChunksCount: retrievedContext?.chunks?.length || 0,
        });
        if (retryResult?.data?.mysteryStory) {
          result = retryResult;
          validation = validateStoryQuality(result.data.mysteryStory, result.data.clues, blocklist);
        }
      }

      return {
        mysteryStory: validation.sanitizedStory,
        clues: validation.sanitizedClues,
        validation,
        engine: 'groq-live',
        model: result.model,
      };
    }

    throw new Error('Groq Movie Guess generation failed to produce valid mysteryStory.');
  }

  /**
   * Generate an original mystery story inspired by a movie's plot/characters (Feature 2: Mystery Movie Challenge)
   * Uses RAG context without any custom What-If prompt from user.
   */
  async generateMysteryMovieChallenge({ movie, retrievedContext, blocklist = [] }) {
    if (!this.isLive()) {
      return this._generateSimulatedMysteryChallenge(movie, retrievedContext);
    }

    const buildPrompt = (feedback = '') => `
You are a master storyteller creating a "Mystery Movie Challenge" puzzle.
A player must guess the original movie based on an original fictional mystery story you create.

ORIGINAL MOVIE INFORMATION (RETRIEVED VIA RAG FROM DATABASE):
${retrievedContext.formattedContext}

STRICT SPOILER RULES (NEVER BREAK THESE):
1. NEVER mention the movie title ("${movie.title}") or any aliases (${movie.aliases?.join(', ') || 'none'}).
2. NEVER use real character names from this list: ${blocklist.join(', ')}.
3. NEVER mention actor names (${movie.characters?.map(c => c.actor).filter(Boolean).join(', ')}).
4. NEVER mention director name (${movie.director}).

HOW TO CREATE THE MYSTERY STORY:
- Create an original, fictional story that mirrors the core plot pattern, character motivations, conflicts, and unique world rules of the original movie.
- Replace character names with fictional names or clear roles (for example, call characters "Kiran", "Dharma", "Ravi", or "the undercover officer", "the desperate prisoner", "the ruthless cartel boss").
- Transform the setting and specific items into fictional equivalents, but KEEP the recognizable drama, key dilemmas, and cause-and-effect sequence so the movie can be deduced.
- Do NOT just summarize the movie word-for-word. Make it an exciting, original story inspired by the movie's core plot.

LANGUAGE STYLE (MANDATORY SIMPLE ENGLISH):
1. Use simple, everyday English that an average college student can easily understand.
2. Prefer short, clear sentences and familiar words.
3. Make the story sound like a human storyteller describing an exciting movie plot to a friend.
4. Maintain logical connections between events, characters, and consequences.
5. Avoid difficult or pretentious vocabulary (do NOT use words like "catastrophic", "indefensible", "machinations", "clandestine", "labyrinthine", "nefarious").
6. Keep character motivations, relationships, and the cause-and-effect sequence easy to follow.
7. Write clues in simple, clear English too.
${feedback ? `\nPREVIOUS ATTEMPT FEEDBACK (FIX THESE ISSUES):\n${feedback}\n` : ''}
OUTPUT STRICT JSON:
{
  "mysteryStory": "A 4-6 sentence exciting, easy-to-read story in simple English describing the mystery plot.",
  "clues": [
    "Clue 1: A simple clue about the main character's situation or goal",
    "Clue 2: A simple clue about the central conflict or unique plot element",
    "Clue 3: A simple clue about the movie's iconic themes or recognizable moments"
  ]
}
`;

    const messages = [
      { role: 'system', content: 'You are an elite storyteller crafting mystery movie deduction challenges in simple, natural English. Output strictly valid JSON.' },
      { role: 'user', content: buildPrompt() }
    ];

    let result = await this._callGroqJson(messages, 0.7, {
      retrievedChunksCount: retrievedContext?.chunks?.length || 0,
    });

    if (result?.data?.mysteryStory) {
      let validation = validateStoryQuality(result.data.mysteryStory, result.data.clues, blocklist);
      if (!validation.isValid && validation.issues.length > 0) {
        this._logSafe('warn', `Mystery challenge generation had quality issues: ${validation.issues.join('; ')}. Retrying once with targeted feedback.`);
        messages.push({ role: 'assistant', content: JSON.stringify(result.data) });
        messages.push({ role: 'user', content: `Please rewrite the mystery story and clues to fix these issues:\n- ${validation.issues.join('\n- ')}\nRemember: use simple everyday English, short sentences, and keep secret names hidden.` });
        const retryResult = await this._callGroqJson(messages, 0.6, {
          retrievedChunksCount: retrievedContext?.chunks?.length || 0,
        });
        if (retryResult?.data?.mysteryStory) {
          result = retryResult;
          validation = validateStoryQuality(result.data.mysteryStory, result.data.clues, blocklist);
        }
      }

      return {
        mysteryStory: validation.sanitizedStory,
        clues: validation.sanitizedClues,
        validation,
        engine: 'groq-live',
        model: result.model,
      };
    }

    throw new Error('Groq Mystery Movie Challenge generation failed to produce valid mysteryStory.');
  }


  // ==========================================
  // SIMULATED FALLBACK GENERATORS (Deterministic, High Fidelity)
  // ==========================================

  _generateSimulatedBranches(movie, question, selectedEvent, retrievedContext) {
    const topCanonChunk = retrievedContext.chunks?.[0]?.text || movie.plotSummary.slice(0, 200);
    const mainChar = movie.characters?.[0]?.name || 'The Hero';
    const secondChar = movie.characters?.[1]?.name || 'The Ally';
    const rivalChar = movie.characters?.[2]?.name || 'The Villain';

    const branchAlpha = {
      branchId: 'branch-alpha',
      title: `The Direct Strike: ${question.slice(0, 45)}`,
      summary: `In this new timeline, ${mainChar} learns about the danger right before it happens. Instead of getting caught in a trap, ${mainChar} moves fast and ambushes ${rivalChar}'s crew directly at the warehouse. This bold counterattack ruins the enemy plan, protects innocent allies, and forces corrupt officials out into the open.`,
      immediateConsequences: [
        `${mainChar} blocks the first surprise attack and keeps close friends alive.`,
        `${secondChar} sees the truth early and joins ${mainChar} to fight together openly.`,
      ],
      characterConsequences: [
        { character: mainChar, change: 'Steps out of hiding to lead the fight openly and protect the family.' },
        { character: rivalChar, change: 'Panics after losing the surprise advantage and makes reckless errors.' },
        { character: secondChar, change: 'Refuses to follow corrupt chiefs and stands firmly with the hero.' }
      ],
      plotConsequences: [
        'The villain trap is completely flipped, trapping the enemies instead.',
        'Secret proof of corruption leaks to the public, turning the whole city against the villains.'
      ],
      canonFactsUsed: [
        topCanonChunk.slice(0, 160) + '...',
        `Ground rule of ${movie.title}: Character loyalties and family protection drive every big choice.`
      ],
      hypotheticalEvents: [
        `What-If Event: ${mainChar} changes the secret meeting location at the last minute.`,
        `What-If Event: The decisive showdown takes place in broad daylight in front of the whole town.`
      ],
      continuityWarnings: [],
      isSelected: false,
    };

    const branchBeta = {
      branchId: 'branch-beta',
      title: `The Broken Circle: A Race For Survival`,
      summary: `This divergence takes a shocking psychological turn. When the truth gets exposed too early, ${mainChar} refuses to follow the original plan. An intense standoff between ${mainChar} and ${rivalChar} divides the city into rival sides. Caught in the middle, ${secondChar} must make a painful choice between blindly obeying orders or standing up for justice.`,
      immediateConsequences: [
        `Trust breaks down among allies, and nobody is sure who can be trusted.`,
        `The enemy gang takes advantage of the confusion to seize vital streets and weapons.`
      ],
      characterConsequences: [
        { character: mainChar, change: 'Disgusted by systemic lies, decides to take justice into his own hands.' },
        { character: secondChar, change: 'Must risk his job and his life to stop innocent people from getting hurt.' },
        { character: rivalChar, change: 'Strikes quickly while everyone is distracted to eliminate any competition.' }
      ],
      plotConsequences: [
        'A chaotic three-way battle breaks out with dangerous surprises on every side.',
        'The final clash forces every hero and villain into an unforgettable last stand.'
      ],
      canonFactsUsed: [
        `Verified context: ${topCanonChunk.slice(0, 150)}...`
      ],
      hypotheticalEvents: [
        `What-If Event: Secret messages are intercepted by unexpected third parties.`,
        `What-If Event: A dramatic split happens inside the inner circle before nightfall.`
      ],
      continuityWarnings: [
        {
          type: 'continuity_warning',
          message: 'Branch Beta tests character loyalties to their absolute breaking point.'
        }
      ],
      isSelected: false,
    };

    return {
      branches: [branchAlpha, branchBeta],
      engine: 'groq-simulated',
      model: this.model,
    };
  }

  _generateSimulatedContinuation(movie, priorTurns, chosenBranch, followUp, retrievedContext) {
    const turnCount = priorTurns.length + 1;
    const mainChar = movie.characters?.[0]?.name || 'The Hero';
    const rivalChar = movie.characters?.[2]?.name || 'The Adversary';

    return {
      turn: {
        continuationTitle: `Chapter ${turnCount}: The Next Stand`,
        narrativeText: `Following the events of "${followUp}", ${mainChar} quickly secures a safe spot for the survivors. The bold choices from "${chosenBranch.title}" have completely shifted the battle. When ${rivalChar}'s armed squad arrives at the border, both sides know there is no turning back. They must either settle the score right here or lose everything they fought to protect.`,
        canonFactsReferenced: [
          `Rooted in ${movie.title} core lore: Every choice directly impacts the hero's loved ones.`
        ],
        newHypotheticalFacts: [
          `Turn ${turnCount} Event: The heroes take control of the main road to cut off the enemy escape.`
        ],
        characterStatusUpdates: [
          { character: mainChar, status: 'Ready for the final confrontation' },
          { character: rivalChar, status: 'Cornered and calling in all backup' }
        ],
        continuityWarnings: []
      },
      engine: 'groq-simulated',
      model: this.model,
    };
  }

  _generateSimulatedExactStory(movie, whatIfQuestion, selectedEvent, retrievedContext) {
    if (isMovieUnreleased(movie)) {
      return {
        story: null,
        isUnreleased: true,
        message: `"${movie.title}" has not been released yet! Because this movie is not yet released, the exact canon story and climax cannot be revealed or generated.`,
        engine: 'canon-guard',
      };
    }

    const cleanOverview = movie.overview
      ? movie.overview
      : `${movie.title} is an exciting ${movie.languageLabel || 'cinema'} film directed by ${movie.director || 'the director'}. It tells a thrilling story with high emotional stakes and unforgettable characters.`;

    let whatActuallyHappened = '';
    if (selectedEvent) {
      whatActuallyHappened = `In the original movie canon: ${selectedEvent.description}`;
    } else if (whatIfQuestion) {
      const firstEvent = movie.canonEvents?.[0]?.description || movie.plotSummary?.split('\n\n')?.[0];
      whatActuallyHappened = `In the real film, this hypothetical change did NOT happen. Here is what truly happened in the original story: ${firstEvent || 'the characters followed the authentic canon screenplay.'}`;
    } else {
      whatActuallyHappened = `This is the verified original story of ${movie.title} exactly as shown on the screen.`;
    }

    let acts = [];
    if (movie.canonEvents && movie.canonEvents.length >= 3) {
      acts = [
        {
          actNumber: 1,
          title: `Act 1: ${movie.canonEvents[0].title}`,
          description: movie.canonEvents[0].description,
        },
        {
          actNumber: 2,
          title: `Act 2: ${movie.canonEvents[1].title}`,
          description: movie.canonEvents[1].description,
        },
        {
          actNumber: 3,
          title: `Act 3: ${movie.canonEvents[2].title}`,
          description: movie.canonEvents[2].description,
        },
      ];
    } else {
      const paragraphs = (movie.plotSummary || '').split('\n\n').filter(Boolean);
      acts = [
        {
          actNumber: 1,
          title: 'Act 1: The Setup & Beginning',
          description: paragraphs[0] || `${movie.title} introduces the main characters, the world, and the first major danger that sets the adventure in motion.`,
        },
        {
          actNumber: 2,
          title: 'Act 2: The Rising Conflict & Twists',
          description: paragraphs[1] || `The heroes face dangerous obstacles, shocking secrets, and unexpected turns as enemy forces close in.`,
        },
        {
          actNumber: 3,
          title: 'Act 3: The Climax & Resolution',
          description: paragraphs[2] || paragraphs[paragraphs.length - 1] || `In the epic final showdown, the conflict reaches its peak, resolving the characters' fates and concluding the film.`,
        },
      ];
    }

    const characterFates = (movie.characters || []).slice(0, 5).map(c => ({
      character: c.name,
      role: c.role || 'Main Character',
      realFate: c.summary || `Plays a vital role in the events of ${movie.title}.`,
    }));

    const keyCanonFacts = (retrievedContext?.chunks || []).slice(0, 4).map(chunk => chunk.text.slice(0, 160) + '...');
    if (keyCanonFacts.length === 0 && movie.worldRules) {
      keyCanonFacts.push(...movie.worldRules.slice(0, 3));
    }

    return {
      story: {
        movieTitle: movie.title,
        releaseYear: movie.releaseYear,
        director: movie.director || '',
        languageLabel: movie.languageLabel || 'Tamil',
        quickSummary: cleanOverview,
        canonRealityCheck: {
          question: whatIfQuestion || '',
          whatActuallyHappened,
        },
        acts,
        characterFates,
        keyCanonFacts,
      },
      engine: 'verified-canon-engine',
      model: this.model,
    };
  }

  _generateSimulatedJudge(movieTitle, publicScenario, player1, player2, canonContext) {
    const len1 = (player1.submissionText || '').length;
    const len2 = (player2.submissionText || '').length;

    const p1Score = Math.min(28, 20 + Math.floor(len1 / 40));
    const p2Score = Math.min(29, 21 + Math.floor(len2 / 38));

    const winnerId = p2Score > p1Score ? player2.playerId : player1.playerId;

    return {
      player1Feedback: {
        creativityScore: 8,
        canonScore: 8,
        consistencyScore: Math.round(p1Score / 3),
        totalScore: p1Score,
        strongestElement: 'Strong dramatic pacing and character momentum.',
        weakestElement: 'Could anchor more deeply into original world rules.',
        commentary: `Player 1 created a tight, pulse-pounding escalation directly addressing "${publicScenario}".`
      },
      player2Feedback: {
        creativityScore: 9,
        canonScore: 9,
        consistencyScore: Math.round(p2Score / 3),
        totalScore: p2Score,
        strongestElement: 'Exceptional blend of cinematic canon nuances with unexpected divergence.',
        weakestElement: 'High-density prose with rapid scene transitions.',
        commentary: `Player 2 delivered a masterclass in alternate universe storytelling, preserving authentic character voices while flipping the stakes.`
      },
      winnerPlayerId: winnerId,
      isDraw: p1Score === p2Score,
      verdictSummary: p1Score === p2Score
        ? 'A dead heat: Both storytellers demonstrated formidable command over the cinematic timeline.'
        : `Victory awarded based on deeper canonical integration and audacious narrative execution.`,
      engine: 'groq-simulated',
    };
  }

  _generateSimulatedMovieGuessStory(movie, whatIfPrompt, retrievedContext) {
    return {
      mysteryStory: `In this alternate timeline, an undercover fighter learns about the gang's ambush before it happens. He decides not to stay in hiding. Instead, he meets the enemies head-on at the city warehouse and takes back the stolen cargo. This sudden move shocks the corrupt police commissioner and starts an open war for control of the city streets.`,
      clues: [
        `Setting: A gritty, high-stakes action thriller set during intense night operations.`,
        `Main Conflict: A retired special operative fights covertly against a violent drug kingpin.`,
        `Famous Element: Known for its heavy machine guns, energetic background score, and a shared movie universe.`
      ],
      engine: 'groq-simulated',
    };
  }

  _generateSimulatedMysteryChallenge(movie, retrievedContext) {
    const titleLower = (movie.title || '').toLowerCase();
    if (titleLower.includes('maanadu')) {
      return {
        mysteryStory: `An ordinary young man flies into a major city for a personal trip, but he is suddenly grabbed by a corrupt police officer. The officer forces him to take a rifle and shoot a top political leader at a crowded rally to start widespread riots. When the young man refuses and gets killed, he suddenly wakes up alive on the exact same flight landing on the runway. He soon discovers that he is trapped in a repeating time loop, and the crooked officer can remember every loop too.`,
        clues: [
          `Main Character: An ordinary man who resets back to an airplane seat whenever he dies.`,
          `Key Conflict: He must outsmart a corrupt police officer who also remembers the time loop.`,
          `Plot Goal: Stop an assassination at a giant political rally and break the endless cycle.`
        ],
        engine: 'groq-simulated',
      };
    }

    if (titleLower.includes('kaithi')) {
      return {
        mysteryStory: `A recently released prisoner just wants to travel to an orphanage to meet his young daughter for the very first time. However, an injured police inspector recruits him on a dark night to drive a large truck full of unconscious officers to a hospital. While armed gangsters chase the truck from behind, a small group of trapped college students must defend the police headquarters from an overwhelming siege.`,
        clues: [
          `Main Character: A tough prisoner who only wants to see his daughter after years in jail.`,
          `The Journey: Driving a giant truck through dark roads under non-stop enemy attacks.`,
          `The Location: An entire police station surrounded by heavily armed gang members.`
        ],
        engine: 'groq-simulated',
      };
    }

    return {
      mysteryStory: `An elite retired operative is pulled back into action after his family is targeted by a powerful syndicate. While a dedicated young detective tries to solve a string of masked vigilante attacks, the old warrior quietly works from the shadows to wipe out the city's largest drug network. The tension peaks in a massive warehouse showdown where heavy weapons and deep secrets decide who survives.`,
      clues: [
        `Main Character: A grandfather and former black-ops commander fighting for his family.`,
        `Core Conflict: An undercover investigation clashes with a massive drug syndicate.`,
        `Style: Intense hand-to-hand fights, big weapons, and an iconic music score.`
      ],
      engine: 'groq-simulated',
    };
  }
}

export const groqService = new GroqService();
