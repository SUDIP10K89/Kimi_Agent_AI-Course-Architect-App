/**
 * Request Validation Middleware
 * 
 * Validates incoming request data using express-validator.
 * Ensures data integrity before processing.
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors,
    });
  }
  
  next();
};

/**
 * Validation rules for course generation
 */
export const validateGenerateCourse = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Topic must be between 2 and 200 characters')
    .escape(),
  handleValidationErrors,
];

/**
 * Validation rules for course ID parameter
 */
export const validateCourseId = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  handleValidationErrors,
];

/**
 * Validation rules for module operations
 */
export const validateModuleParams = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid module ID format'),
  handleValidationErrors,
];

/**
 * Validation rules for micro-topic operations
 */
export const validateMicroTopicParams = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid module ID format'),
  param('topicId')
    .notEmpty()
    .withMessage('Micro-topic ID is required')
    .isMongoId()
    .withMessage('Invalid micro-topic ID format'),
  handleValidationErrors,
];

/**
 * Validation rules for pagination queries
 */
export const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateGenerateCourse,
  validateCourseId,
  validateModuleParams,
  validateMicroTopicParams,
  validatePagination,
};
