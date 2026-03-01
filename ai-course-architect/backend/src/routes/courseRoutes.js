/**
 * Course Routes
 * 
 * Defines all API endpoints for course-related operations.
 * Routes are mapped to controller functions.
 */

import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/courses/generate
 * @desc    Generate a new course from topic
 * @access  Public
 */
router.post('/generate', protect, courseController.generateCourse);

/**
 * @route   GET /api/courses
 * @desc    Get all courses with pagination and filters
 * @access  Public
 */
router.get('/', protect, courseController.getAllCourses);

/**
 * @route   GET /api/courses/stats/overview
 * @desc    Get course statistics
 * @access  Public
 */
router.get('/stats/overview', protect, courseController.getCourseStats);

/**
 * @route   GET /api/courses/recent
 * @desc    Get recent courses
 * @access  Public
 */
router.get('/recent', protect, courseController.getRecentCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course by ID
 * @access  Public
 */
router.get('/:id', protect, courseController.getCourseById);

/**
 * @route   GET /api/courses/:id/status
 * @desc    Get course generation status
 * @access  Public
 */
router.get('/:id/status', protect, courseController.getCourseStatus);

/**
 * @route   POST /api/courses/:id/continue
 * @desc    Continue/Resume content generation for a course
 * @access  Public
 */
router.post('/:id/continue', protect, courseController.continueCourseGeneration);

/**
 * @route   POST /api/courses/:id/modules/:moduleId/topics/:topicId/generate
 * @desc    Generate content for a specific micro-topic
 * @access  Public
 */
router.post('/:id/modules/:moduleId/topics/:topicId/generate', protect, courseController.generateMicroTopicContent);

/**
 * @route   POST /api/courses/:id/modules/:moduleId/topics/:topicId/complete
 * @desc    Mark micro-topic as complete
 * @access  Public
 */
router.post('/:id/modules/:moduleId/topics/:topicId/complete', protect, courseController.completeMicroTopic);

/**
 * @route   DELETE /api/courses/:id/modules/:moduleId/topics/:topicId/complete
 * @desc    Undo micro-topic completion (mark as incomplete)
 * @access  Public
 */
router.delete('/:id/modules/:moduleId/topics/:topicId/complete', protect, courseController.uncompleteMicroTopic);

/**
 * @route   POST /api/courses/:id/modules/:moduleId/regenerate
 * @desc    Regenerate a module
 * @access  Public
 */
router.post('/:id/modules/:moduleId/regenerate', protect, courseController.regenerateModule);

/**
 * @route   POST /api/courses/:id/archive
 * @desc    Archive a course
 * @access  Public
 */
router.post('/:id/archive', protect, courseController.archiveCourse);

/**
 * @route   GET /api/courses/:id/export
 * @desc    Export course data
 * @access  Public
 */
router.get('/:id/export', protect, courseController.exportCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course
 * @access  Public
 */
router.delete('/:id', protect, courseController.deleteCourse);

export default router;
