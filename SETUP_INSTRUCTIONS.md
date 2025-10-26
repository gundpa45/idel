# 📚 Book Reading App - Complete Setup Guide

A professional book reading app with text highlighting, user authentication, and real-time database sync.

## Features ✨

- 🎨 **Professional Text Highlighting** with 6 color options
- 👤 **User Authentication** (Login/Signup)
- 💾 **Real-time Database Sync** with MongoDB
- 📊 **Reading Statistics** tracking
- 🎯 **Optimistic UI Updates** for instant feedback
- 🎨 **Beautiful Modern UI** with animations
- 📱 **Mobile-First Design** for Android/iOS

---

## Prerequisites

Before starting, ensure you have installed:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
3. **Android Studio** or **Xcode** (for mobile development)
4. **Expo Go** app on your phone (for testing)

---

## Installation Steps

### 1️⃣ Install Frontend Dependencies

```powershell
# Navigate to project root
cd D:\ads

# Install dependencies
npm install
```

### 2️⃣ Setup Backend Server

```powershell
# Navigate to backend folder
cd backend

# Install backend dependencies
npm install

# Start MongoDB (if not running as service)
# Option 1: If MongoDB is installed as a service, it should already be running
# Option 2: If not, start manually:
mongod --dbpath="C:\data\db"
```

### 3️⃣ Configure Environment

The IP address is already configured in `config.ts`:
```typescript
export const API_URL = 'http://172.16.2.7:5000';
```

**Important**: Make sure your phone and computer are on the **same WiFi network**.

### 4️⃣ Start the Backend Server

```powershell
# From D:\ads\backend directory
npm start

# You should see:
# ✅ Connected to MongoDB
# 🚀 Server running on http://0.0.0.0:5000
# 📚 Book Reading App API ready
```

### 5️⃣ Start the Frontend App

Open a **new terminal** window:

```powershell
# From D:\ads directory
npx expo start --clear

# Or
npm start
```

### 6️⃣ Run on Your Phone

1. **Install Expo Go** from Play Store (Android) or App Store (iOS)
2. **Scan the QR code** shown in terminal with Expo Go app
3. **Wait for the app to load** (first time takes longer)

---

## How to Use the App

### 1. **Sign Up / Login**
- Open the app and create an account
- Your credentials are securely stored in MongoDB

### 2. **Browse Books**
- Navigate through the library
- Tap on any book to view details

### 3. **Start Reading**
- Tap "Start Reading 📖" button
- Book loads in the reader

### 4. **Highlight Text**
- **Select any text** in the book by long-pressing
- A **professional toolbar** appears at the bottom
- **Choose a color** from 6 options (Yellow, Green, Blue, Pink, Purple, Orange)
- Tap "**Save Highlight**" button
- ✅ **Instant feedback** - highlight appears immediately!

### 5. **View All Highlights**
- Tap "**Highlights**" button (top-right corner)
- Sidebar slides in showing all your highlights
- Highlights are **color-coded** and **sorted by date**
- Tap any highlight to jump to it (coming soon)
- Tap "**Remove**" to delete a highlight

### 6. **Track Your Progress**
- All reading activity is tracked
- Highlights count updates in real-time
- Book stats saved per user

---

## Architecture Overview

```
📦 D:\ads
├── 📱 Frontend (React Native + Expo)
│   ├── app/
│   │   ├── (tabs)/index.tsx          # Home screen
│   │   ├── auth/login.tsx            # Login
│   │   ├── auth/signup.tsx           # Signup
│   │   ├── reader/[id].tsx           # Book details
│   │   └── BookReader.tsx            # 🎯 Main reader with highlights
│   ├── components/
│   │   ├── MoviesCard.tsx
│   │   └── SearchBar.tsx
│   ├── context/AuthContext.tsx       # User authentication state
│   ├── interfaces/interfaces.d.ts    # TypeScript types
│   └── config.ts                     # API configuration
│
└── 🖥️ Backend (Node.js + Express + MongoDB)
    ├── server.js                     # Main API server
    ├── package.json
    └── .env                          # Environment variables
```

---

## API Endpoints

All endpoints are documented in `BACKEND_API_DOCS.md`:

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Highlights
- `GET /api/highlights?userId=X&bookId=Y` - Get highlights
- `POST /api/highlights` - Create highlight
- `PUT /api/highlights/:id` - Update highlight
- `DELETE /api/highlights/:id` - Delete highlight

### Book Stats
- `GET /api/book-stats?userId=X&bookId=Y` - Get stats
- `POST /api/book-stats` - Create/update stats
- `GET /api/user/stats` - Get user summary

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Highlights Collection
```javascript
{
  _id: ObjectId,
  text: String,
  bookId: String,
  bookTitle: String,
  userId: ObjectId (ref: User),
  color: String (hex color),
  page: Number,
  note: String,
  createdAt: Date,
  updatedAt: Date
}
```

### BookStats Collection
```javascript
{
  _id: ObjectId,
  bookId: String,
  bookTitle: String,
  userId: ObjectId (ref: User),
  currentPage: Number,
  totalPages: Number,
  progress: Number (0-100),
  lastReadAt: Date,
  highlightsCount: Number,
  notesCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Troubleshooting

### ❌ "Cannot connect to server"
**Solution**:
- Ensure backend is running (`npm start` in `backend/` folder)
- Check MongoDB is running
- Verify phone and computer are on same WiFi
- Confirm IP address in `config.ts` matches your computer's IP

### ❌ "Failed to fetch highlights"
**Solution**:
- Make sure you're logged in
- Check backend console for errors
- Verify MongoDB connection

### ❌ "Highlight not saving"
**Solution**:
- Check network connection
- Open backend terminal to see error logs
- Verify user authentication token is valid

### ❌ MongoDB connection error
**Solution**:
```powershell
# Start MongoDB service
net start MongoDB

# Or run manually
mongod --dbpath="C:\data\db"
```

### ❌ App not loading on phone
**Solution**:
- Clear Expo cache: `npx expo start --clear`
- Restart Expo Go app
- Check if phone can ping your computer's IP

---

## Production Deployment

### Backend Deployment (e.g., Railway, Render, Heroku)

1. Create account on hosting platform
2. Connect GitHub repository
3. Set environment variables:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookapp
   JWT_SECRET=your-production-secret-key
   PORT=5000
   ```
4. Deploy!

### Frontend Deployment

1. Update `config.ts` with production API URL:
   ```typescript
   export const API_URL = 'https://your-api.railway.app';
   ```

2. Build for Android:
   ```powershell
   eas build --platform android
   ```

3. Build for iOS:
   ```powershell
   eas build --platform ios
   ```

---

## Credits

Built with ❤️ using:
- React Native & Expo
- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- NativeWind (Tailwind for React Native)

---

## Support

For issues or questions:
1. Check `BACKEND_API_DOCS.md` for API reference
2. Review console logs (both frontend and backend)
3. Verify all services are running

**Happy Reading! 📚✨**

