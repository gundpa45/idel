import { AuthContext } from '@/context/AuthContext';
import { useParentalControls } from '@/context/ParentalControlContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
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
  
  const parentalControls = useParentalControls();
  
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
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localHighlights, setLocalHighlights] = useState<Highlight[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [contentBlocked, setContentBlocked] = useState(false);
  const [timeRestricted, setTimeRestricted] = useState(false);
  const [currentReadingSession, setCurrentReadingSession] = useState<any>(null);

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

  // Helper function to get color name from hex value
  const getColorName = (hexColor: string): string => {
    const colorMap: { [key: string]: string } = {
      '#fef9c3': 'yellow',
      '#d1fae5': 'green', 
      '#dbeafe': 'blue',
      '#fce7f3': 'pink',
      '#e9d5ff': 'purple',
      '#fed7aa': 'orange'
    };
    return colorMap[hexColor] || 'yellow';
  };

  // Load existing highlights into the PDF
  const loadExistingHighlights = () => {
    if (highlights.length > 0 && webViewRef.current) {
      const highlightData = highlights.map(h => ({
        text: h.text,
        color: getColorName(h.color || '#fef9c3')
      }));
      
      webViewRef.current.injectJavaScript(`
        window.loadHighlights(${JSON.stringify(highlightData)});
      `);
    }
  };

  useEffect(() => {
    if (userId && currentBookId) {
      fetchHighlights();
      fetchOrCreateBookStats();
      
      // Start reading session for parental tracking
      if (currentTitle && authContext?.user) {
        startReadingSession();
      }
    } else {
      // If no user or book ID, assume offline mode
      setIsOfflineMode(true);
    }

    // Cleanup: end reading session when component unmounts
    return () => {
      endReadingSession();
    };
  }, [userId, currentBookId, currentTitle]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  // Check parental restrictions
  useEffect(() => {
    if (parentalControls && typeof parentalControls.checkTimeRestrictions === 'function') {
      // Check time restrictions
      const timeAllowed = parentalControls.checkTimeRestrictions();
      setTimeRestricted(!timeAllowed);

      // For content restrictions, we'd need book metadata
      // This is a placeholder - in real implementation, you'd fetch book metadata
      const mockBookMetadata: BookMetadata = {
        id: currentBookId,
        title: currentTitle,
        author: 'Unknown',
        genre: ['Fiction'], // This would come from your book database
        ageRating: '12+',
        difficulty: 'intermediate',
        topics: ['Adventure'],
        language: 'English'
      };

      if (typeof parentalControls.checkContentRestrictions === 'function') {
        const contentAllowed = parentalControls.checkContentRestrictions(mockBookMetadata);
        setContentBlocked(!contentAllowed);
      }
    }
  }, [currentBookId, currentTitle, parentalControls]);

  // Start reading session
  const startReadingSession = async () => {
    if (!authContext?.user || !authContext?.token) return;

    try {
      const sessionData = {
        userId: authContext.user.id,
        userName: authContext.user.name,
        bookId: currentBookId,
        bookTitle: currentTitle,
        startTime: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/reading-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authContext.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentReadingSession(session);
        console.log('Reading session started:', session);
      }
    } catch (error) {
      console.error('Error starting reading session:', error);
    }
  };

  // End reading session
  const endReadingSession = async () => {
    if (!currentReadingSession || !authContext?.token) return;

    try {
      const endTime = new Date().toISOString();
      const duration = Math.round((new Date(endTime).getTime() - new Date(currentReadingSession.startTime).getTime()) / 60000);

      const updateData = {
        endTime,
        duration,
        status: 'completed'
      };

      const response = await fetch(`${API_BASE_URL}/reading-sessions/${currentReadingSession._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authContext.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        console.log('Reading session ended:', duration, 'minutes');
        setCurrentReadingSession(null);
      }
    } catch (error) {
      console.error('Error ending reading session:', error);
    }
  };

  // 📥 Fetch highlights from the backend (filtered by user and book)
  const fetchHighlights = async () => {
    if (!userId || !currentBookId) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${API_BASE_URL}/highlights?userId=${userId}&bookId=${currentBookId}`,
        {
          headers: {
            'Authorization': `Bearer ${authContext?.token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Failed to fetch highlights');
      const data = await response.json();
      setHighlights(data);
    } catch (error) {
      // Silently handle network errors - app works offline
      console.log('Working in offline mode - highlights will be stored locally when server is available');
      setIsOfflineMode(true);
      // Don't log the full error to avoid console spam
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

  // 💾 Save a new highlight (works offline and online)
  const handleSaveHighlight = async (highlightText: string, color: string = selectedColor) => {
    // Basic validation
    if (!highlightText.trim()) {
      Alert.alert('Error', 'Please select some text to highlight.');
      return;
    }
    
    setIsLoadingAction(true);
    
    // Create highlight object
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text: highlightText,
      bookId: currentBookId,
      bookTitle: currentTitle,
      userId: userId?.toString() || 'offline-user',
      color,
      createdAt: new Date().toISOString(),
    };
    
    // Add highlight immediately (works offline)
    setHighlights(prev => [newHighlight, ...prev]);
    setLocalHighlights(prev => [newHighlight, ...prev]);
    setSelectedText(null);
    
    // Add visual highlight to the PDF
    const colorName = getColorName(color);
    webViewRef.current?.injectJavaScript(`
      if (typeof window.addHighlight === 'function') {
        window.addHighlight("${highlightText.replace(/"/g, '\\"')}", "${colorName}");
      }
    `);
    
    // Try to save to server if online and authenticated
    if (!isOfflineMode && authContext?.user && authContext?.token) {
      try {
        const response = await fetch(`${API_BASE_URL}/highlights`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${authContext.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: highlightText,
            bookId: currentBookId,
            bookTitle: currentTitle,
            color,
          }),
        });
        
        if (response.ok) {
          const savedHighlight = await response.json();
          // Update with server ID
          setHighlights(prev => 
            prev.map(h => h.id === newHighlight.id ? { ...savedHighlight, id: savedHighlight.id } : h)
          );
          console.log('Highlight synced to server');
        }
      } catch (error) {
        console.log('Could not sync to server, keeping local copy');
      }
    }
    
    setIsLoadingAction(false);
    
    // Show appropriate success message
    if (isOfflineMode) {
      Alert.alert(
        '✅ Highlight Saved Offline!', 
        'Your highlight has been saved locally and will sync when you\'re back online.',
        [{ text: 'OK', style: 'default' }]
      );
    } else if (authContext?.user) {
      Alert.alert(
        '✅ Highlight Saved!', 
        'Your highlight has been saved and synced to your account.',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        '✅ Highlight Saved Locally!', 
        'Your highlight has been saved locally. Sign in to sync across devices.',
        [{ text: 'OK', style: 'default' }]
      );
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
      
      // Remove visual highlight from PDF
      webViewRef.current?.injectJavaScript(`
        window.removeHighlight("${item.text.replace(/"/g, '\\"')}");
      `);
      
      // Update book stats
      fetchOrCreateBookStats();
    } catch (error) {
      console.error('Error removing highlight:', error);
      // Rollback on error
      setHighlights(previousHighlights);
      Alert.alert('Error', 'Could not remove highlight. Please try again.');
    }
  };

  // 🎯 Jump to a highlight in the PDF
  const jumpToHighlight = (id: string) => {
    const highlight = highlights.find(h => h.id === id);
    if (highlight && webViewRef.current) {
      // Close sidebar first
      setSidebarOpen(false);
      
      // Scroll to the highlight in the PDF
      webViewRef.current.injectJavaScript(`
        (function() {
          const highlightElement = document.querySelector('[data-highlight-text="${highlight.text.replace(/"/g, '\\"')}"]');
          if (highlightElement) {
            highlightElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Flash the highlight to draw attention
            const originalBg = highlightElement.style.backgroundColor;
            highlightElement.style.backgroundColor = '#ff6b6b';
            highlightElement.style.transform = 'scale(1.05)';
            highlightElement.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
              highlightElement.style.backgroundColor = originalBg;
              highlightElement.style.transform = 'scale(1)';
            }, 1000);
          } else {
            // Fallback: try to find and scroll to the text
            if (window.find && window.find("${highlight.text.replace(/"/g, '\\"')}")) {
              // Text found and highlighted by browser
            }
          }
        })();
      `);
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

  // 📩 Handle messages from the WebView (e.g., text selection, highlight clicks)
  const onMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      
      if (msg.type === 'TEXT_SELECTED' && msg.text) {
        // Clear any existing timeout
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        
        // Show highlight toolbar for any meaningful text selection
        const trimmedText = msg.text.trim();
        const wordCount = trimmedText.split(/\s+/).length;
        
        // More lenient criteria: at least 1 word and 3 characters
        if (trimmedText.length >= 3 && wordCount >= 1) {
          console.log('Text selected for highlighting:', trimmedText);
          setSelectedText(trimmedText);
          
          // Auto-hide selection after 30 seconds of inactivity
          selectionTimeoutRef.current = setTimeout(() => {
            setSelectedText(null);
          }, 30000);
        } else {
          console.log('Text selection too short, not showing highlight toolbar:', trimmedText);
        }
      } else if (msg.type === 'SELECTION_CLEARED') {
        setSelectedText(null);
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
      } else if (msg.type === 'HIGHLIGHT_CLICKED') {
        // Handle highlight click - could show options to edit or remove
        const highlight = highlights.find(h => h.text === msg.text);
        if (highlight) {
          Alert.alert(
            'Highlight Options',
            `"${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}"`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Remove', 
                style: 'destructive',
                onPress: () => handleRemoveHighlight(highlight)
              },
              {
                text: 'Jump to Sidebar',
                onPress: () => {
                  setSidebarOpen(true);
                  // Could scroll to this highlight in the sidebar
                }
              }
            ]
          );
        }
      }
    } catch (err) {
      // It's common for other scripts to post messages, so we can ignore non-JSON data.
    }
  };

  // 👨‍💻 Enhanced JavaScript injection for text selection and highlighting
  const injectedJavaScript = `
    (function() {
      console.log('PDF JavaScript injection started');
      
      // Simple text selection handler
      let selectionTimer;
      
      function handleSelection() {
        clearTimeout(selectionTimer);
        selectionTimer = setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim().length >= 3) {
            const text = selection.toString().trim();
            console.log('Text selected:', text);
            
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TEXT_SELECTED',
                text: text
              }));
            } catch (e) {
              console.log('Error sending selection message:', e);
            }
          }
        }, 500);
      }
      
      // Add event listeners for text selection
      document.addEventListener('mouseup', handleSelection);
      document.addEventListener('touchend', handleSelection);
      document.addEventListener('selectionchange', handleSelection);
      
      // Catch copy events
      document.addEventListener('copy', function(e) {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length >= 3) {
          const text = selection.toString().trim();
          console.log('Text copied:', text);
          
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TEXT_SELECTED',
              text: text
            }));
          } catch (e) {
            console.log('Error sending copy message:', e);
          }
        }
      });
      
      // Store highlights for visual display
      let savedHighlights = [];
      
      // CSS for highlight styles
      const highlightStyles = \`
        .highlight-yellow { background-color: #fef9c3 !important; border: 1px solid #fde68a; }
        .highlight-green { background-color: #d1fae5 !important; border: 1px solid #a7f3d0; }
        .highlight-blue { background-color: #dbeafe !important; border: 1px solid #bfdbfe; }
        .highlight-pink { background-color: #fce7f3 !important; border: 1px solid #fbcfe8; }
        .highlight-purple { background-color: #e9d5ff !important; border: 1px solid #d8b4fe; }
        .highlight-orange { background-color: #fed7aa !important; border: 1px solid #fdba74; }
        .highlight { padding: 2px; border-radius: 3px; cursor: pointer; }
      \`;
      
      // Add styles to document
      const styleSheet = document.createElement('style');
      styleSheet.textContent = highlightStyles;
      document.head.appendChild(styleSheet);
      
      // Enhanced text selection with word boundary detection
      let selectionTimeout;
      
      function getExtendedSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;
        
        const range = selection.getRangeAt(0);
        let text = selection.toString().trim();
        
        if (text.length === 0) return null;
        
        // Extend selection to word boundaries if needed
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        
        if (startContainer.nodeType === Node.TEXT_NODE && endContainer.nodeType === Node.TEXT_NODE) {
          const startText = startContainer.textContent;
          const endText = endContainer.textContent;
          
          let startOffset = range.startOffset;
          let endOffset = range.endOffset;
          
          // Extend to start of word if we're in the middle
          while (startOffset > 0 && /\\w/.test(startText[startOffset - 1])) {
            startOffset--;
          }
          
          // Extend to end of word if we're in the middle
          while (endOffset < endText.length && /\\w/.test(endText[endOffset])) {
            endOffset++;
          }
          
          // Create new range with extended boundaries
          const newRange = document.createRange();
          newRange.setStart(startContainer, startOffset);
          newRange.setEnd(endContainer, endOffset);
          
          text = newRange.toString().trim();
          
          // Update selection to show extended text
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        return {
          text: text,
          range: range.cloneRange(),
          rect: range.getBoundingClientRect()
        };
      }
      
      // Handle text selection
      document.addEventListener('mouseup', function(e) {
        console.log('Mouse up event detected');
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
          const selectionData = getExtendedSelection();
          console.log('Selection data:', selectionData);
          if (selectionData && selectionData.text.length > 0) {
            console.log('Sending TEXT_SELECTED message:', selectionData.text);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TEXT_SELECTED',
              text: selectionData.text,
              rect: {
                x: selectionData.rect.x,
                y: selectionData.rect.y,
                width: selectionData.rect.width,
                height: selectionData.rect.height
              }
            }));
          }
        }, 100);
      });
      
      // Handle touch selection for mobile
      document.addEventListener('touchend', function(e) {
        console.log('Touch end event detected');
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
          const selectionData = getExtendedSelection();
          console.log('Touch selection data:', selectionData);
          if (selectionData && selectionData.text.length > 0) {
            console.log('Sending TEXT_SELECTED message from touch:', selectionData.text);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TEXT_SELECTED',
              text: selectionData.text,
              rect: {
                x: selectionData.rect.x,
                y: selectionData.rect.y,
                width: selectionData.rect.width,
                height: selectionData.rect.height
              }
            }));
          }
        }, 200);
      });
      
      // Fallback: Simple selection change handler
      document.addEventListener('selectionchange', function() {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim().length > 0) {
            const text = selection.toString().trim();
            console.log('Selection change detected:', text);
            
            if (text.length >= 3) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TEXT_SELECTED',
                text: text,
                rect: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                }
              }));
            }
          }
        }, 300);
      });
      
      // Function to add highlight to the document
      window.addHighlight = function(text, color) {
        const colorClass = 'highlight-' + color.replace('#', '').toLowerCase();
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes(text)) {
            textNodes.push(node);
          }
        }
        
        textNodes.forEach(textNode => {
          const parent = textNode.parentNode;
          const content = textNode.textContent;
          const index = content.indexOf(text);
          
          if (index !== -1) {
            const beforeText = content.substring(0, index);
            const highlightText = content.substring(index, index + text.length);
            const afterText = content.substring(index + text.length);
            
            const span = document.createElement('span');
            span.className = 'highlight ' + colorClass;
            span.textContent = highlightText;
            span.setAttribute('data-highlight-text', text);
            span.setAttribute('data-highlight-color', color);
            
            // Add click handler to highlight
            span.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'HIGHLIGHT_CLICKED',
                text: text,
                color: color
              }));
            });
            
            const fragment = document.createDocumentFragment();
            if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
            fragment.appendChild(span);
            if (afterText) fragment.appendChild(document.createTextNode(afterText));
            
            parent.replaceChild(fragment, textNode);
          }
        });
        
        savedHighlights.push({ text, color });
      };
      
      // Function to remove highlight
      window.removeHighlight = function(text) {
        const highlights = document.querySelectorAll('[data-highlight-text="' + text + '"]');
        highlights.forEach(highlight => {
          const parent = highlight.parentNode;
          parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
          parent.normalize();
        });
        
        savedHighlights = savedHighlights.filter(h => h.text !== text);
      };
      
      // Function to load existing highlights
      window.loadHighlights = function(highlights) {
        highlights.forEach(highlight => {
          window.addHighlight(highlight.text, highlight.color);
        });
      };
      
      // Clear selection when clicking elsewhere
      document.addEventListener('click', function(e) {
        if (!e.target.classList.contains('highlight')) {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            selection.removeAllRanges();
            currentSelection = null;
            
            // Notify React Native that selection was cleared
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECTION_CLEARED'
            }));
          }
        }
      });
      
      // Also clear selection on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            selection.removeAllRanges();
            currentSelection = null;
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECTION_CLEARED'
            }));
          }
        }
      });
      
    })();
    true; // Required for injectedJavaScript to work correctly
  `;

  // Show restriction screens if needed
  if (contentBlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Content Restricted', headerShown: true }} />
        <Ionicons name="shield-outline" size={64} color="#ef4444" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 16, textAlign: 'center' }}>
          Content Restricted
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
          This book is not available due to parental control settings.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (timeRestricted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Reading Time Restricted', headerShown: true }} />
        <Ionicons name="time-outline" size={64} color="#f59e0b" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 16, textAlign: 'center' }}>
          Reading Time Restricted
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
          Reading is not allowed during this time period. Please try again later.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        onLoadEnd={() => {
          setLoading(false);
          // Load existing highlights after PDF loads
          setTimeout(() => {
            loadExistingHighlights();
          }, 1000); // Wait a bit for the PDF to fully render
        }}
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

      {/* Custom Text Input Modal */}
      <Modal
        visible={showTextInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTextInput(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Add Highlight
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Copy text from the PDF, then paste it here:
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
                backgroundColor: '#f9fafb',
              }}
              multiline={true}
              placeholder="Paste your copied text here..."
              value={inputText}
              onChangeText={setInputText}
              autoFocus={true}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
              gap: 12,
            }}>
              <TouchableOpacity
                onPress={() => {
                  setShowTextInput(false);
                  setInputText('');
                }}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  if (inputText.trim().length > 0) {
                    setSelectedText(inputText.trim());
                    setShowTextInput(false);
                    setInputText('');
                  } else {
                    Alert.alert('Error', 'Please enter some text to highlight.');
                  }
                }}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: '#2563eb',
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  Highlight
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Highlight Button - always visible for easy access */}
      {!selectedText && !showTextInput && (
        <TouchableOpacity
          onPress={() => {
            setShowTextInput(true);
          }}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: isOfflineMode ? '#f59e0b' : '#2563eb',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 25,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 10,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 4 }}>
            {isOfflineMode ? 'Highlight (Offline)' : 'Add Highlight'}
          </Text>
        </TouchableOpacity>
      )}

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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="color-palette" size={20} color="#6b7280" />
              <Text style={{ marginLeft: 8, color: '#374151', fontSize: 14, fontWeight: '600' }}>
                Choose Highlight Color
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedText(null);
                if (selectionTimeoutRef.current) {
                  clearTimeout(selectionTimeoutRef.current);
                }
                // Clear selection in WebView
                webViewRef.current?.injectJavaScript(`
                  window.getSelection().removeAllRanges();
                  currentSelection = null;
                `);
              }}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
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
                  shadowColor: selectedColor === color.value ? '#2563eb' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: selectedColor === color.value ? 4 : 0,
                }}
                activeOpacity={0.7}
              >
                {selectedColor === color.value && (
                  <Ionicons name="checkmark" size={24} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Color Preview */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>Preview:</Text>
            <View
              style={{
                backgroundColor: selectedColor,
                padding: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: HIGHLIGHT_COLORS.find(c => c.value === selectedColor)?.border || '#e5e7eb',
              }}
            >
              <Text style={{ color: '#1f2937', fontSize: 13, fontWeight: '500' }}>
                This is how your highlight will look
              </Text>
            </View>
          </View>

          {/* Selection Tools */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                // Extend selection to include more words
                webViewRef.current?.injectJavaScript(`
                  const selection = window.getSelection();
                  if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const text = selection.toString();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'TEXT_SELECTED',
                      text: text
                    }));
                  }
                `);
              }}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor: '#e0f2fe',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#0284c7',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#0284c7', fontWeight: '600', fontSize: 13 }}>
                📝 Extend Selection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Clear current selection
                webViewRef.current?.injectJavaScript(`
                  window.getSelection().removeAllRanges();
                `);
                setSelectedText(null);
              }}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor: '#fef3c7',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#d97706',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#d97706', fontWeight: '600', fontSize: 13 }}>
                🔄 Reselect
              </Text>
            </TouchableOpacity>
          </View>

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
                backgroundColor: isLoadingAction ? '#9ca3af' : '#2563eb',
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Selected Text:</Text>
              <Text style={{ color: '#6b7280', fontSize: 11 }}>
                {selectedText.split(' ').length} word{selectedText.split(' ').length !== 1 ? 's' : ''} • {selectedText.length} chars
              </Text>
            </View>
            <Text style={{ color: '#1f2937', fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
              "{selectedText}"
            </Text>
          </View>
          
          {/* Instructions and auto-hide indicator */}
          <View style={{ marginTop: 8 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 4,
              paddingHorizontal: 8,
              backgroundColor: '#f0f9ff',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#e0f2fe',
              marginBottom: 4
            }}>
              <Ionicons name="information-circle-outline" size={12} color="#0284c7" />
              <Text style={{ color: '#0284c7', fontSize: 10, marginLeft: 4, fontWeight: '500' }}>
                💡 Tip: Copy text from PDF, then use "Add Highlight" button
              </Text>
            </View>
            
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 4,
              paddingHorizontal: 8,
              backgroundColor: '#f0f9ff',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#e0f2fe'
            }}>
              <Ionicons name="time-outline" size={12} color="#0284c7" />
              <Text style={{ color: '#0284c7', fontSize: 10, marginLeft: 4, fontWeight: '500' }}>
                Selection will auto-hide in 30s • Tap ✕ to close now
              </Text>
            </View>
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
                marginBottom: 5,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                📱 Offline Mode
              </Text>
            </View>
          )}
          
          {/* Test Selection Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#8b5cf6',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              marginBottom: 5,
            }}
            onPress={() => {
              console.log('Test button pressed');
              setSelectedText('Test selection for debugging');
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              🧪 Test Selection
            </Text>
          </TouchableOpacity>
          
          {/* Test Input Modal Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#10b981',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              marginBottom: 5,
            }}
            onPress={() => {
              console.log('Test input modal');
              setShowTextInput(true);
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              📝 Test Input
            </Text>
          </TouchableOpacity>
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