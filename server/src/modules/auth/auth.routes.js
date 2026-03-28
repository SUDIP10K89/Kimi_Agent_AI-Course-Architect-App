/**
 * Authentication Routes
 *
 * Signup, login, email verification, and Google OAuth endpoints.
 */

import express from 'express';
import * as authController from './auth.controller.js';
import {
  loginValidation,
  signupValidation,
  forgotPasswordValidation,
  verifyResetOtpValidation,
  resetPasswordValidation,
  resendResetOtpValidation,
} from './auth.validators.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization endpoints
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post(
  '/signup',
  validateRequest(signupValidation),
  authController.signup
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateRequest(loginValidation),
  authController.login
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/verify-email',
  authController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email resent
 *       404:
 *         description: User not found
 */
router.post(
  '/resend-verification',
  authController.resendVerification
);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth authentication
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenId
 *             properties:
 *               tokenId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google authentication successful
 *       401:
 *         description: Invalid Google token
 */
router.post(
  '/google',
  authController.googleAuth
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset OTP
 *     tags: [Auth]
 */
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordValidation),
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Auth]
 */
router.post(
  '/verify-reset-otp',
  validateRequest(verifyResetOtpValidation),
  authController.verifyResetOtp
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 */
router.post(
  '/reset-password',
  validateRequest(resetPasswordValidation),
  authController.resetPassword
);

/**
 * @swagger
 * /auth/resend-reset-otp:
 *   post:
 *     summary: Resend password reset OTP
 *     tags: [Auth]
 */
router.post(
  '/resend-reset-otp',
  validateRequest(resendResetOtpValidation),
  authController.resendResetOtp
);

export default router;
