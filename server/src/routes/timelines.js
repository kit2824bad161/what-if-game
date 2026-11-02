import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StoryTimeline } from '../models/StoryTimeline.js';
import { Movie } from '../models/Movie.js';

const router = Router();

/**
 * GET /api/timelines
 * Query: guestId
 */
router.get('/', async (req, res, next) => {
  try {
    const { guestId } = req.query;
    if (!guestId) {
      return res.status(400).json({ success: false, message: 'guestId is required to list saved timelines.' });
    }

    const timelines = await StoryTimeline.find({ guestId, isSaved: true })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: timelines });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/timelines
 * Create or save a timeline
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      guestId,
      movieId,
      customTitle,
      initialScenario,
      initialBranches = [],
      activeBranchId = '',
      turns = [],
      currentSummary = '',
      isSaved = true,
      mode = 'solo',
    } = req.body;

    if (!guestId || !movieId || !initialScenario) {
      return res.status(400).json({
        success: false,
        message: 'guestId, movieId, and initialScenario are required to save a timeline.',
      });
    }

    const movie = await Movie.findOne({ movieId }).lean();
    const movieTitle = movie?.title || 'Unknown Film';
    const posterUrl = movie?.posterUrl || '';

    const timelineId = `tl_${uuidv4().slice(0, 10)}`;

    const newTimeline = new StoryTimeline({
      timelineId,
      guestId,
      movieId,
      movieTitle,
      posterUrl,
      customTitle: customTitle || `${movieTitle}: What If Timeline`,
      initialScenario,
      initialBranches,
      activeBranchId,
      turns,
      currentSummary,
      isSaved,
      mode,
    });

    await newTimeline.save();

    res.status(201).json({
      success: true,
      data: newTimeline,
      message: 'Alternate universe timeline saved to MongoDB successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/timelines/:timelineId
 */
router.get('/:timelineId', async (req, res, next) => {
  try {
    const timeline = await StoryTimeline.findOne({ timelineId: req.params.timelineId }).lean();
    if (!timeline) {
      return res.status(404).json({ success: false, message: `Timeline ${req.params.timelineId} not found.` });
    }
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/timelines/:timelineId
 * Rename or update timeline
 */
router.put('/:timelineId', async (req, res, next) => {
  try {
    const { customTitle, isSaved, activeBranchId } = req.body;
    const timeline = await StoryTimeline.findOne({ timelineId: req.params.timelineId });

    if (!timeline) {
      return res.status(404).json({ success: false, message: 'Timeline not found.' });
    }

    if (customTitle !== undefined) timeline.customTitle = customTitle.trim();
    if (isSaved !== undefined) timeline.isSaved = isSaved;
    if (activeBranchId !== undefined) timeline.activeBranchId = activeBranchId;

    await timeline.save();

    res.json({ success: true, data: timeline, message: 'Timeline updated successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/timelines/:timelineId/turn
 * Append turn to timeline
 */
router.post('/:timelineId/turn', async (req, res, next) => {
  try {
    const { turn } = req.body;
    if (!turn || !turn.userPrompt || !turn.narrativeText) {
      return res.status(400).json({ success: false, message: 'Valid turn data is required.' });
    }

    const timeline = await StoryTimeline.findOne({ timelineId: req.params.timelineId });
    if (!timeline) {
      return res.status(404).json({ success: false, message: 'Timeline not found.' });
    }

    timeline.turns.push({
      ...turn,
      turnNumber: timeline.turns.length + 1,
      createdAt: new Date(),
    });

    timeline.currentSummary = turn.narrativeText.slice(0, 300);
    await timeline.save();

    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/timelines/:timelineId
 */
router.delete('/:timelineId', async (req, res, next) => {
  try {
    const result = await StoryTimeline.deleteOne({ timelineId: req.params.timelineId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Timeline not found.' });
    }
    res.json({ success: true, message: 'Timeline deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
