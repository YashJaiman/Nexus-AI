/**
 * Nexus AI — User Schema & Entity Model
 * 
 * Production-ready User model containing validation constraints,
 * pre-save encryption middleware, and authentication helpers.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [50, 'Full name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents password from being returned in standard JSON payloads
    },
    avatar: {
      type: String,
      default: '#00d4ff', // Default neon cyan
    },
    bio: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      default: 'Developer',
    },
    preferences: {
      theme: {
        type: String,
        default: 'dark',
      },
      notifications: {
        email: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        ai: { type: Boolean, default: true },
      },
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

/**
 * Pre-save Mongoose Hook: Auto-hashes password before committing to the DB
 */
userSchema.pre('save', async function (next) {
  // Only encrypt password if it was recently modified or created
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Custom Model Method: Compares raw login passwords against stored hashes
 * @param {string} enteredPassword - Password submitted in login request
 * @returns {Promise<boolean>} True if match matches
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
