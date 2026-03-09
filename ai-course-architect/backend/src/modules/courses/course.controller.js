/**
 * Course Controller
 *
 * Handles HTTP requests for course-related operations.
 * Acts as intermediary between routes and services.
 */

import { logError, logInfo } from '../../shared/utils/logger.js';
import * as generationService from '../generation/generation.service.js';
import Course from './course.model.js';
import * as courseService from './course.service.js';

export const generateCourse = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const user = req.user;

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

    const course = await generationService.generateCourse(trimmedTopic, user._id);

    logInfo('Course generation requested', {
      courseId: String(course._id),
      userId: String(user._id),
      topic: trimmedTopic,
    });

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

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

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

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('title description topic difficulty progress metadata createdAt'),
      Course.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentCourses = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const limit = parseInt(req.query.limit, 10) || 5;

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

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const result = await courseService.getCourseWithStatus(id);
    try {
      courseService.ensureCourseOwnership(result.course, user._id);
    } catch {
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

export const getCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await courseService.getCourseWithStatus(id);
    try {
      courseService.ensureCourseOwnership(result.course, user._id);
    } catch {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({
      success: true,
      data: {
        courseId: id,
        generationStatus: result.generationStatus,
        progress: result.course.progress,
      },
    });
  } catch (error) {
    logError('Failed to get course status', { courseId: req.params.id, error: error.message });
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }
    next(error);
  }
};

export const generateMicroTopicContent = async (req, res, next) => {
  try {
    const { id, moduleId, topicId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const microTopic = await generationService.generateMicroTopicContent(id, moduleId, topicId);

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: { microTopic },
    });
  } catch (error) {
    if (
      error.message === 'Course not found' ||
      error.message === 'Module not found' ||
      error.message === 'Micro-topic not found'
    ) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const completeMicroTopic = async (req, res, next) => {
  try {
    const { id, moduleId, topicId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updatedCourse = await courseService.completeMicroTopic(id, moduleId, topicId);

    res.json({
      success: true,
      message: 'Micro-topic marked as complete',
      data: {
        progress: updatedCourse.progress,
      },
    });
  } catch (error) {
    if (
      error.message === 'Course not found' ||
      error.message === 'Module not found' ||
      error.message === 'Micro-topic not found'
    ) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const uncompleteMicroTopic = async (req, res, next) => {
  try {
    const { id, moduleId, topicId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updatedCourse = await courseService.uncompleteMicroTopic(id, moduleId, topicId);

    res.json({
      success: true,
      message: 'Micro-topic marked as incomplete',
      data: {
        progress: updatedCourse.progress,
      },
    });
  } catch (error) {
    if (
      error.message === 'Course not found' ||
      error.message === 'Module not found' ||
      error.message === 'Micro-topic not found'
    ) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const regenerateModule = async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const module = await generationService.regenerateModule(id, moduleId);

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

    generationService.continueCourseContent(courseId).catch((error) => {
      logError('Background continue generation failed', { courseId, error: error.message });
    });

    res.json({
      success: true,
      message: 'Content generation resumed',
      data: {
        courseId,
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

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

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

export const archiveCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

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

export const exportCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const course = await Course.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const courseData = await courseService.exportCourse(id);

    if (format === 'json') {
      return res.json({
        success: true,
        data: courseData,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Unsupported export format',
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

export const getCourseStats = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const stats = await Course.aggregate([
      { $match: { createdBy: user._id, isArchived: false } },
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

    const recentCourses = await Course.getRecent(user._id, 5);

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
