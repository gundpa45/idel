# 🔧 Troubleshooting Guide

## 🚨 Current Issues & Solutions

### 1. Metro Bundler Error (`InternalBytecode.js`)

**Error**: `ENOENT: no such file or directory, open 'D:\ads\InternalBytecode.js'`

**Solutions** (try in order):

#### Quick Fix:

```bash
# Stop the current server (Ctrl+C)
# Then run:
npx expo start --clear
```

#### If Quick Fix Doesn't Work:

```bash
# 1. Clear all caches
npm cache clean --force

# 2. Delete node_modules
rmdir /s /q node_modules

# 3. Reinstall dependencies
npm install

# 4. Start with clear cache
npx expo start --clear
```

#### Alternative Method:

```bash
# Use the provided script
node clear-cache.js
```

### 2. Highlight Toolbar Not Showing

**Issue**: Highlight button not appearing when selecting text

**Debugging Steps**:

1. **Check Console Logs**: Look for these messages in the console:
   - `"PDF JavaScript injection started"`
   - `"Mouse up event detected"` or `"Touch end event detected"`
   - `"Selection data:"` followed by selection info
   - `"Text selected for highlighting:"` followed by selected text

2. **Test Selection**: In development mode, you'll see a purple "🧪 Test Selection" button. Click it to manually trigger the highlight toolbar.

3. **Check Selection Criteria**: The toolbar now shows for:
   - Text with at least 3 characters
   - Any number of words (even single words)
   - This is more lenient than before

4. **Try Different Selection Methods**:
   - Long press and drag (mobile)
   - Click and drag (desktop)
   - Double-click to select words
   - Triple-click to select paragraphs

### 3. API Connection Issues

**Error**: `"Error fetching highlights: [Error: Failed to fetch highlights]"`

**This is Normal** if:

- Backend server is not running
- No internet connection
- First time using the app

**Solutions**:

- App works in offline mode
- Highlights are stored locally
- Will sync when server is available

## 🧪 Debug Mode Features

When running in development (`__DEV__` mode), you'll see debug indicators:

- **Green/Red Badge**: Authentication status
- **Orange Badge**: Offline mode indicator
- **Purple Button**: Test selection trigger

## 📱 Expected Behavior

### Text Selection Flow:

1. **Select text** in PDF (3+ characters)
2. **Highlight toolbar appears** at bottom
3. **Choose color** from palette
4. **Tap "Save Highlight"** to save
5. **Toolbar auto-hides** after 30 seconds OR tap ✕ to close

### If Toolbar Doesn't Appear:

- Check if text is long enough (3+ characters)
- Try selecting again with different method
- Use the test button in debug mode
- Check console for JavaScript errors

## 🔍 Advanced Debugging

### Enable WebView Debugging:

1. Open Chrome DevTools
2. Go to `chrome://inspect`
3. Find your app's WebView
4. Click "Inspect" to see PDF JavaScript console

### Check Network Requests:

- Open Network tab in DevTools
- Look for failed API calls to `/highlights`
- Check if authentication headers are present

## 📞 Still Having Issues?

If problems persist:

1. **Clear everything**:

   ```bash
   # Delete these folders/files:
   - node_modules/
   - .expo/
   - package-lock.json (optional)

   # Then:
   npm install
   npx expo start --clear
   ```

2. **Check versions**:

   ```bash
   node --version  # Should be 16+
   npm --version   # Should be 8+
   npx expo --version  # Should be latest
   ```

3. **Restart development server**:
   - Stop server (Ctrl+C)
   - Close terminal
   - Open new terminal
   - Run `npx expo start --clear`

The app is designed to work offline, so highlighting should function even without a backend connection.
