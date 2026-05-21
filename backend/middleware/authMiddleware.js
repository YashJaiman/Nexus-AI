/**
 * Nexus AI — Authentication Authorization Middleware
 * 
 * Intercepts Bearer tokens inside incoming request headers, decodes the claims,
 * validates database states, and passes validated user contexts to controllers.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Route protection middleware to secure backend API routes
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in standard Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from 'Bearer <token>' pattern
      token = req.headers.authorization.split(' ')[1];

      // 2. Decode and verify token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Query User in database, exclude password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authorization failed: User belonging to this token no longer exists',
        });
      }

      // Invalidate session if tokenVersion mismatch occurs
      if (decoded.tokenVersion !== undefined && req.user.tokenVersion !== undefined) {
        if (decoded.tokenVersion !== req.user.tokenVersion) {
          return res.status(401).json({
            success: false,
            message: 'Authorization failed: Session invalidated (logged out of all sessions)',
          });
        }
      }

      // Authorization success, pass execution to controller
      return next();
    } catch (error) {
      console.warn(`[Auth Guard] Token verification exception:`, error.message);
      return res.status(401).json({
        success: false,
        message: 'Authorization failed: Invalid token or expired session',
      });
    }
  }

  // 4. Fallback if no token is provided in the headers
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization failed: No access token supplied in headers',
    });
  }
};
