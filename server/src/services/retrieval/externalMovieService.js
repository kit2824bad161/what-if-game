import { Movie } from '../../models/Movie.js';
import { MovieChunk } from '../../models/MovieChunk.js';
import { ingestionPipeline } from '../ingestion/ingestionPipeline.js';
import { config } from '../../config/env.js';
import { groqService } from '../groq/groqService.js';

/**
 * Service for dynamically retrieving, verifying, structuring, and indexing
 * movie knowledge for arbitrary movie titles.
 */

// Helper: Clean and normalize base title for comparison
function cleanBaseTitle(str) {
  return (str || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ') // remove parentheticals like (film), (2023 film)
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Helper: Extract 4-digit release year from string
function extractYear(str) {
  const match = (str || '').match(/\b(19\d{2}|20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper: Generate URL-safe slug for movieId
function generateMovieId(title, year) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return year ? `${base}-${year}` : `${base}-${Date.now().toString(36)}`;
}

export class ExternalMovieService {
  constructor() {
    this.userAgent = 'WhatIfMovieUniverse/1.0 (canon-retrieval@whatif.ai)';
    this.requestTimeoutMs = 6000;
  }

  /**
   * Safe fetch with AbortController timeout
   */
  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          ...(options.headers || {}),
        },
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Search Wikipedia for movie articles and select the best verified candidate
   */
  async searchWikipedia(query, options = {}) {
    const rawQuery = (query || '').trim();
    if (!rawQuery) return null;

    const requestedYear = options.year || extractYear(rawQuery);
    const cleanQuery = rawQuery.replace(/\b(19\d{2}|20\d{2})\b/g, '').replace(/[()]/g, '').trim();

    // Fast search: search with film keyword first, fall back to base query if empty
    const primaryQuery = requestedYear
      ? `${cleanQuery} ${requestedYear} film`
      : `${cleanQuery} film`;

    let candidateList = [];

    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(primaryQuery)}&format=json&srlimit=6`;
      const res = await this._fetchWithTimeout(searchUrl);
      if (res.ok) {
        const data = await res.json();
        candidateList = data?.query?.search || [];
      }
    } catch (err) {
      console.warn(`[ExternalMovieService] Wikipedia primary search warning for "${primaryQuery}": ${err.message}`);
    }

    // Secondary fallback search if primary returned nothing
    if (candidateList.length === 0) {
      try {
        const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&srlimit=6`;
        const res = await this._fetchWithTimeout(fallbackUrl);
        if (res.ok) {
          const data = await res.json();
          candidateList = data?.query?.search || [];
        }
      } catch (err) {
        console.warn(`[ExternalMovieService] Wikipedia fallback search warning for "${cleanQuery}": ${err.message}`);
      }
    }

    if (candidateList.length === 0) {
      return null;
    }

    // Score and rank candidates
    const scoredCandidates = candidateList.map((item) => {
      const candTitle = item.title;
      const baseCand = cleanBaseTitle(candTitle);
      const cleanQ = cleanBaseTitle(cleanQuery);
      const snippet = item.snippet || '';
      let score = 0;

      // Exact base title match: e.g. "Jailer" matches "Jailer (2023 Tamil film)"
      if (baseCand === cleanQ) {
        score += 50;
      } else if (baseCand.startsWith(cleanQ) || cleanQ.startsWith(baseCand)) {
        score += 25;
      }

      // Title contains "(film)" or "(... film)"
      if (/\((?:[^)]*?\s)?film\)/i.test(candTitle) || /\((?:19|20)\d{2}\s+(?:[^)]*?\s)?film\)/i.test(candTitle)) {
        score += 30;
      }

      // Year match
      const candYear = extractYear(candTitle) || extractYear(snippet);
      if (requestedYear && candYear === requestedYear) {
        score += 40;
      }

      // Language match if requested (e.g. Tamil, Hindi, Telugu)
      if (options.language) {
        const langLower = options.language.toLowerCase();
        if (candTitle.toLowerCase().includes(langLower) || snippet.toLowerCase().includes(langLower)) {
          score += 25;
        }
      }

      // Snippet indicates cinematic content
      if (/film|directed by|starring|box office|screenplay|cinema/i.test(snippet)) {
        score += 15;
      }

      // Penalty for sequels if user didn't ask for sequel (e.g. user asks "Jailer", candidate is "Jailer 2")
      if (/\b(2|3|4|sequel|part 2)\b/i.test(baseCand) && !/\b(2|3|4|sequel|part 2)\b/i.test(cleanQ)) {
        score -= 35;
      }

      // Heavy penalties for non-film subjects
      if (/soundtrack|discography|album|list of|novel|disambiguation|episodes|characters of/i.test(candTitle)) {
        score -= 60;
      }

      return {
        item,
        score,
        title: candTitle,
        year: candYear,
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    // Pick the best candidate above a reasonable confidence threshold
    const top = scoredCandidates[0];
    if (!top || top.score < 20) {
      return null;
    }

    return top;
  }

  /**
   * Fetch full article details, REST summary, plot, and cast from Wikipedia
   */
  async fetchWikipediaMovieDetails(pageTitle) {
    try {
      // 1. Fetch REST summary for overview, thumbnail, description
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/\s+/g, '_'))}`;
      let summaryData = null;
      try {
        const sumRes = await this._fetchWithTimeout(summaryUrl);
        if (sumRes.ok) {
          summaryData = await sumRes.json();
        }
      } catch (err) {
        console.warn(`[ExternalMovieService] REST summary fetch warning: ${err.message}`);
      }

      // 2. Fetch full plain text extract with sections
      const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json`;
      const extRes = await this._fetchWithTimeout(extractUrl);
      if (!extRes.ok) return null;

      const extJson = await extRes.json();
      const pages = extJson?.query?.pages || {};
      const page = Object.values(pages)[0];
      if (!page || page.missing || !page.extract) {
        return null;
      }

      const fullText = page.extract;

      // 3. Extract Plot section
      // Matches "== Plot ==" or "== Synopsis ==" until the next "== Heading =="
      const plotMatch = fullText.match(/== (?:Plot|Synopsis|Plot summary) ==([\s\S]*?)(?:\n== [^\n=]+ ==|\s*$)/i);
      let plotText = plotMatch ? plotMatch[1].trim() : '';

      // Fallback: If no explicit plot header, use intro paragraphs if substantial
      if (!plotText || plotText.length < 150) {
        const introText = fullText.split('\n==')[0].trim();
        if (introText.length > 200) {
          plotText = introText;
        }
      }

      // 4. Extract Cast section
      const castMatch = fullText.match(/== (?:Cast|Cast and characters|Voice cast) ==([\s\S]*?)(?:\n== [^\n=]+ ==|\s*$)/i);
      const castText = castMatch ? castMatch[1].trim() : '';

      // 5. Verification: Is this genuinely a film with sufficient lore?
      const description = summaryData?.description || '';
      const intro = (fullText.slice(0, 800) || '').toLowerCase();
      const isFilm = /film|movie|directed by|cinema|motion picture/i.test(description) ||
                     /film|movie|directed by|screenplay/i.test(intro);

      if (!isFilm) {
        console.warn(`[ExternalMovieService] Page "${pageTitle}" does not appear to be a film.`);
        return { isVerifiedFilm: false, reason: 'not_a_film' };
      }

      if (!plotText || plotText.length < 150) {
        console.warn(`[ExternalMovieService] Page "${pageTitle}" has insufficient plot canon (${plotText.length} chars).`);
        return { isVerifiedFilm: false, reason: 'insufficient_plot' };
      }

      // 6. Extract release year, director, language from description & intro
      const combinedInfo = `${description} ${summaryData?.extract || ''} ${fullText.slice(0, 1000)}`;
      const year = extractYear(pageTitle) || extractYear(description) || extractYear(fullText.slice(0, 500)) || new Date().getFullYear();

      // Extract director
      let director = 'Unknown Director';
      const dirMatch = combinedInfo.match(/(?:directed by|by director)\s+([A-Z][a-zA-Z\s.-]+?)(?=[,.;\n(]|and produced)/i);
      if (dirMatch && dirMatch[1]) {
        director = dirMatch[1].trim();
      }

      // Extract language
      let language = 'en';
      let languageLabel = 'English';
      if (/tamil/i.test(combinedInfo)) {
        language = 'ta';
        languageLabel = 'Tamil';
      } else if (/telugu/i.test(combinedInfo)) {
        language = 'te';
        languageLabel = 'Telugu';
      } else if (/hindi/i.test(combinedInfo)) {
        language = 'hi';
        languageLabel = 'Hindi';
      } else if (/malayalam/i.test(combinedInfo)) {
        language = 'ml';
        languageLabel = 'Malayalam';
      } else if (/kannada/i.test(combinedInfo)) {
        language = 'kn';
        languageLabel = 'Kannada';
      } else if (/korean/i.test(combinedInfo)) {
        language = 'ko';
        languageLabel = 'Korean';
      } else if (/japanese/i.test(combinedInfo)) {
        language = 'ja';
        languageLabel = 'Japanese';
      } else if (/french/i.test(combinedInfo)) {
        language = 'fr';
        languageLabel = 'French';
      } else if (/spanish/i.test(combinedInfo)) {
        language = 'es';
        languageLabel = 'Spanish';
      }

      // Clean display title
      const cleanTitle = pageTitle
        .replace(/\s*\([^)]*film[^)]*\)\s*/gi, '')
        .replace(/\s*\(\d{4}\)\s*/g, '')
        .trim();

      const posterUrl = summaryData?.thumbnail?.source ||
        summaryData?.originalimage?.source ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

      const overview = summaryData?.extract
        ? summaryData.extract.slice(0, 400)
        : plotText.slice(0, 300) + '...';

      const currentYear = new Date().getFullYear();
      const isUnreleased = /upcoming|scheduled to be released|yet to be released|not yet released|in production|in development|post-production|principal photography|release date tba/i.test(combinedInfo) || (year > currentYear);

      return {
        isVerifiedFilm: true,
        pageTitle,
        title: cleanTitle,
        originalTitle: cleanTitle,
        releaseYear: year,
        isReleased: !isUnreleased,
        releaseStatus: isUnreleased ? 'upcoming' : 'released',
        director,
        language,
        languageLabel,
        overview,
        plotText,
        castText,
        posterUrl,
        source: `Wikipedia (${pageTitle})`,
      };
    } catch (err) {
      console.error(`[ExternalMovieService] Error fetching details for "${pageTitle}":`, err.message);
      return null;
    }
  }

  /**
   * Structure raw retrieved movie lore into standard Movie schema
   */
  async structureMovieLore(rawLore) {
    const { title, releaseYear, director, language, languageLabel, overview, plotText, castText, posterUrl, source } = rawLore;

    // A. If Groq is live, generate structured canon turning points & character roster
    if (groqService.isLive()) {
      try {
        const groqPrompt = `
You are an expert cinematic lore archivist for WHAT IF — The Alternate Movie Universe.
Analyze this verified movie narrative and extract structured movie knowledge:

Movie: "${title}" (${releaseYear}, Language: ${languageLabel}, Director: ${director})
Overview: "${overview}"

VERIFIED PLOT CANON:
${plotText.slice(0, 4500)}

${castText ? `VERIFIED CAST ROSTER:\n${castText.slice(0, 1500)}` : ''}

CRITICAL INSTRUCTIONS:
1. Divide the plot into 3 chronological narrative paragraphs (Act 1 Setup, Act 2 Conflict, Act 3 Climax).
2. Extract 3 to 5 key characters with name, actor, role, summary, relationships, traits.
3. Extract 3 to 5 pivotal CANON TURNING POINTS that can act as divergence triggers.
4. Extract 2 to 4 CANON WORLD RULES that govern this universe.
5. Identify 2 to 4 accurate movie genres.
6. Return valid JSON strictly matching this schema:
{
  "overview": "2-3 sentence engaging overview",
  "plotSummary": "Act 1 narrative paragraph.\\n\\nAct 2 narrative paragraph.\\n\\nAct 3 narrative paragraph.",
  "genres": ["Action", "Thriller"],
  "characters": [
    {
      "name": "Character Name",
      "actor": "Actor Name",
      "role": "Protagonist / Antagonist / Ally",
      "summary": "Specific character motivation and role in plot",
      "relationships": ["Relationship 1", "Relationship 2"],
      "traits": ["Trait 1", "Trait 2"]
    }
  ],
  "canonEvents": [
    {
      "eventId": "evt-1",
      "order": 1,
      "title": "Short descriptive turning point title",
      "description": "What canon event happens at this turning point",
      "significance": "critical",
      "charactersInvolved": ["Character 1", "Character 2"],
      "canBeWhatIfTrigger": true,
      "suggestedWhatIf": "What if [specific hypothetical divergence]?"
    }
  ],
  "worldRules": [
    "Canon world rule or reality of this universe"
  ]
}
`;

        const messages = [
          { role: 'system', content: 'You are a cinematic canon analyst. Respond in valid JSON adhering strictly to the schema.' },
          { role: 'user', content: groqPrompt }
        ];

        const groqResult = await groqService._callGroqJson(messages, 0.4, { retrievedChunksCount: 0 });

        if (groqResult?.data && Array.isArray(groqResult.data.canonEvents) && groqResult.data.canonEvents.length >= 2) {
          const structured = groqResult.data;
          const movieId = generateMovieId(title, releaseYear);

          return {
            movieId,
            title,
            originalTitle: rawLore.originalTitle || title,
            aliases: [title, `${title} (${releaseYear})`],
            releaseYear,
            language,
            languageLabel,
            genres: Array.isArray(structured.genres) && structured.genres.length > 0 ? structured.genres : ['Drama', 'Thriller'],
            director,
            overview: structured.overview || overview,
            plotSummary: structured.plotSummary || plotText,
            posterUrl,
            backdropUrl: posterUrl,
            isReleased: rawLore.isReleased !== undefined ? rawLore.isReleased : (releaseYear <= new Date().getFullYear()),
            releaseStatus: rawLore.releaseStatus || (releaseYear > new Date().getFullYear() ? 'upcoming' : 'released'),
            characters: (structured.characters || []).map((c) => ({
              name: c.name || 'Key Character',
              actor: c.actor || '',
              role: c.role || 'Protagonist',
              summary: c.summary || '',
              relationships: Array.isArray(c.relationships) ? c.relationships : [],
              traits: Array.isArray(c.traits) ? c.traits : [],
            })),
            canonEvents: (structured.canonEvents || []).map((e, idx) => ({
              eventId: `${movieId}-e${idx + 1}`,
              order: idx + 1,
              title: e.title || `Turning Point ${idx + 1}`,
              description: e.description || '',
              significance: e.significance || 'critical',
              charactersInvolved: Array.isArray(e.charactersInvolved) ? e.charactersInvolved : [],
              canBeWhatIfTrigger: true,
              suggestedWhatIf: e.suggestedWhatIf || `What if events unfolded differently at ${e.title}?`,
            })),
            worldRules: Array.isArray(structured.worldRules) && structured.worldRules.length > 0
              ? structured.worldRules
              : [`Events in ${title} operate under strict cinematic continuity.`],
            dataStatus: 'verified',
            sourceAttribution: {
              sources: [source],
              lastVerified: new Date(),
            },
            isFeatured: false,
          };
        }
      } catch (err) {
        console.warn(`[ExternalMovieService] Groq structuring attempt failed, using deterministic fallback: ${err.message}`);
      }
    }

    // B. Deterministic Rule-Based Fallback
    return this._deterministicStructure(rawLore);
  }

  /**
   * Deterministic structuring fallback (no external LLM required)
   */
  _deterministicStructure(rawLore) {
    const { title, releaseYear, director, language, languageLabel, overview, plotText, castText, posterUrl, source } = rawLore;
    const movieId = generateMovieId(title, releaseYear);

    // Split plot paragraphs into 3 acts
    const rawParagraphs = plotText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 40);

    let acts = [];
    if (rawParagraphs.length >= 3) {
      const step = Math.ceil(rawParagraphs.length / 3);
      acts = [
        rawParagraphs.slice(0, step).join(' '),
        rawParagraphs.slice(step, step * 2).join(' '),
        rawParagraphs.slice(step * 2).join(' ')
      ];
    } else if (rawParagraphs.length === 2) {
      acts = [rawParagraphs[0], rawParagraphs[1], `${rawParagraphs[1].slice(-200)}`];
    } else {
      const mid = Math.floor(plotText.length / 3);
      acts = [
        plotText.slice(0, mid).trim(),
        plotText.slice(mid, mid * 2).trim(),
        plotText.slice(mid * 2).trim()
      ];
    }

    const cleanPlotSummary = acts.join('\n\n');

    // Parse characters from castText lines
    const parsedCharacters = [];
    if (castText) {
      const lines = castText.split('\n');
      for (const line of lines) {
        const clean = line.replace(/^[*\s-]+/, '').trim();
        if (!clean) continue;

        // Matches "Actor as Character" or "Character, played by Actor"
        let actor = '';
        let charName = '';

        if (clean.includes(' as ')) {
          const parts = clean.split(' as ');
          actor = parts[0].trim();
          charName = parts[1].split(/[,;(]/)[0].trim();
        } else if (clean.includes(':')) {
          const parts = clean.split(':');
          actor = parts[0].trim();
          charName = parts[1].split(/[,;(]/)[0].trim();
        }

        if (charName && actor) {
          parsedCharacters.push({
            name: charName,
            actor,
            role: parsedCharacters.length === 0 ? 'Protagonist' : (parsedCharacters.length === 1 ? 'Key Ally / Antagonist' : 'Supporting'),
            summary: `${charName}, portrayed by ${actor} in ${title}.`,
            relationships: ['Central cast member'],
            traits: ['Driven by story stakes'],
          });
          if (parsedCharacters.length >= 5) break;
        }
      }
    }

    if (parsedCharacters.length === 0) {
      parsedCharacters.push({
        name: `Protagonist of ${title}`,
        actor: 'Lead Performer',
        role: 'Protagonist',
        summary: `The central character who drives the narrative conflict in ${title}.`,
        relationships: ['Allies and opposing forces'],
        traits: ['Determined', 'Resilient'],
      });
    }

    // Build canon events from acts
    const canonEvents = [
      {
        eventId: `${movieId}-e1`,
        order: 1,
        title: `Act I: Inciting Incident`,
        description: acts[0].slice(0, 260) + '...',
        significance: 'Narrative origin',
        charactersInvolved: [parsedCharacters[0]?.name || 'Protagonist'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: `What if the initial catalyst in Act 1 had failed completely?`,
      },
      {
        eventId: `${movieId}-e2`,
        order: 2,
        title: `Act II: The Critical Climax Turning Point`,
        description: acts[1].slice(0, 260) + '...',
        significance: 'Critical escalation',
        charactersInvolved: [parsedCharacters[0]?.name || 'Protagonist'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: `What if the central confrontation took an opposite turn?`,
      },
      {
        eventId: `${movieId}-e3`,
        order: 3,
        title: `Act III: The Resolution`,
        description: acts[2].slice(0, 260) + '...',
        significance: 'Final reality anchor',
        charactersInvolved: [parsedCharacters[0]?.name || 'Protagonist'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: `What if the ultimate sacrifice or choice was reversed?`,
      },
    ];

    return {
      movieId,
      title,
      originalTitle: rawLore.originalTitle || title,
      aliases: [title, `${title} (${releaseYear})`],
      releaseYear,
      language,
      languageLabel,
      genres: ['Action', 'Drama', 'Thriller'],
      director,
      overview,
      plotSummary: cleanPlotSummary,
      posterUrl,
      backdropUrl: posterUrl,
      isReleased: rawLore.isReleased !== undefined ? rawLore.isReleased : (releaseYear <= new Date().getFullYear()),
      releaseStatus: rawLore.releaseStatus || (releaseYear > new Date().getFullYear() ? 'upcoming' : 'released'),
      characters: parsedCharacters,
      canonEvents,
      worldRules: [
        `Narrative outcomes in ${title} are bound by its original cinematic consequences.`,
        `Key relationships establish the emotional stakes for all alternate timelines.`
      ],
      dataStatus: 'verified',
      sourceAttribution: {
        sources: [source],
        lastVerified: new Date(),
      },
      isFeatured: false,
    };
  }

  /**
   * Main entry point: Search MongoDB first; if missing, retrieve externally, verify, index, and return
   */
  async resolveAndIngestMovie(query, options = {}) {
    const raw = (query || '').trim();
    if (!raw) {
      return {
        success: false,
        message: 'Please provide a movie title to search or verify.',
      };
    }

    const startTime = Date.now();
    const cleanQ = cleanBaseTitle(raw);

    // 1. Check MongoDB for existing movie
    // Try exact movieId, exact title, alias match, or clean title
    let movie = await Movie.findOne({
      $or: [
        { movieId: raw.toLowerCase() },
        { title: { $regex: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { aliases: { $regex: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();

    if (!movie) {
      // Try substring match on existing movies
      const allMovies = await Movie.find({}, 'movieId title aliases releaseYear chunkCount languageLabel').lean();
      for (const m of allMovies) {
        if (cleanBaseTitle(m.title) === cleanQ) {
          movie = m;
          break;
        }
        if (m.aliases && m.aliases.some(a => cleanBaseTitle(a) === cleanQ)) {
          movie = m;
          break;
        }
      }
    }

    if (movie) {
      // Verify chunks exist
      const chunkCount = await MovieChunk.countDocuments({ movieId: movie.movieId });
      if (chunkCount > 0) {
        console.log(`[ExternalMovieService] Reusing existing movie "${movie.title}" (${movie.movieId}) from MongoDB with ${chunkCount} chunks (${Date.now() - startTime}ms)`);
        return {
          success: true,
          movie,
          source: 'database',
          isNew: false,
          chunkCount,
        };
      } else {
        // Re-index existing movie document
        console.log(`[ExternalMovieService] Re-indexing chunks for existing movie "${movie.title}" (${movie.movieId})...`);
        const fullDoc = await Movie.findOne({ movieId: movie.movieId });
        const ingestRes = await ingestionPipeline.ingestMovie(fullDoc.toObject());
        return {
          success: true,
          movie: ingestRes.movie,
          source: 'database_reindexed',
          isNew: false,
          chunkCount: ingestRes.chunksCreated,
        };
      }
    }

    // 2. Movie is not in MongoDB: External Dynamic Retrieval
    console.log(`[ExternalMovieService] Movie "${raw}" not in database. Initiating dynamic external retrieval...`);

    const wikiCandidate = await this.searchWikipedia(raw, options);
    if (!wikiCandidate) {
      console.warn(`[ExternalMovieService] Could not locate verified article for "${raw}".`);
      return {
        success: false,
        reason: 'not_found',
        message: `Could not find verified movie information for "${raw}". Please verify the title spelling, specify a release year (e.g. "${raw} 2023"), or select a supported movie.`,
      };
    }

    console.log(`[ExternalMovieService] Found Wikipedia candidate: "${wikiCandidate.title}" (Score: ${wikiCandidate.score})`);

    const details = await this.fetchWikipediaMovieDetails(wikiCandidate.title);
    if (!details || !details.isVerifiedFilm) {
      return {
        success: false,
        reason: details?.reason || 'unverified_film',
        message: `Sufficient verified canon lore could not be extracted for "${raw}". The title may refer to a non-film subject or lack sufficient plot documentation.`,
      };
    }

    console.log(`[ExternalMovieService] Verified movie lore retrieved: "${details.title}" (${details.releaseYear} • ${details.languageLabel}). Structuring lore...`);

    // 3. Structure into Movie document
    const structuredMovie = await this.structureMovieLore(details);

    // 4. Ingest and create vector index in MongoDB
    console.log(`[ExternalMovieService] Ingesting "${structuredMovie.title}" (${structuredMovie.movieId}) into MongoDB vector store...`);
    const ingestResult = await ingestionPipeline.ingestMovie(structuredMovie);

    console.log(`[ExternalMovieService] Ingestion complete: "${ingestResult.movie.title}" with ${ingestResult.chunksCreated} chunks in ${Date.now() - startTime}ms`);

    return {
      success: true,
      movie: ingestResult.movie,
      source: 'external_verified',
      isNew: true,
      chunkCount: ingestResult.chunksCreated,
    };
  }
}

export const externalMovieService = new ExternalMovieService();
