/**
 * Nexus AI — Authentication Endpoints Controllers
 * 
 * Logic controls for User registration validations, JWT token generation,
 * credential match checking, and profile retrieval.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Helper: Signs secure JSON Web Token
 * @param {string} id - The Mongoose User unique ObjectId
 * @param {number} tokenVersion - Token version for session management
 * @returns {string} The signed JWT
 */
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new User accounts
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Basic Parameter presence checks
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please supply fullName, email, and password fields',
      });
    }

    // 2. Email format validation regex
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please enter a valid email address format',
      });
    }

    // 3. Password length limits
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Password must be at least 6 characters long',
      });
    }

    // 4. Scans for existing email registration
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Conflict error: This email address is already registered',
      });
    }

    // 5. Build and save new user (auto-pre-save hashes password)
    const user = await User.create({
      fullName,
      email,
      password,
    });

    // 6. Generate signed token
    const token = generateToken(user._id, user.tokenVersion || 0);

    // 7. Success payload feedback
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Controller] Signup exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Authenticate User credentials & return tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic field presence checks
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please supply email and password fields',
      });
    }

    // 2. Query User from DB - explicitly include password hash
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid email or password credentials',
      });
    }

    // 3. Match passwords against decrypting hash method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid email or password credentials',
      });
    }

    // 4. Generate signed token
    const token = generateToken(user._id, user.tokenVersion || 0);

    // 5. Return success payloads
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Controller] Login exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Fetch authenticated profile details
 * @route   GET /api/auth/me
 * @access  Private (Requires JWT)
 */
export const getMe = async (req, res) => {
  try {
    // req.user has already been populated with database values by protect middleware
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        avatar: req.user.avatar,
        bio: req.user.bio,
        role: req.user.role,
        preferences: req.user.preferences,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Controller] getMe profile exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Update user profile & preferences
 * @route   PUT /api/auth/profile
 * @access  Private (Requires JWT)
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { fullName, bio, role, avatar, preferences } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (role !== undefined) user.role = role;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences !== undefined) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
        notifications: {
          ...user.preferences?.notifications,
          ...preferences.notifications
        }
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('[Auth Controller] updateProfile exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private (Requires JWT)
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide currentPassword and newPassword fields',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Explicitly query password since it is selected false by default
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Verification failed: Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Auth Controller] updatePassword exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Revoke all sessions (Logout all sessions)
 * @route   POST /api/auth/logout-all
 * @access  Private (Requires JWT)
 */
export const logoutAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Logged out of all sessions successfully. All existing tokens are now invalidated.',
    });
  } catch (error) {
    console.error('[Auth Controller] logoutAllSessions exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
