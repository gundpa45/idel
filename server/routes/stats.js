const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Highlight = require('../models/Highlight');
const User = require('../models/User');

// Simple stats endpoint
router.get('/', async (req, res) => {
  try {
    const [users, books, highlights] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Highlight.countDocuments(),
    ]);

    res.json({
      users,
      books,
      highlights,
      message: 'Stats fetched successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

module.exports = router;
