const mongoose = require("mongoose");

const savedBookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: String,
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    bookAuthor: {
      type: String,
      required: true,
    },
    bookYear: {
      type: String,
    },
    bookStar: {
      type: String,
    },
    bookImage: {
      type: String,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can't save the same book twice
savedBookSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model("SavedBook", savedBookSchema);
