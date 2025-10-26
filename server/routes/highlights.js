const express = require('express');
const router = express.Router();
const Highlight = require('../models/Highlight');
const { protect } = require('../middleware/authMiddleware'); // ✨ IMPORT the middleware

// GET highlights for a book for the LOGGED-IN user
// ✨ ADDED the 'protect' middleware here
router.get('/:bookId', protect, async (req, res) => {
  try {
    // 🔄 CHANGED: Add a filter for the logged-in user's ID
    const highlights = await Highlight.find({
      bookId: req.params.bookId,
      user: req.user.id, // This ensures users only get their own highlights
    });
    res.json(highlights);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch highlights', error: error.message });
  }
});

// POST add highlight for the LOGGED-IN user
// ✨ ADDED the 'protect' middleware here
router.post('/', protect, async (req, res) => {
  try {
    // 🔄 REMOVED userId from req.body. It's now sourced securely from the token.
    const { bookId, text, position } = req.body;

    const highlight = new Highlight({
      bookId,
      text,
      position,
      user: req.user.id, // 🔒 Use the user ID from the authenticated token
    });

    await highlight.save();
    res.status(201).json(highlight);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save highlight', error: error.message });
  }
});

module.exports = router;