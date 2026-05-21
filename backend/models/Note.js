/**
 * Nexus AI — Note Model
 * 
 * MongoDB schema definitions for the Notes module, including field level constraints
 * and user ownership mappings.
 */

import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [100, 'Note title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: [30, 'Category cannot exceed 30 characters'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must belong to an authenticated user'],
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model('Note', noteSchema);

export default Note;
