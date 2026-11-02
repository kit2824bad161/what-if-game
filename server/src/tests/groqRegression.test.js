import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';
import { config, getIntegrationStatus } from '../config/env.js';
import { groqService, GroqService } from '../services/groq/groqService.js';
import { ragService } from '../services/rag/ragService.js';
import { Movie } from '../models/Movie.js';
import { connectDB } from '../config/db.js';

describe('Live Groq API & What-If RAG Regression Suite', () => {

  after(async () => {
    await mongoose.disconnect();
  });

  it('Verifies Groq configuration is valid and live without exposing key', () => {
    const status = getIntegrationStatus();
    assert.equal(status.groq.configured, true, 'Groq API key must be configured in environment');
    assert.equal(status.groq.mode, 'live_api', 'Integration mode must be live_api');
    assert.ok(status.groq.model, 'Model name must be defined');
    assert.ok(!JSON.stringify(status).includes(config.groq.apiKey), 'Status must never expose API key value');
  });

  it('Retrieves movie chunks from MongoDB and constructs grounded RAG context', async () => {
    await connectDB();
    const movie = await Movie.findOne({ movieId: 'vikram-2022' }).lean();
    assert.ok(movie, 'Seed movie Vikram must exist in MongoDB');

    const query = 'What if Amar arrested Vikram at the clinic?';
    const result = await ragService.retrieveContext({
      movieId: movie.movieId,
      query,
      topK: 6,
    });

    assert.ok(result.chunks.length > 0, 'Must retrieve verified chunks');
    assert.ok(result.formattedContext.includes('CANON FACT'), 'Formatted context must contain grounded facts');
    assert.ok(result.diagnostics.topScore > 0, 'Diagnostics must include positive similarity score');
  });

  it('Executes live Groq request and returns verified alternate branches', async () => {
    await connectDB();
    const movie = await Movie.findOne({ movieId: 'vikram-2022' }).lean();
    const whatIfQuestion = 'What if Amar joined Vikram before the warehouse raid?';

    const retrievedContext = await ragService.retrieveContext({
      movieId: movie.movieId,
      query: whatIfQuestion,
      topK: 6,
    });

    const result = await groqService.generateAlternateBranches({
      movie,
      whatIfQuestion,
      retrievedContext,
    });

    assert.equal(result.engine, 'groq-live', 'Result engine must be groq-live');
    assert.ok(Array.isArray(result.branches) && result.branches.length >= 2, 'Must generate at least 2 branches');

    const branchAlpha = result.branches[0];
    const branchBeta = result.branches[1];

    assert.ok(branchAlpha.title && branchAlpha.title.length > 3, 'Branch Alpha must have a cinematic title');
    assert.ok(branchBeta.title && branchBeta.title.length > 3, 'Branch Beta must have a cinematic title');
    assert.ok(branchAlpha.summary && branchAlpha.summary.length > 20, 'Branch Alpha must have narrative summary');
    assert.ok(Array.isArray(branchAlpha.immediateConsequences), 'Branch Alpha must have immediate consequences');
    assert.ok(Array.isArray(branchAlpha.characterConsequences), 'Branch Alpha must have character consequences');
    assert.ok(Array.isArray(branchAlpha.plotConsequences), 'Branch Alpha must have plot consequences');
    assert.ok(Array.isArray(branchAlpha.canonFactsUsed), 'Branch Alpha must reference canon facts');
    assert.ok(Array.isArray(branchAlpha.hypotheticalEvents), 'Branch Alpha must list hypothetical events');
  });

  it('Throws clear error on failed live request and NEVER silently fakes simulated success', async () => {
    // Instantiate test service with an explicitly invalid client to test live failure handling
    const failingService = new GroqService();
    failingService.client = new Groq({ apiKey: 'gsk_invalid_test_key_for_regression_testing' });
    failingService.hasKey = true;
    failingService.fallbackModels = [];

    const mockMovie = {
      title: 'Vikram',
      releaseYear: 2022,
      languageLabel: 'Tamil',
      plotSummary: 'Summary of the film',
      characters: [{ name: 'Vikram' }, { name: 'Amar' }],
    };

    const mockRetrievedContext = {
      chunks: [{ text: 'Sample canon fact' }],
      formattedContext: '[CANON FACT #1]\nSample canon fact',
    };

    await assert.rejects(
      async () => {
        await failingService.generateAlternateBranches({
          movie: mockMovie,
          whatIfQuestion: 'What if Amar betrayed the team?',
          retrievedContext: mockRetrievedContext,
        });
      },
      (err) => {
        assert.ok(err.message.includes('Live Groq API request failed'), 'Must reject with descriptive live failure message');
        return true;
      },
      'Should throw live error instead of silently returning simulated branches'
    );
  });

  it('Safe operational logger never leaks secrets or keys', () => {
    let capturedLog = '';
    const originalInfo = console.info;
    console.info = (msg, meta) => {
      capturedLog += msg + ' ' + (meta ? JSON.stringify(meta) : '');
    };

    try {
      groqService._logSafe('info', 'Test log message', {
        model: 'openai/gpt-oss-120b',
        durationMs: 120,
        httpStatus: 200,
        retrievedChunksCount: 4,
      });

      assert.ok(capturedLog.includes('apiKeyConfigured'), 'Must include boolean apiKeyConfigured');
      assert.ok(!capturedLog.includes(config.groq.apiKey), 'Must never leak raw API key');
    } finally {
      console.info = originalInfo;
    }
  });

  it('Generates exact movie story with 3 acts, reality check, and character fates in simple English', async () => {
    await connectDB();
    const movie = await Movie.findOne({ movieId: 'vikram-2022' }).lean();
    assert.ok(movie, 'Movie Vikram must exist');

    const whatIfQuestion = 'What if Karnan was captured alive instead of faking his execution?';
    const retrievedContext = await ragService.retrieveContext({
      movieId: movie.movieId,
      query: `${whatIfQuestion} ${movie.title}`,
      topK: 6,
    });

    const result = await groqService.generateExactStory({
      movie,
      whatIfQuestion,
      retrievedContext,
    });

    assert.ok(result.story, 'Must return story object');
    assert.ok(result.story.quickSummary && result.story.quickSummary.length > 20, 'Must have quick summary in simple words');
    assert.ok(result.story.canonRealityCheck?.whatActuallyHappened, 'Must include reality check explaining what actually happened');
    assert.ok(Array.isArray(result.story.acts) && result.story.acts.length >= 3, 'Must have at least 3 acts');
    assert.ok(Array.isArray(result.story.characterFates) && result.story.characterFates.length > 0, 'Must have character fates');

    // Simple English verification: ensure acts don't contain banned complex words
    const bannedJargon = ['machinations', 'clandestine', 'tactical realignment', 'ideological fractures', 'catastrophic collateral damage'];
    const fullText = JSON.stringify(result.story).toLowerCase();
    for (const word of bannedJargon) {
      assert.ok(!fullText.includes(word), `Story should avoid banned robotic jargon: "${word}"`);
    }
  });

  it('Simulated fallback generator produces simple, human-understandable English', () => {
    const mockMovie = {
      title: 'Vikram',
      releaseYear: 2022,
      languageLabel: 'Tamil',
      plotSummary: 'Vikram is an ex-operative who takes down a drug syndicate to protect his grandson.',
      characters: [
        { name: 'Vikram', summary: 'Defeats the syndicate and moves abroad.' },
        { name: 'Amar', summary: 'Leaves the police and joins the fight.' },
        { name: 'Santhanam', summary: 'Killed in the final battle.' }
      ],
      canonEvents: [
        { title: 'The Execution', description: 'Karnan fakes his death with a double.' },
        { title: 'The Investigation', description: 'Amar uncovers Karnan is alive.' },
        { title: 'The Climax', description: 'Vikram destroys the drug syndicate.' }
      ]
    };

    const mockContext = {
      chunks: [{ text: 'Vikram fakes his death to operate undercover.' }],
    };

    const fallbackResult = groqService._generateSimulatedExactStory(
      mockMovie,
      'What if Karnan was captured alive?',
      null,
      mockContext
    );

    assert.ok(fallbackResult.story.quickSummary, 'Fallback must have quick summary');
    assert.ok(fallbackResult.story.acts.length === 3, 'Fallback must have 3 acts');
    assert.ok(fallbackResult.story.canonRealityCheck.whatActuallyHappened.includes('did NOT happen') || fallbackResult.story.canonRealityCheck.whatActuallyHappened.includes('Karnan fakes his death'), 'Fallback reality check must be clear');

    const branchesResult = groqService._generateSimulatedBranches(
      mockMovie,
      'What if Karnan was captured alive?',
      null,
      mockContext
    );

    assert.equal(branchesResult.branches.length, 2, 'Fallback branches must have 2 branches');
    const branchesText = JSON.stringify(branchesResult.branches).toLowerCase();
    assert.ok(!branchesText.includes('clandestine intelligence'), 'Fallback branches must not have "clandestine intelligence"');
    assert.ok(!branchesText.includes('tactical realignment'), 'Fallback branches must not have "tactical realignment"');
  });

  it('Rejects exact story generation for unreleased movies and flags isUnreleased with clear alert', async () => {
    const unreleasedMovie = {
      title: 'Coolie',
      releaseYear: 2027,
      isReleased: false,
      releaseStatus: 'upcoming',
      overview: 'Coolie is an upcoming Indian Tamil-language action thriller film.',
      plotSummary: 'The plot details are kept under wraps. Principal photography began in 2024.',
      characters: [{ name: 'Deva' }],
    };

    const mockContext = { chunks: [{ text: 'Teaser shows gold watch and industrial shipyard.' }] };

    const result = await groqService.generateExactStory({
      movie: unreleasedMovie,
      whatIfQuestion: 'What if Deva loses the fight?',
      retrievedContext: mockContext,
    });

    assert.equal(result.isUnreleased, true, 'Must flag unreleased movie as isUnreleased');
    assert.equal(result.story, null, 'Must NOT generate fake canon story for unreleased movie');
    assert.ok(result.message.includes('not been released yet'), 'Must provide clear human alert explaining movie is not yet released');
  });

});
