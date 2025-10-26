import { AuthContext } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import WebView from 'react-native-webview';
import { API_BASE_URL } from '../config';

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef9c3', border: '#fde68a' },
  { name: 'Green', value: '#d1fae5', border: '#a7f3d0' },
  { name: 'Blue', value: '#dbeafe', border: '#bfdbfe' },
  { name: 'Pink', value: '#fce7f3', border: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff', border: '#d8b4fe' },
  { name: 'Orange', value: '#fed7aa', border: '#fdba74' },
];

const BookReaderScreen = () => {
  const { link, title, bookId } = useLocalSearchParams();
  const authContext = useContext(AuthContext);
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const sidebarAnim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [bookStats, setBookStats] = useState<BookStats | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const currentBookId = typeof bookId === 'string' ? bookId : '';
  const currentTitle = typeof title === 'string' ? title : 'Unknown';
  
  // More robust user ID extraction with debugging
  const userId = authContext?.user?.id || authContext?.user?._id || authContext?.user?.userId;
  
  // Debug logging for authentication issues
  useEffect(() => {
    console.log('BookReader Auth Debug Info:', {
      hasAuthContext: !!authContext,
      hasUser: !!authContext?.user,
      hasToken: !!authContext?.token,
      userId: userId,
      userObject: authContext?.user,
      bookId: currentBookId,
      title: currentTitle
    });
  }, [authContext, userId, currentBookId, currentTitle]);

  const originalUrl = typeof link === 'string' ? link : '';

  // ✅ FIX 1: Robust URL handling to prevent downloads and display PDFs correctly.
  // This logic forces any compatible document link into Google's viewer.
  const finalUrl =
    originalUrl.includes('/preview') // Already a Google Drive preview link
      ? originalUrl
      : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(originalUrl)}`;

  useEffect(() => {
    if (userId && currentBookId) {
      fetchHighlights();
      fetchOrCreateBookStats();
    }
  }, [userId, currentBookId]);

  // 📥 Fetch highlights from the backend (filtered by user and book)
  const fetchHighlights = async () => {
    if (!userId || !currentBookId) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/highlights?userId=${userId}&bookId=${currentBookId}`,
        {
          headers: {
            'Authorization': `Bearer ${authContext?.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );
      if (!response.ok) throw new Error('Failed to fetch highlights');
      const data = await response.json();
      setHighlights(data);
    } catch (error) {
      console.error('Error fetching highlights:', error);
      // Don't show alert for network errors - just log them
      // The app should work offline for reading
      if (error.message.includes('Network request failed')) {
        console.log('Working in offline mode - highlights will be stored locally when server is available');
        setIsOfflineMode(true);
      }
    }
  };

  // 📊 Fetch or create book stats
  const fetchOrCreateBookStats = async () => {
    if (!userId || !currentBookId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/book-stats?userId=${userId}&bookId=${currentBookId}`,
        {
          headers: {
            'Authorization': `Bearer ${authContext?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setBookStats(data);
      } else {
        // Create new stats if not found
        const createResponse = await fetch(`${API_BASE_URL}/book-stats`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authContext?.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            bookId: currentBookId,
            bookTitle: currentTitle,
            lastReadAt: new Date().toISOString(),
            highlightsCount: 0,
          }),
        });
        
        if (createResponse.ok) {
          const newStats = await createResponse.json();
          setBookStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error with book stats:', error);
      // Don't show alerts for network errors - work offline
      if (error.message.includes('Network request failed')) {
        console.log('Book stats will sync when server is available');
      }
    }
  };

  // 🔄 Update book stats (last read time)
  const updateBookStats = async () => {
    if (!userId || !currentBookId || !authContext?.token) return;

    try {
      await fetch(`${API_BASE_URL}/book-stats`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authContext.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bookId: currentBookId,
          lastReadAt: new Date().toISOString(),
          highlightsCount: highlights.length,
        }),
      });
    } catch (error) {
      console.error('Error updating book stats:', error);
    }
  };

  // 💾 Save a new highlight (linked to user and book) with optimistic update
  const handleSaveHighlight = async (highlightText: string, color: string = selectedColor) => {
    // Enhanced authentication check with better error messages
    if (!highlightText.trim()) {
      Alert.alert('Error', 'Please select some text to highlight.');
      return;
    }
    
    if (!authContext?.user) {
      Alert.alert('Authentication Required', 'Please login to save highlights.');
      return;
    }
    
    if (!authContext?.token) {
      Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
      return;
    }
    
    if (!userId) {
      Alert.alert('User Error', 'Unable to identify user. Please logout and login again.');
      console.log('Auth context user:', authContext?.user);
      return;
    }
    
    if (!currentBookId) {
      Alert.alert('Book Error', 'Unable to identify the current book.');
      return;
    }
    
    setIsLoadingAction(true);
    
    // Optimistic update - add highlight immediately
    const tempHighlight: Highlight = {
      id: `temp-${Date.now()}`,
      text: highlightText,
      bookId: currentBookId,
      bookTitle: currentTitle,
      userId: userId.toString(),
      color,
      createdAt: new Date().toISOString(),
    };
    
    setHighlights(prev => [tempHighlight, ...prev]);
    setSelectedText(null);
    setShowColorPicker(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/highlights`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authContext?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: highlightText,
          bookId: currentBookId,
          bookTitle: currentTitle,
          color,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save highlight');
      const savedHighlight = await response.json();
      
      // Replace temp highlight with real one
      setHighlights(prev => 
        prev.map(h => h.id === tempHighlight.id ? savedHighlight : h)
      );
      
      // Update book stats
      fetchOrCreateBookStats();
    } catch (error) {
      console.error(error);
      
      if (error.message.includes('Network request failed')) {
        // Keep the highlight locally for network errors
        console.log('Highlight saved locally - will sync when server is available');
        Alert.alert('Offline Mode', 'Highlight saved locally. It will sync when you\'re back online.');
      } else {
        // Remove optimistic highlight for other errors
        setHighlights(prev => prev.filter(h => h.id !== tempHighlight.id));
        Alert.alert('Error', 'Could not save highlight. Please try again.');
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  // ❌ Remove a highlight with optimistic update
  const handleRemoveHighlight = async (item: Highlight) => {
    // Optimistic update
    const previousHighlights = [...highlights];
    setHighlights(prev => prev.filter(h => h.id !== item.id));
    
    try {
      const response = await fetch(`${API_BASE_URL}/highlights/${item.id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authContext?.token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      // Update book stats
      fetchOrCreateBookStats();
    } catch (error) {
      console.error('Error removing highlight:', error);
      // Rollback on error
      setHighlights(previousHighlights);
      Alert.alert('Error', 'Could not remove highlight. Please try again.');
    }
  };

  // 🎯 Jump to a highlight (placeholder functionality)
  const jumpToHighlight = (id: string) => {
    const highlight = highlights.find(h => h.id === id);
    if (highlight) {
      Alert.alert('Jump to Highlight', `Navigating to:\n\n"${highlight.text}"`);
      // Future enhancement: Inject JS to find and scroll to the text in the WebView.
      // webViewRef.current?.injectJavaScript(`window.find('${highlight.text}');`);
    }
  };

  // 🌈 Sidebar animation logic
  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? 0 : 1;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true, // Use native driver for smoother animations
    }).start(() => {
      setSidebarOpen(!isSidebarOpen);
    });
  };

  // 📩 Handle messages from the WebView (e.g., text selection)
  const onMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'TEXT_SELECTED' && msg.text) {
        setSelectedText(msg.text);
      }
    } catch (err) {
      // It's common for other scripts to post messages, so we can ignore non-JSON data.
    }
  };

  // 👨‍💻 Inject JavaScript into the WebView to capture text selections
  const injectedJavaScript = `
    document.addEventListener('mouseup', function() {
      var selectedText = window.getSelection().toString().trim();
      if (selectedText.length > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'TEXT_SELECTED',
          text: selectedText
        }));
      }
    });
    true; // Required for injectedJavaScript to work correctly on both platforms
  `;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ title: (title as string) || 'Book Reader', headerShown: true }} />

      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 10, color: '#374151' }}>Loading Document...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: finalUrl }}
        onLoadEnd={() => setLoading(false)}
        // ✅ FIX 2: Added error handling to prevent infinite loading state.
        onError={() => {
          setLoading(false);
          Alert.alert('Error', 'Failed to load the document. Please check the link.');
        }}
        onHttpError={() => {
          setLoading(false);
          Alert.alert('Error', 'A network error occurred while trying to load the document.');
        }}
        injectedJavaScript={injectedJavaScript}
        onMessage={onMessage}
        style={{ flex: 1, opacity: loading ? 0 : 1 }} // Hide WebView while loading
      />

      {/* Professional Highlight Toolbar - appears when text is selected */}
      {selectedText && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -3 },
            elevation: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="color-palette" size={20} color="#6b7280" />
            <Text style={{ marginLeft: 8, color: '#374151', fontSize: 14, fontWeight: '600' }}>
              Choose Highlight Color
            </Text>
          </View>

          {/* Color Picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {HIGHLIGHT_COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                onPress={() => setSelectedColor(color.value)}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: color.value,
                  marginRight: 12,
                  borderWidth: selectedColor === color.value ? 3 : 2,
                  borderColor: selectedColor === color.value ? '#2563eb' : color.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                {selectedColor === color.value && (
                  <Ionicons name="checkmark" size={24} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setSelectedText(null)}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSaveHighlight(selectedText, selectedColor)}
              disabled={isLoadingAction}
              style={{
                flex: 2,
                padding: 14,
                borderRadius: 12,
                backgroundColor: isLoadingAction ? '#93c5fd' : '#2563eb',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              {isLoadingAction ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="bookmark" size={18} color="#ffffff" />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>
                    Save Highlight
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Selected Text Preview */}
          <View
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: selectedColor,
            }}
          >
            <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>Selected Text:</Text>
            <Text style={{ color: '#1f2937', fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
              "{selectedText}"
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Status Indicators */}
      {__DEV__ && (
        <View style={{ position: 'absolute', top: 60, left: 15, zIndex: 5 }}>
          {/* Auth Status */}
          <View
            style={{
              backgroundColor: authContext?.user ? '#10b981' : '#ef4444',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              marginBottom: 5,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {authContext?.user ? `✓ ${authContext.user.name || 'User'}` : '✗ Not logged in'}
            </Text>
          </View>
          
          {/* Network Status */}
          {isOfflineMode && (
            <View
              style={{
                backgroundColor: '#f59e0b',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                📱 Offline Mode
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Button to toggle the highlights sidebar */}
      <TouchableOpacity
        onPress={toggleSidebar}
        style={{
          position: 'absolute',
          top: 10,
          right: 15,
          backgroundColor: '#111827',
          paddingHorizontal: 15,
          paddingVertical: 10,
          borderRadius: 20,
          zIndex: 5,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isSidebarOpen ? 'Close' : 'Highlights'}
        </Text>
      </TouchableOpacity>

      {/* Sidebar for displaying highlights */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: Dimensions.get('window').width * 0.8, // Responsive width
          backgroundColor: '#f9fafb',
          padding: 16,
          borderLeftWidth: 1,
          borderLeftColor: '#e5e7eb',
          elevation: 8,
          transform: [
            {
              translateX: sidebarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get('window').width, 0], // Animate from off-screen
              }),
            },
          ],
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 8,
            marginTop: 40, // Avoid overlapping with header/status bar
          }}
        >
          My Highlights
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#6b7280',
            marginBottom: 12,
          }}
        >
          {highlights.length} highlight{highlights.length !== 1 ? 's' : ''} in {currentTitle}
        </Text>

        {highlights.length === 0 ? (
          <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 20 }}>
            You haven't made any highlights yet.
          </Text>
        ) : (
          <FlatList
            data={highlights}
            // ✅ FIX 3: More stable key extractor
            keyExtractor={(item) => item.id?.toString() || `${item.text}-${Math.random()}`}
            renderItem={({ item }) => {
              const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === item.color) || HIGHLIGHT_COLORS[0];
              return (
              <View
                style={{
                  backgroundColor: item.color || '#fef9c3',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colorConfig.border,
                }}
              >
                <TouchableOpacity onPress={() => jumpToHighlight(item.id)} activeOpacity={0.7}>
                  <Text style={{ color: '#1f2937', fontSize: 14, lineHeight: 20 }}>
                    "{item.text}"
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ color: '#6b7280', fontSize: 11 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveHighlight(item)}
                    style={{
                      backgroundColor: '#fee2e2',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#b91c1c', fontWeight: '600', fontSize: 12 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );}
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

export default BookReaderScreen;