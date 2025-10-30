const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    console.log("✅ New user registered:", user.email);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    console.log("✅ User logged in:", user.email);
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const { name, profilePicture, readingGoal, preferences } = req.body;

    if (name) user.name = name;
    if (profilePicture) user.profilePicture = profilePicture;
    if (readingGoal !== undefined) user.readingGoal = readingGoal;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/parental-access
// @desc    Parental access with special code
// @access  Public
router.post("/parental-access", async (req, res) => {
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

    // Find children linked to this parent
    // For demo, we'll find all users to show reading activities
    const children = await User.find({}).select("name email _id");

    // Generate a temporary token for parental access
    const token = jwt.sign(
      {
        userId: parentUser._id,
        parentalAccess: true,
        accessLevel: "parental_dashboard",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Parental access expires in 24 hours
    );

    console.log("✅ Parental access granted for:", parentEmail);
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

module.exports = router;
