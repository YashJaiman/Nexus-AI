/**
 * Nexus AI — Note Endpoints Controllers
 * 
 * Logic controls for user notes management. Implements CRUD operations,
 * ownership validation, and robust error captures.
 */

import Note from '../models/Note.js';

/**
 * @desc    Get all notes for current user
 * @route   GET /api/notes
 * @access  Private
 */
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error('[Note Controller] getNotes exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Private
 */
export const createNote = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Note title is required',
      });
    }

    const note = await Note.create({
      title: title.trim(),
      content: content || '',
      category: category ? category.trim() : 'General',
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    console.error('[Note Controller] createNote exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Update a note by ID
 * @route   PUT /api/notes/:id
 * @access  Private
 */
export const updateNote = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const noteId = req.params.id;

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id: ${noteId}`,
      });
    }

    // Enforce ownership check
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Authorization failed: You do not own this note',
      });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category.trim();

    await note.save();

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note,
    });
  } catch (error) {
    console.error('[Note Controller] updateNote exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

/**
 * @desc    Delete a note by ID
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
export const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id: ${noteId}`,
      });
    }

    // Enforce ownership check
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Authorization failed: You do not own this note',
      });
    }

    await note.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('[Note Controller] deleteNote exception:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
