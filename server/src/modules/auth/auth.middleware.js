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

  console.log('[AUTH DEBUG] Headers:', req.headers.authorization ? 'Bearer token present' : 'No bearer');
  
  // Check Authorization header first
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('[AUTH DEBUG] Token extracted from header:', token.substring(0, 20) + '...');
  }
  
  // Also check query parameter for SSE connections
  if (!token && req.query.token) {
    token = req.query.token;
    console.log('[AUTH DEBUG] Token extracted from query');
  }
  
  if (!token) {
    console.log('[AUTH DEBUG] No token provided');
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }

  try {
    console.log('[AUTH DEBUG] Verifying token with secret:', JWT_CONFIG.SECRET ? 'secret present' : 'NO SECRET!');
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
    console.log('[AUTH DEBUG] Token decoded successfully, user id:', decoded.id);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('[AUTH DEBUG] User not found for id:', decoded.id);
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH DEBUG] Token verification failed:', err.name, err.message);
    
    // Handle specific JWT errors with more descriptive messages
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }
    
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
};
