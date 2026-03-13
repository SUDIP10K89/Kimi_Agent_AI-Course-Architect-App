import jwt from 'jsonwebtoken';

import { JWT_CONFIG } from '../../config/env.js';
import User from '../users/user.model.js';

const signToken = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email },
  JWT_CONFIG.SECRET,
  { expiresIn: JWT_CONFIG.EXPIRES_IN }
);

export const signupUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already in use');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password });
  return {
    user: user.toJSON(),
    token: signToken(user),
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
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

export default {
  loginUser,
  signupUser,
};
