const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: String,
    default: 'Unknown Author',
    trim: true
  },
  coverImage: {
    type: String,
    default: null
  },
  link: {
    type: String,
    required: [true, 'Book link is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Business', 'Self-Help', 'Biography', 'History', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['to-read', 'reading', 'completed'],
    default: 'to-read'
  },
  currentPage: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: null
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: '',
    maxlength: [2000, 'Review cannot exceed 2000 characters']
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastReadAt: {
    type: Date,
    default: null
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for faster queries
BookSchema.index({ userId: 1, status: 1 });
BookSchema.index({ userId: 1, createdAt: -1 });

// Virtual for reading progress
BookSchema.virtual('progress').get(function() {
  if (!this.totalPages || this.totalPages === 0) return 0;
  return Math.round((this.currentPage / this.totalPages) * 100);
});

// Method to update reading progress
BookSchema.methods.updateProgress = async function(currentPage) {
  this.currentPage = currentPage;
  this.lastReadAt = new Date();
  
  // Auto-complete if reached last page
  if (this.totalPages && currentPage >= this.totalPages) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  await this.save();
};

module.exports = mongoose.model('Book', BookSchema);