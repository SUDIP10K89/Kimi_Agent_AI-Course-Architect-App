/**
 * User Routes
 * 
 * Defines API endpoints for user settings.
 */

import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/users/settings
 * @desc    Get current user's settings
 * @access  Private
 */
router.get('/settings', protect, userController.getSettings);

/**
 * @route   PUT /api/users/settings
 * @desc    Update current user's settings
 * @access  Private
 */
router.put('/settings', protect, userController.updateSettings);

/**
 * @route   POST /api/users/settings/test
 * @desc    Test API settings by making a test API call
 * @access  Private
 */
router.post('/settings/test', protect, userController.testSettings);

export default router;
