/**
 * Authentication Routes
 *
 * Signup and login endpoints.
 */

import express from 'express';
import * as authController from './auth.controller.js';
import { loginValidation, signupValidation } from './auth.validators.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';

const router = express.Router();

router.post(
  '/signup',
  validateRequest(signupValidation),
  authController.signup
);

router.post(
  '/login',
  validateRequest(loginValidation),
  authController.login
);

export default router;
