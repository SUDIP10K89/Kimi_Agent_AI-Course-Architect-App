/**
 * Course Controller
 * 
 * Handles HTTP requests for course-related operations.
 * Acts as intermediary between routes and services.
 */

import * as courseService from '../services/courseService.js';
import Course from '../models/Course.js';

/**
 * Generate a new course
 * POST /api/courses/generate
 */
export const generateCourse = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const user = req.user;
    console.log("Tgis is user",user)
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and must be a non-empty string',
      });
    }

    const trimmedTopic = topic.trim();

    // Check if course already exists for this topic for this user
    const existingCourse = await Course.findOne({
      topic: { $regex: new RegExp(`^${trimmedTopic}$`, 'i') },
      isArchived: false,
      createdBy: user._id,
    });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        error: 'You already have a course for this topic',
        data: { courseId: existingCourse._id },
      });
    }

    const course = await courseService.generateCourse(trimmedTopic, user._id);

    res.status(201).json({
      success: true,
      message: 'Course generation started',
      data: {
        courseId: course._id,
        title: course.title,
        description: course.description,
        modulesCount: course.modules.length,
        microTopicsCount: course.progress.totalMicroTopics,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all courses
 * GET /api/courses
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const query = { isArchived: false, createdBy: user._id };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status) {
      if (status === 'not-started') {
        query['progress.percentage'] = 0;
      } else if (status === 'in-progress') {
        query['progress.percentage'] = { $gt: 0, $lt: 100 };
      } else if (status === 'completed') {
        query['progress.percentage'] = 100;
      }
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title description topic difficulty progress metadata createdAt'),
      Course.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get recent courses
 * GET /api/courses/recent
 */
export const getRecentCourses = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const limit = parseInt(req.query.limit) || 5;

    const courses = await Course.find({ createdBy: user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: { courses },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single course by ID
 * GET /api/courses/:id
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const result = await courseService.getCourseWithStatus(id);
    // createdBy may be populated object or ObjectId; compare string values
    const ownerId = result.course.createdBy?._id || result.course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }
    next(error);
  }
};

/**
 * Get course generation status
 * GET /api/courses/:id/status
 */
export const getCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await courseService.getCourseWithStatus(id);

    res.json({
      success: true,
      data: {
        courseId: id,
        generationStatus: result.generationStatus,
        progress: result.course.progress,
      },
    });

  } catch (error) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }
    next(error);
  }
};

/**
 * Generate content for a specific micro-topic
 * POST /api/courses/:id/modules/:moduleId/topics/:topicId/generate
 */
export const generateMicroTopicContent = async (req, res, next) => {
  try {
    const { id, moduleId, topicId } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) throw new Error('Course not found');
    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const microTopic = await courseService.generateMicroTopicContent(id, moduleId, topicId);

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: { microTopic },
    });

  } catch (error) {
    if (error.message === 'Course not found' ||
      error.message === 'Module not found' ||
      error.message === 'Micro-topic not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Mark micro-topic as complete
 * POST /api/courses/:id/modules/:moduleId/topics/:topicId/complete
 */
export const completeMicroTopic = async (req, res, next) => {
  try {
    const { id, moduleId, topicId } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) throw new Error('Course not found');
    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const updatedCourse = await courseService.completeMicroTopic(id, moduleId, topicId);

    res.json({
      success: true,
      message: 'Micro-topic marked as complete',
      data: {
        progress: updatedCourse.progress,
      },
    });

  } catch (error) {
    if (error.message === 'Course not found' ||
      error.message === 'Module not found' ||
      error.message === 'Micro-topic not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Undo micro-topic completion (mark as incomplete)
 * DELETE /api/courses/:id/modules/:moduleId/topics/:topicId/complete
 */
export const uncompleteMicroTopic = async (req, res, next) => {
  try {
    const { id, moduleId, topicId } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) throw new Error('Course not found');
    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const updatedCourse = await courseService.uncompleteMicroTopic(id, moduleId, topicId);

    res.json({
      success: true,
      message: 'Micro-topic marked as incomplete',
      data: {
        progress: updatedCourse.progress,
      },
    });

  } catch (error) {
    if (error.message === 'Course not found' ||
      error.message === 'Module not found' ||
      error.message === 'Micro-topic not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Regenerate a module
 * POST /api/courses/:id/modules/:moduleId/regenerate
 */
export const regenerateModule = async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) throw new Error('Course not found');
    const ownerId2 = course.createdBy?._id || course.createdBy;
    if (String(ownerId2) !== String(user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const module = await courseService.regenerateModule(id, moduleId);

    res.json({
      success: true,
      message: 'Module regeneration started',
      data: { module },
    });

  } catch (error) {
    if (error.message === 'Course not found' || error.message === 'Module not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Continue/Resume content generation for a course
 * POST /api/courses/:id/continue
 */
export const continueCourseGeneration = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Start content generation in background
    const result = await courseService.continueCourseContent(courseId);

    res.json({
      success: true,
      message: result.message,
      data: {
        courseId,
        processedItems: result.processedItems,
        totalItems: result.totalItems,
      },
    });

  } catch (error) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Delete a course
 * DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    const ownerId3 = course.createdBy?._id || course.createdBy;
    if (String(ownerId3) !== String(user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const deleted = await courseService.deleteCourse(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Archive a course
 * POST /api/courses/:id/archive
 */
export const archiveCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) throw new Error('Course not found');
    const ownerId3 = course.createdBy?._id || course.createdBy;
    if (String(ownerId3) !== String(user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const updated = await courseService.archiveCourse(id);

    res.json({
      success: true,
      message: 'Course archived successfully',
      data: { course: updated },
    });

  } catch (error) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }
    next(error);
  }
};

/**
 * Export course
 * GET /api/courses/:id/export
 */
export const exportCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authorized' });

    const course = await Course.findById(id);
    if (!course) throw new Error('Course not found');
    const ownerId4 = course.createdBy?._id || course.createdBy;
    if (String(ownerId4) !== String(user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const courseData = await courseService.exportCourse(id);

    if (format === 'json') {
      res.json({
        success: true,
        data: courseData,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported export format',
      });
    }

  } catch (error) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }
    next(error);
  }
};

/**
 * Get course statistics
 * GET /api/courses/stats/overview
 */
export const getCourseStats = async (req, res, next) => {
  try {
    const stats = await Course.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          totalModules: { $sum: { $size: '$modules' } },
          totalMicroTopics: { $sum: '$progress.totalMicroTopics' },
          completedMicroTopics: { $sum: '$progress.completedMicroTopics' },
          avgProgress: { $avg: '$progress.percentage' },
        },
      },
    ]);

    const recentCourses = await Course.getRecent(5);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCourses: 0,
          totalModules: 0,
          totalMicroTopics: 0,
          completedMicroTopics: 0,
          avgProgress: 0,
        },
        recentCourses,
      },
    });

  } catch (error) {
    next(error);
  }
};
