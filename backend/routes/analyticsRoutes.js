/**
 * Nexus AI — Analytics & Dashboard Stats Endpoints Routing
 * 
 * Maps analytics query requests to their controllers with JWT auth security guards.
 */

import express from 'express';
import { getAnalytics, getDashboardStats } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware across all analytics endpoints
router.use(protect);

router.get('/', getAnalytics);
router.get('/dashboard-stats', getDashboardStats);

export default router;
