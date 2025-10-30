const express = require("express");
const router = express.Router();
const ReadingSession = require("../models/ReadingSession");
const { protect: auth } = require("../middleware/authMiddleware");

// Start a new reading session
router.post("/", auth, async (req, res) => {
  try {
    const { bookId, bookTitle, userName } = req.body;

    // Check if there's already an active session for this user and book
    const existingSession = await ReadingSession.findOne({
      userId: req.user.id,
      bookId,
      status: "reading",
    });

    if (existingSession) {
      return res.json({
        msg: "Session already active",
        session: existingSession,
      });
    }

    // Create new reading session
    const newSession = new ReadingSession({
      userId: req.user.id,
      userName: userName || req.user.name,
      bookId,
      bookTitle,
      startTime: new Date(),
      status: "reading",
    });

    const session = await newSession.save();

    res.json({
      msg: "Reading session started",
      session,
    });
  } catch (error) {
    console.error("Error starting reading session:", error);
    res.status(500).json({ msg: "Server error starting reading session" });
  }
});

// Update/End a reading session
router.put("/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endTime, duration, pagesRead, highlightsCreated, status } =
      req.body;

    const session = await ReadingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Reading session not found" });
    }

    // Verify ownership
    if (session.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Not authorized to update this session" });
    }

    // Update session
    if (endTime) session.endTime = new Date(endTime);
    if (duration !== undefined) session.duration = duration;
    if (pagesRead !== undefined) session.pagesRead = pagesRead;
    if (highlightsCreated !== undefined)
      session.highlightsCreated = highlightsCreated;
    if (status) session.status = status;

    // If ending the session, calculate duration if not provided
    if (status === "completed" && !duration && session.startTime) {
      session.duration = Math.round(
        (new Date(endTime || Date.now()) - session.startTime) / (1000 * 60)
      );
    }

    const updatedSession = await session.save();

    res.json({
      msg: "Reading session updated",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating reading session:", error);
    res.status(500).json({ msg: "Server error updating reading session" });
  }
});

// Get user's reading sessions
router.get("/", auth, async (req, res) => {
  try {
    const { limit = 20, page = 1, status, bookId } = req.query;

    // Build query
    let query = { userId: req.user.id };
    if (status) query.status = status;
    if (bookId) query.bookId = bookId;

    // Get sessions with pagination
    const sessions = await ReadingSession.find(query)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSessions = await ReadingSession.countDocuments(query);

    res.json({
      sessions,
      totalSessions,
      currentPage: page,
      totalPages: Math.ceil(totalSessions / limit),
    });
  } catch (error) {
    console.error("Error fetching reading sessions:", error);
    res.status(500).json({ msg: "Server error fetching reading sessions" });
  }
});

// Get reading statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const { period = "week" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const stats = await ReadingSession.getUserStats(
      req.user.id,
      startDate,
      now
    );

    res.json({
      period,
      ...stats,
    });
  } catch (error) {
    console.error("Error fetching reading stats:", error);
    res.status(500).json({ msg: "Server error fetching reading statistics" });
  }
});

// Delete a reading session
router.delete("/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ReadingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Reading session not found" });
    }

    // Verify ownership
    if (session.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Not authorized to delete this session" });
    }

    await ReadingSession.findByIdAndDelete(sessionId);

    res.json({ msg: "Reading session deleted" });
  } catch (error) {
    console.error("Error deleting reading session:", error);
    res.status(500).json({ msg: "Server error deleting reading session" });
  }
});

module.exports = router;
