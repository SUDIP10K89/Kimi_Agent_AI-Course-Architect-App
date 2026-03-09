/**
 * Authentication Controller
 *
 * Handles signup and login HTTP requests.
 */

import * as authService from './auth.service.js';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const result = await authService.signupUser({ name, email, password });
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Missing email or password' });
    }

    const result = await authService.loginUser({ email, password });
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    next(error);
  }
};
