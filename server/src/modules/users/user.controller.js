/**
 * User Controller
 *
 * Handles user settings including API configuration.
 */

import * as userService from './user.service.js';

export const getSettings = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const apiSettings = await userService.getUserSettings(user._id);
    res.json({
      success: true,
      data: { apiSettings },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const user = req.user;
    const { apiSettings } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const settings = await userService.updateUserSettings(user._id, apiSettings);
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { apiSettings: settings },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    next(error);
  }
};

export const testSettings = async (req, res, next) => {
  try {
    const user = req.user;
    const { apiKey, model, baseUrl } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    try {
      const result = await userService.testUserSettings({ apiKey, model, baseUrl });
      res.json({
        success: true,
        message: 'API connection successful',
        data: result,
      });
    } catch (apiError) {
      return res.status(400).json({
        success: false,
        error: apiError.message || 'Failed to connect to API',
      });
    }
  } catch (error) {
    next(error);
  }
};
