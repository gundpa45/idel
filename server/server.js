const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (development)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/highlights", require("./routes/highlights"));
app.use("/api/books", require("./routes/books"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/parental", require("./routes/parental"));
app.use("/api/reading-sessions", require("./routes/reading-sessions"));
app.use("/api/saved-books", require("./routes/savedBooks"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Book Reader API is running",
    timestamp: new Date().toISOString(),
    database: "Connected",
  });
});

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "📚 Book Reader API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      highlights: "/api/highlights",
      books: "/api/books",
      stats: "/api/stats",
      parental: "/api/parental",
      readingSessions: "/api/reading-sessions",
      savedBooks: "/api/saved-books",
      health: "/api/health",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server - Listen on 0.0.0.0 to accept connections from phone
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("=".repeat(50));
  console.log(`🚀 Book Reader Server Started`);
  console.log("=".repeat(50));
  console.log(`📱 Phone Access:    http://172.16.2.8:${PORT}`);
  console.log(`💻 Local Access:    http://localhost:${PORT}`);
});
