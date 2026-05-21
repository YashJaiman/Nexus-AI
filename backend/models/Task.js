/**
 * Nexus AI — Task Schema & Model
 * ─────────────────────────────────────────────────────────────
 * Defines task database documents, validation rules, priority/category
 * limits, and user ownership relationship references.
 */

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [80, 'Task title cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Task description cannot exceed 300 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },
    category: {
      type: String,
      enum: {
        values: ['work', 'ai', 'personal', 'projects'],
        message: 'Category must be work, ai, personal, or projects',
      },
      default: 'work',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a registered user'],
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
