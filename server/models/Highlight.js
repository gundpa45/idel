const mongoose = require('mongoose');

const HighlightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  text: {
    type: String,
    required: [true, 'Highlight text is required'],
    trim: true,
    maxlength: [5000, 'Highlight text cannot exceed 5000 characters']
  },
  bookTitle: {
    type: String,
    default: 'Unknown Book',
    trim: true
  },
  bookLink: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    enum: ['yellow', 'green', 'blue', 'pink', 'purple'],
    default: 'yellow'
  },
  note: {
    type: String,
    default: '',
    maxlength: [1000, 'Note cannot exceed 1000 characters']
  },
  pageNumber: {
    type: Number,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFavorite: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for faster queries
HighlightSchema.index({ userId: 1, createdAt: -1 });
HighlightSchema.index({ userId: 1, bookTitle: 1 });

// Virtual for highlight length
HighlightSchema.virtual('textLength').get(function() {
  return this.text.length;
});

module.exports = mongoose.model('Highlight', HighlightSchema);