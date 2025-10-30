# 🔧 Parental Login Troubleshooting Guide

## 🚨 Issue: Parental Login Button Only Shows Loading

### Most Common Causes:

1. **Backend Server Not Running**
2. **Network Connection Issues**
3. **Wrong API URL Configuration**
4. **Database Connection Problems**

## 🛠️ Step-by-Step Fix

### Step 1: Check Server Status

1. **Test Connection**: Use the "🔍 Test Server Connection" button in the app
2. **Expected Result**: Should show "✅ Server is running!"
3. **If Failed**: Server is not running or not reachable

### Step 2: Start Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies (if not done)
npm install

# Start the server
npm start
```

**Expected Output:**

```
🚀 Book Reader Server Started
📱 Phone Access:    http://172.16.2.10:5000
💻 Local Access:    http://localhost:5000
```

### Step 3: Verify Server is Running

Open browser and go to: `http://172.16.2.10:5000`

**Expected Response:**

```json
{
  "message": "📚 Book Reader API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "parental": "/api/parental",
    "readingSessions": "/api/reading-sessions"
  }
}
```

### Step 4: Test Parental Access Endpoint

Use browser or Postman to test:

```
POST http://172.16.2.10:5000/api/auth/parental-access
Content-Type: application/json

{
  "accessCode": "PARENT123",
  "parentEmail": "gundpa45@gmail.com"
}
```

**Expected Response:**

```json
{
  "msg": "Parental access granted",
  "token": "jwt_token_here",
  "parentUser": {
    "id": "user_id",
    "name": "User Name",
    "email": "gundpa45@gmail.com"
  },
  "children": []
}
```

## 🔍 Common Issues & Solutions

### Issue 1: "Network request failed"

**Cause**: Server not running or wrong IP address

**Solution**:

1. Start server: `cd server && npm start`
2. Check IP in `config.ts` matches your computer's IP
3. Ensure phone and computer on same WiFi network

### Issue 2: "Cannot connect to server"

**Cause**: Firewall or network blocking connection

**Solution**:

1. Disable firewall temporarily
2. Check if port 5000 is open
3. Try different IP address

### Issue 3: "Invalid parental access code"

**Cause**: Code validation failing

**Solution**:

1. Use exact codes: `PARENT123`, `FAMILY456`, `MONITOR789`
2. Check server logs for errors
3. Verify database connection

### Issue 4: Database Connection Error

**Cause**: MongoDB connection failing

**Solution**:

1. Check `.env` file has correct `MONGO_URI`
2. Verify MongoDB Atlas connection
3. Check network access in MongoDB Atlas

## 📱 Debug Steps in App

### 1. Enable Console Logging

- Open React Native debugger
- Check console for error messages
- Look for network request details

### 2. Test Server Connection

- Use "Test Server Connection" button
- Should show server status
- If fails, server is not reachable

### 3. Check Network Settings

- Ensure phone and computer on same WiFi
- Check IP address in `config.ts`
- Try pinging server IP from phone browser

## 🔧 Quick Fixes

### Fix 1: Restart Everything

```bash
# Stop server (Ctrl+C)
# Restart server
cd server
npm start

# Restart app
npx expo start --clear
```

### Fix 2: Check IP Address

1. Find your computer's IP:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. Update `config.ts` with correct IP
3. Restart app

### Fix 3: Test with Localhost (if using emulator)

```typescript
// In config.ts (for Android emulator only)
export const API_URL = "http://10.0.2.2:5000";
```

## ✅ Success Indicators

### Server Running Successfully:

- Console shows "🚀 Book Reader Server Started"
- Browser shows API response at server URL
- Test connection button shows "✅ Server is running!"

### Parental Login Working:

- Loading stops after entering code
- Shows "Parental Access Granted" alert
- Redirects to parental dashboard
- Dashboard shows real data

## 🆘 Still Having Issues?

### Check These:

1. **Server Logs**: Look for error messages in server console
2. **App Logs**: Check React Native debugger console
3. **Network**: Ping server IP from phone browser
4. **Database**: Verify MongoDB connection in server logs

### Common Error Messages:

- `ECONNREFUSED`: Server not running
- `Network request failed`: IP/network issue
- `Invalid parental access code`: Code validation failing
- `Server error`: Database or server issue

### Last Resort:

1. Use different access code
2. Restart computer and phone
3. Try different WiFi network
4. Check firewall settings

The parental login should work once the server is properly running and reachable! 🎯
