/**
 * Nexus AI — Authentication Endpoints Routing
 * 
 * Maps public API endpoints (Signup, Login) and JWT-protected endpoints (me)
 * to their respective controller functions.
 */

import express from 'express';
import { signup, login, getMe, updateProfile, updatePassword, logoutAllSessions } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public auth endpoints
router.post('/signup', signup);
router.post('/login', login);

// Private auth endpoints (protected by JWT validation guards)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout-all', protect, logoutAllSessions);

export default router;
