#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧹 Clearing React Native and Expo caches...");

try {
  // Clear Metro cache
  console.log("Clearing Metro cache...");
  execSync("npx expo start --clear", { stdio: "inherit" });
} catch (error) {
  console.log("Metro cache clear failed, trying alternative methods...");

  try {
    // Clear npm cache
    console.log("Clearing npm cache...");
    execSync("npm cache clean --force", { stdio: "inherit" });

    // Clear Expo cache
    console.log("Clearing Expo cache...");
    execSync("npx expo install --fix", { stdio: "inherit" });

    // Remove node_modules and reinstall
    console.log("Removing node_modules...");
    if (fs.existsSync("node_modules")) {
      execSync("rmdir /s /q node_modules", { stdio: "inherit" });
    }

    console.log("Reinstalling dependencies...");
    execSync("npm install", { stdio: "inherit" });

    console.log("✅ Cache cleared successfully!");
    console.log("Now run: npx expo start");
  } catch (innerError) {
    console.error("❌ Error clearing cache:", innerError.message);
    console.log("\n🔧 Manual steps to try:");
    console.log("1. Delete node_modules folder");
    console.log("2. Run: npm cache clean --force");
    console.log("3. Run: npm install");
    console.log("4. Run: npx expo start --clear");
  }
}
