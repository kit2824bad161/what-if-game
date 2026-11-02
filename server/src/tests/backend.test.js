import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { embeddingService } from '../services/embeddings/embeddingService.js';
import { detectAndSanitizeLeaks, buildMovieBlocklist } from '../utils/leakDetector.js';
import { isCorrectGuess } from '../utils/fuzzyMatch.js';
import { continuityChecker } from '../services/continuity/continuityChecker.js';
import { roomManager } from '../sockets/roomManager.js';
import { connectDB } from '../config/db.js';

describe('WHAT IF Backend Test Suite', () => {

  it('Embedding Service generates 128-dim normalized vectors and computes cosine similarity', async () => {
    const textA = 'Agent Vikram launches a covert assault on Sandhanam drug syndicate';
    const textB = 'Agent Vikram fights Sandhanam in a violent warehouse showdown';
    const textC = 'Shivudu climbs the giant waterfalls in ancient Mahishmati';

    const vecA = await embeddingService.generateEmbedding(textA);
    const vecB = await embeddingService.generateEmbedding(textB);
    const vecC = await embeddingService.generateEmbedding(textC);

    assert.equal(vecA.length, 128, 'Vector dimension must be 128');
    assert.equal(vecB.length, 128, 'Vector dimension must be 128');

    const simAB = embeddingService.computeCosineSimilarity(vecA, vecB);
    const simAC = embeddingService.computeCosineSimilarity(vecA, vecC);

    assert.ok(simAB > simAC, `Related Vikram texts (${simAB.toFixed(3)}) should have higher similarity than unrelated Mahishmati text (${simAC.toFixed(3)})`);
  });

  it('Leak Detector detects and sanitizes movie titles, character names, and actors', () => {
    const mockMovie = {
      title: 'Vikram',
      originalTitle: 'விக்ரம்',
      aliases: ['Vikram: Hitlist'],
      characters: [
        { name: 'Karnan', actor: 'Kamal Haasan' },
        { name: 'Amar', actor: 'Fahadh Faasil' },
        { name: 'Santhanam', actor: 'Vijay Sethupathi' }
      ],
      director: 'Lokesh Kanagaraj'
    };

    const blocklist = buildMovieBlocklist(mockMovie);
    assert.ok(blocklist.includes('vikram'), 'Blocklist should contain title');
    assert.ok(blocklist.includes('santhanam'), 'Blocklist should contain character name');

    const leakyText = 'In this alternate universe, Agent Vikram confronts Santhanam and Amar joins the fight.';
    const leakCheck = detectAndSanitizeLeaks(leakyText, blocklist);

    assert.equal(leakCheck.hasLeak, true, 'Should detect leakage');
    assert.ok(leakCheck.leakedTerms.length >= 2, 'Should detect multiple terms');
    assert.ok(!leakCheck.sanitizedText.includes('Vikram'), 'Should redact Vikram');
    assert.ok(!leakCheck.sanitizedText.includes('Santhanam'), 'Should redact Santhanam');
  });

  it('Fuzzy Matcher correctly validates player guesses with typos and case differences', () => {
    const targetMovie = {
      title: 'Baahubali: The Beginning',
      originalTitle: 'பாகுபலி: தொடக்கம்',
      aliases: ['Baahubali 1', 'Baahubali: Part 1']
    };

    assert.equal(isCorrectGuess('Baahubali', targetMovie), true, 'Exact substring/alias');
    assert.equal(isCorrectGuess('baahubali 1', targetMovie), true, 'Case insensitive alias');
    assert.equal(isCorrectGuess('Bahubali', targetMovie), true, 'Typo tolerant');
    assert.equal(isCorrectGuess('The Dark Knight', targetMovie), false, 'Wrong movie must fail');
  });

  it('Continuity Checker detects deceased character anomalies', () => {
    const priorTurns = [
      {
        turnNumber: 1,
        characterStatusUpdates: [{ character: 'Inspector Amar', status: 'Killed in action' }]
      }
    ];

    const result = continuityChecker.evaluateContinuity({
      movie: { worldRules: [] },
      retrievedCanonChunks: [],
      priorTimelineTurns: priorTurns,
      proposedText: 'Suddenly, Inspector Amar attacked the convoy and gave tactical orders to the team.',
      changedEvent: 'Surprise counter-attack'
    });

    assert.equal(result.hasWarnings, true, 'Should flag deceased character actions');
    assert.equal(result.warnings[0].type, 'deceased_character_anomaly');
  });

  it('Room Manager creates rooms with unique codes, handles joins and max capacity', async () => {
    const room = await roomManager.createRoom({
      hostId: 'host-123',
      hostName: 'Captain',
      socketId: 'sock-1',
      mode: 'movieGuess'
    });

    assert.equal(room.roomCode.length, 6, 'Room code must be 6 chars');
    assert.equal(room.players.length, 1, 'Room should have 1 player initially');

    // Player 2 joins
    const joined = await roomManager.joinRoom({
      roomCode: room.roomCode,
      playerId: 'player-456',
      playerName: 'Challenger',
      socketId: 'sock-2'
    });

    assert.equal(joined.players.length, 2, 'Room should now have 2 players');

    // Player 3 joins (must fail)
    await assert.rejects(
      async () => {
        await roomManager.joinRoom({
          roomCode: room.roomCode,
          playerId: 'player-789',
          playerName: 'ThirdWheel',
          socketId: 'sock-3'
        });
      },
      /already full/
    );
  });

  it('Readability Validator verifies simple English and rejects difficult words and leaks', async () => {
    const { validateStoryQuality } = await import('../utils/readabilityValidator.js');
    
    // 1. Simple college-level story passes validation
    const goodStory = 'An ordinary young man flies into a major city for a personal trip, but he is suddenly grabbed by a corrupt police officer. The officer forces him to take a rifle and shoot a top political leader at a crowded rally to start widespread riots. When the young man refuses and gets killed, he suddenly wakes up alive on the exact same flight landing on the runway. He soon discovers that he is trapped in a repeating time loop, and the crooked officer can remember every loop too.';
    const goodClues = [
      'Main Character: An ordinary man who resets back to an airplane seat whenever he dies.',
      'Key Conflict: He must outsmart a corrupt police officer who also remembers the time loop.',
      'Plot Goal: Stop an assassination at a giant political rally and break the endless cycle.'
    ];

    const goodResult = validateStoryQuality(goodStory, goodClues, ['maanadu', 'abdul khaliq', 'dhanushkodi']);
    assert.equal(goodResult.isValid, true, 'Simple English story should pass validation');
    assert.equal(goodResult.issues.length, 0, 'No issues reported');
    assert.ok(goodResult.diagnostics.avgSentenceLength < 28, 'Sentence length is clean');

    // 2. Story with difficult/stilted vocabulary is flagged
    const difficultStory = 'Following an unforeseen sequence of catastrophic events, the protagonist discovers that his allegiance to the institution has become morally indefensible due to nefarious clandestine machinations.';
    const badResult = validateStoryQuality(difficultStory, goodClues, ['secret movie']);
    assert.equal(badResult.isValid, false, 'Difficult vocabulary must be flagged');
    assert.ok(badResult.issues.some(i => i.includes('difficult vocabulary')), 'Reports difficult vocabulary');

    // 3. Story with leaked secret title is detected
    const leakyStory = 'In this movie Maanadu, the hero tries to save the day from corrupt enemies in Coimbatore.';
    const leakResult = validateStoryQuality(leakyStory, goodClues, ['maanadu']);
    assert.equal(leakResult.isValid, false, 'Leaked title must be flagged');
    assert.ok(leakResult.issues.some(i => i.includes('spoiler terms')), 'Reports spoiler leakage');
  });

  it('Movie Lookup utility correctly resolves titles, aliases, and rejects unsupported movies', async () => {
    await connectDB();
    const { findMovieByTitleOrId } = await import('../utils/movieLookup.js');

    // Exact title
    const res1 = await findMovieByTitleOrId('Vikram');
    assert.equal(res1.success, true);
    assert.equal(res1.movie.movieId, 'vikram-2022');

    // Alias / lowercase
    const res2 = await findMovieByTitleOrId('maanadu');
    assert.equal(res2.success, true);
    assert.equal(res2.movie.movieId, 'maanadu-2021');

    // Substring / fuzzy
    const res3 = await findMovieByTitleOrId('Kaithi');
    assert.equal(res3.success, true);
    assert.equal(res3.movie.movieId, 'kaithi-2019');

    // Unsupported movie
    const res4 = await findMovieByTitleOrId('Avengers Endgame');
    assert.equal(res4.success, false);
    assert.ok(res4.message.includes('not yet in our database'));
    assert.ok(res4.supportedMovies.length >= 10);
  });

  after(async () => {
    await mongoose.disconnect();
  });
});

