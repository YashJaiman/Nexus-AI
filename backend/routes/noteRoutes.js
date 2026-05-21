/**
 * Nexus AI — Notes Endpoints Routing
 * 
 * Maps notes resources to their controllers with JWT auth security guards.
 */

import express from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware across all note endpoints
router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .put(updateNote)
  .delete(deleteNote);

export default router;
