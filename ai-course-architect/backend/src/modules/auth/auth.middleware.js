/**
 * Authentication Middleware
 *
 * Protects routes by verifying JWT tokens and attaching the user to req.
 */

import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import { JWT_CONFIG } from '../../config/env.js';

export const protect = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Also check query parameter for SSE connections
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
};
