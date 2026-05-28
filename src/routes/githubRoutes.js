import { Router } from 'express';
import githubController from '../controllers/githubController.js';
import { validateUsername, validateQueryFilters } from '../middleware/validationMiddleware.js';

const router = Router();

/**
 * @route   GET /api/github/analyze/:username
 * @desc    Fetch GitHub user data, analyze developer insights, and save/update in MySQL
 * @access  Public
 */
router.get('/analyze/:username', validateUsername, githubController.analyzeProfile);

/**
 * @route   GET /api/github/profiles
 * @desc    Get all stored profile analysis with pagination, sorting, and filtering
 * @access  Public
 */
router.get('/profiles', validateQueryFilters, githubController.getAllProfiles);

/**
 * @route   GET /api/github/profiles/:username
 * @desc    Get single stored profile analysis and repositories by username
 * @access  Public
 */
router.get('/profiles/:username', validateUsername, githubController.getSingleProfile);

/**
 * @route   DELETE /api/github/profiles/:username
 * @desc    Delete single stored profile analysis and repositories
 * @access  Public
 */
router.delete('/profiles/:username', validateUsername, githubController.deleteProfile);

export default router;
