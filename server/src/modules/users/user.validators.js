import { body } from 'express-validator';

export const updateSettingsValidation = [
  body('apiSettings').isObject().withMessage('Invalid settings format'),
  body('apiSettings.model').optional({ nullable: true }).isString().withMessage('Model must be a string'),
  body('apiSettings.baseUrl').optional({ nullable: true }).isString().withMessage('Base URL must be a string'),
  body('apiSettings.apiKey').optional({ nullable: true }).isString().withMessage('API key must be a string'),
  body('apiSettings.useCustomProvider').optional().isBoolean().withMessage('useCustomProvider must be a boolean'),
];

export const testSettingsValidation = [
  body('apiKey').notEmpty().withMessage('Missing required fields: apiKey, model, baseUrl'),
  body('model').notEmpty().withMessage('Missing required fields: apiKey, model, baseUrl'),
  body('baseUrl').notEmpty().withMessage('Missing required fields: apiKey, model, baseUrl'),
];

export default {
  testSettingsValidation,
  updateSettingsValidation,
};
