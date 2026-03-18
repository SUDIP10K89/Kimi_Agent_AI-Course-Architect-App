/**
 * Course Routes
 *
 * Defines all API endpoints for course-related operations.
 * Routes are mapped to controller functions.
 */

import express from 'express';
import * as courseController from './course.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management and generation endpoints
 */

/**
 * @swagger
 * /courses/generate:
 *   post:
 *     summary: Generate a new course from a topic
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       201:
 *         description: Course generation started successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/generate', protect, courseController.generateCourse);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses with pagination
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of courses
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, courseController.getAllCourses);

/**
 * @swagger
 * /courses/stats/overview:
 *   get:
 *     summary: Get course statistics
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course statistics overview
 *       401:
 *         description: Unauthorized
 */
router.get('/stats/overview', protect, courseController.getCourseStats);

/**
 * @swagger
 * /courses/recent:
 *   get:
 *     summary: Get recent courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent courses
 *       401:
 *         description: Unauthorized
 */
router.get('/recent', protect, courseController.getRecentCourses);

/**
 * @swagger
 * /courses/public:
 *   get:
 *     summary: Get public courses with search
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of public courses
 */
router.get('/public', courseController.getPublicCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get single course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', protect, courseController.getCourseById);

/**
 * @swagger
 * /courses/{id}/status:
 *   get:
 *     summary: Get course generation status
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course generation status
 *       404:
 *         description: Course not found
 */
router.get('/:id/status', protect, courseController.getCourseStatus);

/**
 * @swagger
 * /courses/{id}/continue:
 *   post:
 *     summary: Continue/Resume course generation
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Generation resumed
 *       404:
 *         description: Course not found
 */
router.post('/:id/continue', protect, courseController.continueCourseGeneration);

/**
 * @swagger
 * /courses/{id}/modules/{moduleId}/topics/{topicId}/generate:
 *   post:
 *     summary: Generate content for a micro-topic
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content generated
 *       404:
 *         description: Resource not found
 */
router.post('/:id/modules/:moduleId/topics/:topicId/generate', protect, courseController.generateMicroTopicContent);

/**
 * @swagger
 * /courses/{id}/modules/{moduleId}/topics/{topicId}/complete:
 *   post:
 *     summary: Mark micro-topic as complete
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topic marked as complete
 */
router.post('/:id/modules/:moduleId/topics/:topicId/complete', protect, courseController.completeMicroTopic);

/**
 * @swagger
 * /courses/{id}/modules/{moduleId}/topics/{topicId}/complete:
 *   delete:
 *     summary: Mark micro-topic as incomplete
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topic marked as incomplete
 */
router.delete('/:id/modules/:moduleId/topics/:topicId/complete', protect, courseController.uncompleteMicroTopic);

/**
 * @swagger
 * /courses/{id}/modules/{moduleId}/regenerate:
 *   post:
 *     summary: Regenerate a module
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module regeneration started
 */
router.post('/:id/modules/:moduleId/regenerate', protect, courseController.regenerateModule);

/**
 * @swagger
 * /courses/{id}/archive:
 *   post:
 *     summary: Archive a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course archived
 */
router.post('/:id/archive', protect, courseController.archiveCourse);

/**
 * @swagger
 * /courses/{id}/export:
 *   get:
 *     summary: Export course data
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course data exported
 */
router.get('/:id/export', protect, courseController.exportCourse);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted
 *       404:
 *         description: Course not found
 */
router.delete('/:id', protect, courseController.deleteCourse);

/**
 * @swagger
 * /courses/{id}/visibility:
 *   patch:
 *     summary: Update course visibility
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibility updated
 */
router.patch('/:id/visibility', protect, courseController.updateCourseVisibility);

/**
 * @swagger
 * /courses/{id}/fork:
 *   post:
 *     summary: Fork a public course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Course forked successfully
 */
router.post('/:id/fork', protect, courseController.forkCourse);

export default router;
