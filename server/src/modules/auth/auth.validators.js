import { body } from 'express-validator';

export const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password cannot be empty'),
];

export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email required'),
];

export const verifyResetOtpValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const resendResetOtpValidation = [
  body('email').isEmail().withMessage('Valid email required'),
];

export default {
  loginValidation,
  signupValidation,
  forgotPasswordValidation,
  verifyResetOtpValidation,
  resetPasswordValidation,
  resendResetOtpValidation,
};
