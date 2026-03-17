import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import { JWT_CONFIG } from '../../config/env.js';
import User from '../users/user.model.js';
import * as emailService from './email.service.js';

const googleOAuthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const signToken = (user) => {
  console.log('[AUTH DEBUG] Signing token for user:', user.email);
  console.log('[AUTH DEBUG] JWT config - secret:', JWT_CONFIG.SECRET ? 'present' : 'MISSING', 'expiresIn:', JWT_CONFIG.EXPIRES_IN);
  
  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    JWT_CONFIG.SECRET,
    { expiresIn: JWT_CONFIG.EXPIRES_IN }
  );
  console.log('[AUTH DEBUG] Token signed, length:', token.length);
  return token;
};

const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signupUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already in use');
    error.statusCode = 400;
    throw error;
  }

  // Generate OTP for email verification
  const otp = generateOTP();
  const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  const user = await User.create({
    name,
    email,
    password,
    isVerified: false,
    otp,
    otpExpires,
  });

  // Send verification email with OTP
  try {
    await emailService.sendVerificationEmail(email, otp, name);
  } catch (err) {
    console.error('Failed to send verification email:', err);
    // Continue anyway - don't block signup
  }

  return {
    user: user.toJSON(),
    requiresVerification: true,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Check if email is verified
  if (!user.isVerified) {
    const error = new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    error.statusCode = 401;
    error.needsVerification = true;
    error.email = email;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  return {
    user: user.toJSON(),
    token: signToken(user),
  };
};

export const verifyEmail = async (email, otp) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    return { message: 'Email already verified' };
  }

  // Check if OTP matches and is not expired
  if (user.otp !== otp || user.otpExpires < Date.now()) {
    const error = new Error('Invalid or expired OTP');
    error.statusCode = 400;
    throw error;
  }

  user.isVerified = true;
  user.verifiedAt = new Date();
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.name);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  return {
    user: user.toJSON(),
    token: signToken(user),
  };
};

export const resendVerification = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists
    return { message: 'If an account exists with this email, a verification OTP has been sent.' };
  }

  if (user.isVerified) {
    return { message: 'This account is already verified. You can log in.' };
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  try {
    await emailService.sendVerificationEmail(email, otp, user.name);
  } catch (err) {
    console.error('Failed to send verification email:', err);
    throw new Error('Failed to send verification email. Please try again.');
  }

  return { message: 'Verification OTP sent. Check your inbox.' };
};

export const googleLogin = async (idToken) => {
  try {
    // Verify the Google ID token
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, log them in
      return {
        user: user.toJSON(),
        token: signToken(user),
      };
    }

    // Check if user exists with this email
    user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      // If not verified yet, verify since Google auth verifies email
      if (!user.isVerified) {
        user.isVerified = true;
        user.verifiedAt = new Date();
      }
      await user.save();

      return {
        user: user.toJSON(),
        token: signToken(user),
      };
    }

    // Create new user with Google
    user = await User.create({
      name: name || 'Google User',
      email: email.toLowerCase(),
      password: crypto.randomBytes(16).toString('hex'), // Random password (not used for Google login)
      googleId,
      isVerified: true, // Google verifies email
      verifiedAt: new Date(),
    });

    return {
      user: user.toJSON(),
      token: signToken(user),
    };
  } catch (error) {
    console.error('Google login error:', error);
    throw new Error('Failed to authenticate with Google');
  }
};

export default {
  loginUser,
  signupUser,
  verifyEmail,
  resendVerification,
  googleLogin,
};
