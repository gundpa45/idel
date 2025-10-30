const express = require("express");
const router = express.Router();
const SavedBook = require("../models/SavedBook");
const { protect } = require("../middleware/authMiddleware");

// Get all saved books for a user
router.get("/", protect, async (req, res) => {
  try {
    const savedBooks = await SavedBook.find({ userId: req.user.id }).sort({
      savedAt: -1,
    }); // Most recently saved first

    res.json({
      success: true,
      data: savedBooks,
    });
  } catch (error) {
    console.error("Error fetching saved books:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved books",
    });
  }
});

// Save a book
router.post("/save", protect, async (req, res) => {
  try {
    const { bookId, bookTitle, bookAuthor, bookYear, bookStar, bookImage } =
      req.body;

    // Check if book is already saved
    const existingSavedBook = await SavedBook.findOne({
      userId: req.user.id,
      bookId: bookId,
    });

    if (existingSavedBook) {
      return res.status(400).json({
        success: false,
        message: "Book is already saved",
      });
    }

    // Create new saved book
    const savedBook = new SavedBook({
      userId: req.user.id,
      bookId,
      bookTitle,
      bookAuthor,
      bookYear,
      bookStar,
      bookImage,
    });

    await savedBook.save();

    res.status(201).json({
      success: true,
      message: "Book saved successfully",
      data: savedBook,
    });
  } catch (error) {
    console.error("Error saving book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save book",
    });
  }
});

// Remove a saved book
router.delete("/remove/:bookId", protect, async (req, res) => {
  try {
    const { bookId } = req.params;

    const deletedBook = await SavedBook.findOneAndDelete({
      userId: req.user.id,
      bookId: bookId,
    });

    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: "Saved book not found",
      });
    }

    res.json({
      success: true,
      message: "Book removed from saved list",
    });
  } catch (error) {
    console.error("Error removing saved book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove saved book",
    });
  }
});

// Check if a book is saved
router.get("/check/:bookId", protect, async (req, res) => {
  try {
    const { bookId } = req.params;

    const savedBook = await SavedBook.findOne({
      userId: req.user.id,
      bookId: bookId,
    });

    res.json({
      success: true,
      isSaved: !!savedBook,
    });
  } catch (error) {
    console.error("Error checking saved book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check saved book",
    });
  }
});

module.exports = router;
