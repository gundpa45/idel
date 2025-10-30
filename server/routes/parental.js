const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ReadingSession = require("../models/ReadingSession");
const { protect: auth } = require("../middleware/authMiddleware");

// Parental access endpoint
router.post("/auth/parental-access", async (req, res) => {
  try {
    const { accessCode, parentEmail } = req.body;

    // Validate access code (in production, store these securely)
    const validCodes = ["PARENT123", "FAMILY456", "MONITOR789"];

    if (!validCodes.includes(accessCode.toUpperCase())) {
      return res.status(401).json({ msg: "Invalid parental access code" });
    }

    // Find parent user by email
    const parentUser = await User.findOne({ email: parentEmail });
    if (!parentUser) {
      return res.status(404).json({ msg: "Parent account not found" });
    }

    // Find children linked to this parent (you can implement this based on your user model)
    // For now, we'll find users who might be children of this parent
    const children = await User.find({
      // You can add a parentEmail field or similar to link children to parents
      // For demo, we'll find users created recently or with similar email domain
      $or: [
        { email: { $regex: parentEmail.split("@")[0], $options: "i" } },
        {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }, // Last 30 days
      ],
    }).select("name email _id");

    // Generate a temporary token for parental access
    const token =
      "parental_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    res.json({
      msg: "Parental access granted",
      token,
      parentUser: {
        id: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
      },
      children,
    });
  } catch (error) {
    console.error("Parental access error:", error);
    res.status(500).json({ msg: "Server error during parental access" });
  }
});

// Get reading activities for parental dashboard
router.get("/reading-activities", auth, async (req, res) => {
  try {
    const { period = "today" } = req.query;

    // Calculate date range based on period
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

    // Find reading sessions within the date range
    const activities = await ReadingSession.find({
      startTime: { $gte: startDate },
      // You can add parent-child relationship filtering here
    }).sort({ startTime: -1 });

    res.json({
      activities,
      period,
      totalActivities: activities.length,
    });
  } catch (error) {
    console.error("Error fetching reading activities:", error);
    res.status(500).json({ msg: "Server error fetching reading activities" });
  }
});

// Get reading statistics for parental dashboard
router.get("/reading-stats", auth, async (req, res) => {
  try {
    const { period = "today", childId } = req.query;

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

    // Build query
    let query = { startTime: { $gte: startDate } };
    if (childId) {
      query.userId = childId;
    }

    // Get reading sessions
    const sessions = await ReadingSession.find(query);

    // Calculate statistics
    const totalMinutes = sessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const totalPages = sessions.reduce(
      (sum, session) => sum + (session.pagesRead || 0),
      0
    );
    const completedBooks = sessions.filter(
      (session) => session.status === "completed"
    ).length;
    const uniqueBooks = [
      ...new Set(sessions.map((session) => session.bookTitle)),
    ].length;

    // Calculate reading streak (consecutive days with reading)
    const dailyReading = {};
    sessions.forEach((session) => {
      const date = new Date(session.startTime).toDateString();
      dailyReading[date] = true;
    });

    let readingStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (dailyReading[checkDate.toDateString()]) {
        readingStreak++;
      } else {
        break;
      }
    }

    res.json({
      period,
      totalMinutes,
      totalPages,
      completedBooks,
      uniqueBooks,
      readingStreak,
      totalSessions: sessions.length,
      averageSessionLength:
        sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
    });
  } catch (error) {
    console.error("Error fetching reading stats:", error);
    res.status(500).json({ msg: "Server error fetching reading statistics" });
  }
});

module.exports = router;
