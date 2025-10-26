# Network Connection Troubleshooting

## Current Issue

The app is showing "Network request failed" errors when trying to fetch highlights and book stats. This means the app can't connect to the backend server.

## Quick Fixes Applied

1. **Graceful Error Handling**: The app now works offline - you can still read books and create highlights
2. **Offline Mode**: Highlights are saved locally when the server is unavailable
3. **No More Annoying Alerts**: Network errors are logged but don't show popup alerts

## Root Cause

The app is configured to connect to: `http://172.16.2.7:5000`

This could fail because:

1. **Backend server is not running**
2. **Wrong IP address** - Your computer's IP might have changed
3. **Firewall blocking the connection**
4. **Different network** - Phone and computer on different networks

## How to Fix

### Option 1: Start the Backend Server

If you have a backend server, make sure it's running on port 5000:

```bash
# Navigate to your backend directory
cd your-backend-folder

# Start the server (example commands)
npm start
# or
node server.js
# or
python app.py
```

### Option 2: Update the IP Address

1. Find your computer's current IP address:
   - **Windows**: Open Command Prompt, type `ipconfig`
   - **Mac/Linux**: Open Terminal, type `ifconfig` or `ip addr`

2. Update the IP in `config.ts`:

```typescript
export const API_URL = "http://YOUR_NEW_IP:5000";
```

### Option 3: Use Localhost for Testing

If testing on an emulator, you can use:

```typescript
export const API_URL = "http://10.0.2.2:5000"; // Android emulator
// or
export const API_URL = "http://localhost:5000"; // iOS simulator
```

### Option 4: Work Offline

The app now works without a backend:

- You can read books normally
- Highlights are saved locally
- Everything syncs when server becomes available

## Testing the Connection

1. Open a web browser on your phone
2. Go to: `http://172.16.2.7:5000`
3. If it doesn't load, the server isn't accessible

## Current App Behavior

✅ **Works**: Reading books, creating highlights, offline mode
❌ **Doesn't Work**: Syncing highlights across devices, user authentication persistence

The app is now much more resilient and won't crash or show annoying error messages when the server is unavailable.
