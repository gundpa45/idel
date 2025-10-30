const mongoose = require("mongoose");

const ReadingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
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
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    pagesRead: {
      type: Number,
      default: 0,
    },
    highlightsCreated: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["reading", "completed", "paused"],
      default: "reading",
    },
    deviceInfo: {
      platform: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ReadingSessionSchema.index({ userId: 1, startTime: -1 });
ReadingSessionSchema.index({ startTime: -1 });
ReadingSessionSchema.index({ bookId: 1 });

// Virtual for session duration calculation
ReadingSessionSchema.virtual("calculatedDuration").get(function () {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
  }
  return this.duration || 0;
});

// Method to end session
ReadingSessionSchema.methods.endSession = function (
  pagesRead = 0,
  highlightsCreated = 0
) {
  this.endTime = new Date();
  this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  this.pagesRead = pagesRead;
  this.highlightsCreated = highlightsCreated;
  this.status = "completed";
  return this.save();
};

// Static method to get user's reading stats
ReadingSessionSchema.statics.getUserStats = async function (
  userId,
  startDate,
  endDate
) {
  const sessions = await this.find({
    userId,
    startTime: { $gte: startDate, $lte: endDate },
  });

  const totalMinutes = sessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );
  const totalPages = sessions.reduce(
    (sum, session) => sum + (session.pagesRead || 0),
    0
  );
  const totalHighlights = sessions.reduce(
    (sum, session) => sum + (session.highlightsCreated || 0),
    0
  );
  const completedBooks = sessions.filter(
    (session) => session.status === "completed"
  ).length;

  return {
    totalSessions: sessions.length,
    totalMinutes,
    totalPages,
    totalHighlights,
    completedBooks,
    averageSessionLength:
      sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
  };
};

module.exports = mongoose.model("ReadingSession", ReadingSessionSchema);
