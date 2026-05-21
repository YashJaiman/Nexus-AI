/**
 * Nexus AI — Task Entity Controllers
 * ─────────────────────────────────────────────────────────────
 * Implements CRUD controls on user tasks. Enforces rigorous ownership
 * checks to guarantee users can only query, update, or delete their own data.
 */

import Task from '../models/Task.js';

/**
 * @desc    Create a new task belonging to the active user
 * @route   POST /api/tasks
 * @access  Private (Requires JWT Guard)
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Task title is required',
      });
    }

    // Build the task payload with user reference from JWT middleware (req.user)
    const task = await Task.create({
      title: title.trim(),
      description: (description || '').trim(),
      priority: priority || 'medium',
      category: category || 'work',
      dueDate: dueDate || null,
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('[Task Controller] createTask exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Fetch all tasks belonging to the active user
 * @route   GET /api/tasks
 * @access  Private (Requires JWT Guard)
 */
export const getTasks = async (req, res) => {
  try {
    // Sort tasks so the newest or uncompleted ones appear first
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('[Task Controller] getTasks exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Update a task (title, details, priority, completed, etc.)
 * @route   PUT /api/tasks/:id
 * @access  Private (Requires JWT Guard)
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Enforce Ownership validation guard
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own this task',
      });
    }

    const { title, description, priority, category, completed, dueDate } = req.body;

    // Apply updates dynamically
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (completed !== undefined) task.completed = completed;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('[Task Controller] updateTask exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Delete a specific task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Requires JWT Guard)
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Enforce Ownership validation guard
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own this task',
      });
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      id,
    });
  } catch (error) {
    console.error('[Task Controller] deleteTask exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
