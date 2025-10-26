const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookapp';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ==================== MODELS ====================

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Highlight Model
const highlightSchema = new mongoose.Schema({
  text: { type: String, required: true },
  bookId: { type: String, required: true, index: true },
  bookTitle: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  color: { type: String, default: '#fef9c3' },
  page: { type: Number },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient querying
highlightSchema.index({ userId: 1, bookId: 1 });

const Highlight = mongoose.model('Highlight', highlightSchema);

// Book Stats Model
const bookStatsSchema = new mongoose.Schema({
  bookId: { type: String, required: true, index: true },
  bookTitle: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  currentPage: { type: Number, default: 0 },
  totalPages: { type: Number },
  progress: { type: Number, default: 0 },
  lastReadAt: { type: Date, default: Date.now },
  highlightsCount: { type: Number, default: 0 },
  notesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Unique constraint: one stats record per user per book
bookStatsSchema.index({ userId: 1, bookId: 1 }, { unique: true });

const BookStats = mongoose.model('BookStats', bookStatsSchema);

// ==================== MIDDLEWARE ====================

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== HIGHLIGHTS ROUTES ====================

// Get all highlights for a user and book
app.get('/api/highlights', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (bookId) {
      query.bookId = bookId;
    }

    const highlights = await Highlight.find(query)
      .sort({ createdAt: -1 });

    res.json(highlights);
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

// Create a new highlight
app.post('/api/highlights', authenticateToken, async (req, res) => {
  try {
    const { text, bookId, bookTitle, color, page, note } = req.body;
    const userId = req.user.id;

    // Validation
    if (!text || !bookId || !bookTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const highlight = new Highlight({
      text,
      bookId,
      bookTitle,
      userId,
      color: color || '#fef9c3',
      page,
      note
    });

    await highlight.save();

    // Update book stats highlight count
    await BookStats.findOneAndUpdate(
      { userId, bookId },
      { 
        $inc: { highlightsCount: 1 },
        $set: { lastReadAt: new Date(), updatedAt: new Date() }
      },
      { upsert: true }
    );

    res.status(201).json(highlight);
  } catch (error) {
    console.error('Create highlight error:', error);
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

// Update a highlight
app.put('/api/highlights/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, color, note } = req.body;
    const userId = req.user.id;

    const highlight = await Highlight.findOneAndUpdate(
      { _id: id, userId },
      { text, color, note, updatedAt: new Date() },
      { new: true }
    );

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    res.json(highlight);
  } catch (error) {
    console.error('Update highlight error:', error);
    res.status(500).json({ error: 'Failed to update highlight' });
  }
});

// Delete a highlight
app.delete('/api/highlights/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const highlight = await Highlight.findOneAndDelete({ _id: id, userId });

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    // Update book stats highlight count
    await BookStats.findOneAndUpdate(
      { userId, bookId: highlight.bookId },
      { 
        $inc: { highlightsCount: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ success: true, message: 'Highlight deleted successfully' });
  } catch (error) {
    console.error('Delete highlight error:', error);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// ==================== BOOK STATS ROUTES ====================

// Get book stats
app.get('/api/book-stats', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.query;
    const userId = req.user.id;

    if (bookId) {
      // Get stats for specific book
      const stats = await BookStats.findOne({ userId, bookId });
      if (!stats) {
        return res.status(404).json({ error: 'Stats not found' });
      }
      return res.json(stats);
    } else {
      // Get all stats for user
      const stats = await BookStats.find({ userId }).sort({ lastReadAt: -1 });
      return res.json(stats);
    }
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({ error: 'Failed to fetch book stats' });
  }
});

// Create or update book stats
app.post('/api/book-stats', authenticateToken, async (req, res) => {
  try {
    const { bookId, bookTitle, currentPage, totalPages } = req.body;
    const userId = req.user.id;

    // Validation
    if (!bookId || !bookTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate progress
    const progress = totalPages && currentPage 
      ? Math.round((currentPage / totalPages) * 100) 
      : 0;

    const stats = await BookStats.findOneAndUpdate(
      { userId, bookId },
      {
        bookTitle,
        currentPage,
        totalPages,
        progress,
        lastReadAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(201).json(stats);
  } catch (error) {
    console.error('Create book stats error:', error);
    res.status(500).json({ error: 'Failed to create book stats' });
  }
});

// Update book stats
app.put('/api/book-stats', authenticateToken, async (req, res) => {
  try {
    const { bookId, currentPage, totalPages } = req.body;
    const userId = req.user.id;

    // Calculate progress
    const progress = totalPages && currentPage 
      ? Math.round((currentPage / totalPages) * 100) 
      : 0;

    const stats = await BookStats.findOneAndUpdate(
      { userId, bookId },
      {
        currentPage,
        totalPages,
        progress,
        lastReadAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Update book stats error:', error);
    res.status(500).json({ error: 'Failed to update book stats' });
  }
});

// Get user reading statistics
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalBooks, totalHighlights, bookStats] = await Promise.all([
      BookStats.countDocuments({ userId }),
      Highlight.countDocuments({ userId }),
      BookStats.find({ userId }).sort({ lastReadAt: -1 }).limit(5)
    ]);

    res.json({
      totalBooks,
      totalHighlights,
      recentBooks: bookStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📚 Book Reading App API ready`);
});

