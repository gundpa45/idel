# 📚 IDEL - Interactive Digital E-Learning App

A React Native Expo application for reading PDFs with highlighting capabilities, user authentication, and offline support.

## ✨ Features

- 📖 **PDF Reading**: View PDFs with Google Docs viewer integration
- 🎨 **Text Highlighting**: Select text and highlight with multiple colors
- 👤 **User Authentication**: Login/signup with secure token management
- 💾 **Offline Mode**: Works without internet, syncs when online
- 📱 **Cross-Platform**: Runs on iOS, Android, and Web
- 🎯 **Optimistic Updates**: Instant UI feedback for better UX
- 📊 **Reading Stats**: Track reading progress and highlights

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Clone the repository:**

```bash
git clone git@github.com:gundpa45/idel.git
cd idel
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start the development server:**

```bash
npx expo start
```

4. **Run on your device:**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## 🏗️ Project Structure

```
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── profile.tsx    # User profile
│   │   ├── save.tsx       # Saved items
│   │   └── search.tsx     # Search functionality
│   ├── auth/              # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── signup.tsx     # Registration screen
│   ├── BookReader.tsx     # PDF reader with highlighting
│   └── _layout.tsx        # Root layout with AuthProvider
├── components/            # Reusable UI components
├── context/               # React contexts (AuthContext)
├── interfaces/            # TypeScript type definitions
├── server/                # Backend API (Node.js/Express)
├── utils/                 # Utility functions
└── assets/                # Images, fonts, PDFs
```

## 🔧 Configuration

### API Configuration

Update `config.ts` with your backend server URL:

```typescript
export const API_URL = "http://YOUR_IP:5000";
export const API_BASE_URL = `${API_URL}/api`;
```

### Backend Setup

The app includes a Node.js backend in the `server/` directory:

1. **Navigate to server directory:**

```bash
cd server
npm install
```

2. **Set up environment variables:**

```bash
# Create .env file
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

3. **Start the server:**

```bash
npm start
```

## 📱 Key Features Explained

### Authentication System

- **Centralized State**: Uses React Context for auth management
- **Persistent Login**: Stores tokens in AsyncStorage
- **Secure**: JWT-based authentication with the backend

### PDF Reading & Highlighting

- **Google Docs Integration**: Renders PDFs using Google's viewer
- **Text Selection**: JavaScript injection for text selection
- **Color Coding**: 6 different highlight colors
- **Offline Support**: Highlights saved locally when offline

### Network Resilience

- **Graceful Degradation**: App works without backend
- **Optimistic Updates**: Immediate UI feedback
- **Auto-Sync**: Syncs data when connection restored
- **Error Handling**: User-friendly error messages

## 🛠️ Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web

# Backend
cd server && npm start # Start backend server

# Utilities
npm run reset-project # Reset Expo project
```

## 🔍 Troubleshooting

### Network Issues

If you see "Network request failed" errors:

1. **Check server status**: Ensure backend is running on port 5000
2. **Update IP address**: Your computer's IP might have changed
3. **Firewall settings**: Make sure port 5000 is accessible
4. **Network connectivity**: Phone and computer on same network

See `NETWORK_TROUBLESHOOTING.md` for detailed solutions.

### Authentication Issues

If highlighting doesn't work after login:

1. **Check AuthContext**: Verify user data is loaded
2. **Token validation**: Ensure JWT token is valid
3. **Debug mode**: Use the debug indicators in development

See `AUTHENTICATION_FIX.md` for detailed solutions.

## 🧪 Testing

The app includes debug features in development mode:

- **Auth Status Indicator**: Shows login state (green/red)
- **Offline Mode Indicator**: Shows network status (orange)
- **Console Logging**: Detailed debug information

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for excellent libraries
- Google Docs for PDF viewing capabilities

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting guides in the repository
2. Look at existing GitHub issues
3. Create a new issue with detailed information

---

**Made with ❤️ using React Native & Expo**
