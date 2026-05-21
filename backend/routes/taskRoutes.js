/**
 * Nexus AI — Task Endpoints Routing
 * ─────────────────────────────────────────────────────────────
 * Wires Task CRUD handlers to private express endpoints, enforcing
 * JWT bearer auth guards on all entry points.
 */

import express from 'express';
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply route protection middleware globally to all task endpoints
router.use(protect);

router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

export default router;
