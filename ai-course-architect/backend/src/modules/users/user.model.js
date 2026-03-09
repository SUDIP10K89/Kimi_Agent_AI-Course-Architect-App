/**
 * User Model
 *
 * Stores registered user credentials and profile information.
 * Passwords are hashed before save.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { decryptSecret, encryptSecret } from '../../shared/utils/secrets.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // do not return password by default
    },
    // User's custom API settings for AI providers
    apiSettings: {
      apiKey: {
        type: String,
        select: false, // don't return API key by default for security
        set: (value) => encryptSecret(value),
      },
      model: {
        type: String,
        default: 'gemini-2.5-flash',
      },
      baseUrl: {
        type: String,
        default: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      },
      // Flag to indicate if user wants to use their own API key
      useCustomProvider: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  // if either value is missing, bail out (bcrypt throws otherwise)
  if (!candidatePassword || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getDecryptedApiKey = function () {
  return decryptSecret(this.apiSettings?.apiKey);
};

// when converting to JSON remove password field
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
