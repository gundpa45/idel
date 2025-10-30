import { AuthContext } from "@/context/AuthContext";
import { useParentalControls } from "@/context/ParentalControlContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";
import WebView from "react-native-webview";
import { API_BASE_URL } from "../config";

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef9c3", border: "#fde68a" },
  { name: "Green", value: "#d1fae5", border: "#a7f3d0" },
  { name: "Blue", value: "#dbeafe", border: "#bfdbfe" },
  { name: "Pink", value: "#fce7f3", border: "#fbcfe8" },
  { name: "Purple", value: "#e9d5ff", border: "#d8b4fe" },
  { name: "Orange", value: "#fed7aa", border: "#fdba74" },
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
  const [inputText, setInputText] = useState("");
  const [contentBlocked, setContentBlocked] = useState(false);
  const [timeRestricted, setTimeRestricted] = useState(false);
  const [currentReadingSession, setCurrentReadingSession] = useState<any>(null);
  const [isBookSaved, setIsBookSaved] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  const currentBookId = typeof bookId === "string" ? bookId : "";
  const currentTitle = typeof title === "string" ? title : "Unknown";

  // More robust user ID extraction with debugging
  const userId =
    authContext?.user?.id ||
    authContext?.user?._id ||
    authContext?.user?.userId;

  // Debug logging for authentication issues
  useEffect(() => {
    console.log("BookReader Auth Debug Info:", {
      hasAuthContext: !!authContext,
      hasUser: !!authContext?.user,
      hasToken: !!authContext?.token,
      userId: userId,
      userObject: authContext?.user,
      bookId: currentBookId,
      title: currentTitle,
    });
  }, [authContext, userId, currentBookId, currentTitle]);

  const originalUrl = typeof link === "string" ? link : "";

  // ✅ FIX 1: Robust URL handling to prevent downloads and display PDFs correctly.
  // This logic forces any compatible document link into Google's viewer.
  const finalUrl = originalUrl.includes("/preview") // Already a Google Drive preview link
    ? originalUrl
    : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(originalUrl)}`;

  // Helper function to get color name from hex value
  const getColorName = (hexColor: string): string => {
    const colorMap: { [key: string]: string } = {
      "#fef9c3": "yellow",
      "#d1fae5": "green",
      "#dbeafe": "blue",
      "#fce7f3": "pink",
      "#e9d5ff": "purple",
      "#fed7aa": "orange",
    };
    return colorMap[hexColor] || "yellow";
  };

  // Load existing highlights into the PDF
  const loadExistingHighlights = () => {
    if (highlights.length > 0 && webViewRef.current) {
      const highlightData = highlights.map((h) => ({
        text: h.text,
        color: getColorName(h.color || "#fef9c3"),
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
      checkIfBookSaved(); // Check if book is saved

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
    if (
      parentalControls &&
      typeof parentalControls.checkTimeRestrictions === "function"
    ) {
      // Check time restrictions
      const timeAllowed = parentalControls.checkTimeRestrictions();
      setTimeRestricted(!timeAllowed);

      // For content restrictions, we'd need book metadata
      // This is a placeholder - in real implementation, you'd fetch book metadata
      const mockBookMetadata: BookMetadata = {
        id: currentBookId,
        title: currentTitle,
        author: "Unknown",
        genre: ["Fiction"], // This would come from your book database
        ageRating: "12+",
        difficulty: "intermediate",
        topics: ["Adventure"],
        language: "English",
      };

      if (typeof parentalControls.checkContentRestrictions === "function") {
        const contentAllowed =
          parentalControls.checkContentRestrictions(mockBookMetadata);
        setContentBlocked(!contentAllowed);
      }
    }
  }, [currentBookId, currentTitle, parentalControls]);

  // Start reading session
  const startReadingSession = async () => {
    if (!authContext?.user || !authContext?.token) {
      console.log("No auth context, skipping reading session");
      return;
    }

    try {
      const sessionData = {
        userId: authContext.user.id,
        userName: authContext.user.name,
        bookId: currentBookId,
        bookTitle: currentTitle,
        startTime: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/reading-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authContext.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentReadingSession(session);
        console.log("Reading session started:", session);
      } else {
        console.log(
          "Reading session API not available, continuing without tracking"
        );
      }
    } catch (error) {
      console.log("Reading session will work when server is available");
      // Don't show error to user - this is optional functionality
    }
  };

  // End reading session
  const endReadingSession = async () => {
    if (!currentReadingSession || !authContext?.token) return;

    try {
      const endTime = new Date().toISOString();
      const duration = Math.round(
        (new Date(endTime).getTime() -
          new Date(currentReadingSession.startTime).getTime()) /
          60000
      );

      const updateData = {
        endTime,
        duration,
        status: "completed",
      };

      const response = await fetch(
        `${API_BASE_URL}/reading-sessions/${currentReadingSession._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authContext.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        console.log("Reading session ended:", duration, "minutes");
        setCurrentReadingSession(null);
      }
    } catch (error) {
      console.log("Reading session sync will happen when server is available");
      setCurrentReadingSession(null);
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
            Authorization: `Bearer ${authContext?.token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error("Failed to fetch highlights");
      const data = await response.json();
      setHighlights(data);
    } catch (error) {
      // Silently handle network errors - app works offline
      console.log(
        "Working in offline mode - highlights will be stored locally when server is available"
      );
      setIsOfflineMode(true);
      // Don't log the full error to avoid console spam
    }
  };

  // 📊 Fetch or create book stats
  const fetchOrCreateBookStats = async () => {
    if (!userId || !currentBookId || !authContext?.token) {
      console.log("Skipping book stats - no auth or book info");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/stats?userId=${userId}&bookId=${currentBookId}`,
        {
          headers: {
            Authorization: `Bearer ${authContext.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookStats(data);
        console.log("Book stats loaded successfully");
      } else {
        // Create new stats if not found
        const createResponse = await fetch(`${API_BASE_URL}/stats`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authContext.token}`,
            "Content-Type": "application/json",
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
          console.log("Book stats created successfully");
        }
      }
    } catch (error) {
      console.log("Book stats will sync when server is available");
      // Don't log full error to avoid console spam
    }
  };

  // 🔄 Update book stats (last read time)
  const updateBookStats = async () => {
    if (!userId || !currentBookId || !authContext?.token) return;

    try {
      await fetch(`${API_BASE_URL}/stats`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authContext.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          bookId: currentBookId,
          lastReadAt: new Date().toISOString(),
          highlightsCount: highlights.length,
        }),
      });
    } catch (error) {
      console.log("Book stats update will sync when server is available");
    }
  };

  // 📚 Check if book is saved
  const checkIfBookSaved = async () => {
    if (!authContext?.token || !currentBookId) {
      setIsBookSaved(false);
      return;
    }

    try {
      const saved = await checkBookSaved(authContext.token, currentBookId);
      setIsBookSaved(saved);
    } catch (error) {
      console.log("Could not check book save status");
      setIsBookSaved(false);
    }
  };

  // 💾 Save/Unsave book
  const toggleSaveBook = async () => {
    if (!authContext?.token) {
      Alert.alert(
        "Login Required",
        "Please login to save books and sync across devices",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    setSavingBook(true);

    try {
      if (isBookSaved) {
        // Remove from saved
        await removeSavedBook(authContext.token, currentBookId);
        setIsBookSaved(false);
        Alert.alert("Removed", "Book removed from your reading list");
      } else {
        // Add to saved - we need to get book info from somewhere
        const bookData = {
          bookId: currentBookId,
          bookTitle: currentTitle,
          bookAuthor: "Unknown Author", // We don't have this info in BookReader
          bookYear: new Date().getFullYear().toString(),
          bookStar: "4.0",
          bookImage: "https://via.placeholder.com/300x400", // Placeholder image
        };

        await saveBook(authContext.token, bookData);
        setIsBookSaved(true);
        Alert.alert("Saved!", "Book added to your reading list");
      }
    } catch (error) {
      console.error("Error saving book:", error);
      Alert.alert("Error", error.message || "Failed to save book");
    } finally {
      setSavingBook(false);
    }
  };

  // 💾 Save a new highlight (works offline and online)
  const handleSaveHighlight = async (
    highlightText: string,
    color: string = selectedColor
  ) => {
    // Basic validation
    if (!highlightText.trim()) {
      Alert.alert("Error", "Please select some text to highlight.");
      return;
    }

    setIsLoadingAction(true);

    // Create highlight object
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text: highlightText,
      bookId: currentBookId,
      bookTitle: currentTitle,
      userId: userId?.toString() || "offline-user",
      color,
      createdAt: new Date().toISOString(),
    };

    // Add highlight immediately (works offline)
    setHighlights((prev) => [newHighlight, ...prev]);
    setLocalHighlights((prev) => [newHighlight, ...prev]);
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
          method: "POST",
          headers: {
            Authorization: `Bearer ${authContext.token}`,
            "Content-Type": "application/json",
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
          setHighlights((prev) =>
            prev.map((h) =>
              h.id === newHighlight.id
                ? { ...savedHighlight, id: savedHighlight.id }
                : h
            )
          );
          console.log("Highlight synced to server");
        }
      } catch (error) {
        console.log("Could not sync to server, keeping local copy");
      }
    }

    setIsLoadingAction(false);

    // Show appropriate success message
    if (isOfflineMode) {
      Alert.alert(
        "✅ Highlight Saved Offline!",
        "Your highlight has been saved locally and will sync when you're back online.",
        [{ text: "OK", style: "default" }]
      );
    } else if (authContext?.user) {
      Alert.alert(
        "✅ Highlight Saved!",
        "Your highlight has been saved and synced to your account.",
        [{ text: "OK", style: "default" }]
      );
    } else {
      Alert.alert(
        "✅ Highlight Saved Locally!",
        "Your highlight has been saved locally. Sign in to sync across devices.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  // ❌ Remove a highlight with optimistic update
  const handleRemoveHighlight = async (item: Highlight) => {
    // Optimistic update
    const previousHighlights = [...highlights];
    setHighlights((prev) => prev.filter((h) => h.id !== item.id));

    try {
      const response = await fetch(`${API_BASE_URL}/highlights/${item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authContext?.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      // Remove visual highlight from PDF
      webViewRef.current?.injectJavaScript(`
        window.removeHighlight("${item.text.replace(/"/g, '\\"')}");
      `);

      // Update book stats
      fetchOrCreateBookStats();
    } catch (error) {
      console.error("Error removing highlight:", error);
      // Rollback on error
      setHighlights(previousHighlights);
      Alert.alert("Error", "Could not remove highlight. Please try again.");
    }
  };

  // 🎯 Jump to a highlight in the PDF
  const jumpToHighlight = (id: string) => {
    const highlight = highlights.find((h) => h.id === id);
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

      if (msg.type === "TEXT_SELECTED" && msg.text) {
        // Clear any existing timeout
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }

        // Show highlight toolbar for any meaningful text selection
        const trimmedText = msg.text.trim();
        const wordCount = trimmedText.split(/\s+/).length;

        // More lenient criteria: at least 1 word and 3 characters
        if (trimmedText.length >= 3 && wordCount >= 1) {
          console.log("Text selected for highlighting:", trimmedText);
          setSelectedText(trimmedText);

          // Auto-hide selection after 30 seconds of inactivity
          selectionTimeoutRef.current = setTimeout(() => {
            setSelectedText(null);
          }, 30000);
        } else {
          console.log(
            "Text selection too short, not showing highlight toolbar:",
            trimmedText
          );
        }
      } else if (msg.type === "SELECTION_CLEARED") {
        setSelectedText(null);
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
      } else if (msg.type === "HIGHLIGHT_CLICKED") {
        // Handle highlight click - could show options to edit or remove
        const highlight = highlights.find((h) => h.text === msg.text);
        if (highlight) {
          Alert.alert(
            "Highlight Options",
            `"${msg.text.substring(0, 50)}${msg.text.length > 50 ? "..." : ""}"`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => handleRemoveHighlight(highlight),
              },
              {
                text: "Jump to Sidebar",
                onPress: () => {
                  setSidebarOpen(true);
                  // Could scroll to this highlight in the sidebar
                },
              },
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
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Stack.Screen
          options={{ title: "Content Restricted", headerShown: true }}
        />
        <Ionicons name="shield-outline" size={64} color="#ef4444" />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#1f2937",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Content Restricted
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#6b7280",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          This book is not available due to parental control settings.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (timeRestricted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Stack.Screen
          options={{ title: "Reading Time Restricted", headerShown: true }}
        />
        <Ionicons name="time-outline" size={64} color="#f59e0b" />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#1f2937",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Reading Time Restricted
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#6b7280",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Reading is not allowed during this time period. Please try again
          later.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f23" }}>
      <Stack.Screen
        options={{
          title: (title as string) || "Book Reader",
          headerShown: false, // We'll create our own custom header
        }}
      />

      {/* Custom Professional Header */}
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 20,
          paddingBottom: 15,
          backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              padding: 12,
              borderRadius: 15,
              backdropFilter: "blur(10px)",
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 15 }}>
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {currentTitle}
            </Text>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: 12,
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {highlights.length} highlights • Reading mode
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Save Book Button */}
            <TouchableOpacity
              onPress={toggleSaveBook}
              disabled={savingBook}
              style={{
                backgroundColor: isBookSaved
                  ? "rgba(34, 197, 94, 0.8)"
                  : "rgba(0, 0, 0, 0.7)",
                padding: 12,
                borderRadius: 15,
                backdropFilter: "blur(10px)",
              }}
              activeOpacity={0.8}
            >
              {savingBook ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons
                  name={isBookSaved ? "heart" : "heart-outline"}
                  size={24}
                  color={isBookSaved ? "#22c55e" : "white"}
                />
              )}
            </TouchableOpacity>

            {/* Highlights Sidebar Button */}
            <TouchableOpacity
              onPress={toggleSidebar}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: 12,
                borderRadius: 15,
                backdropFilter: "blur(10px)",
                position: "relative",
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="bookmark" size={24} color="white" />
              {highlights.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    backgroundColor: "#ff6b6b",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "white",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
                  >
                    {highlights.length > 99 ? "99+" : highlights.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Reading Progress Bar */}
        <View
          style={{
            marginTop: 15,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#4ade80",
              height: "100%",
              width: "35%", // This would be dynamic based on reading progress
              borderRadius: 3,
            }}
          />
        </View>
        <Text
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 11,
            textAlign: "center",
            marginTop: 5,
          }}
        >
          Reading Progress: 35%
        </Text>
      </View>

      {/* Enhanced Loading Screen */}
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15, 15, 35, 0.95)",
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: 40,
              borderRadius: 25,
              alignItems: "center",
              backdropFilter: "blur(20px)",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(102, 126, 234, 0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <ActivityIndicator size="large" color="#667eea" />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Loading Your Book
            </Text>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Preparing the best reading experience...
            </Text>
          </View>
        </View>
      )}

      {/* Enhanced WebView Container */}
      <View
        style={{
          flex: 1,
          margin: 15,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
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
            Alert.alert(
              "Error",
              "Failed to load the document. Please check the link."
            );
          }}
          onHttpError={() => {
            setLoading(false);
            Alert.alert(
              "Error",
              "A network error occurred while trying to load the document."
            );
          }}
          injectedJavaScript={injectedJavaScript}
          onMessage={onMessage}
          style={{
            flex: 1,
            opacity: loading ? 0 : 1,
            borderRadius: 20,
          }}
        />
      </View>

      {/* Ultra-Modern Text Input Modal */}
      <Modal
        visible={showTextInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTextInput(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 15, 35, 0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 30,
              padding: 30,
              width: "100%",
              maxWidth: 400,
              shadowColor: "#667eea",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.3,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <View
                style={{
                  backgroundColor: "#667eea",
                  padding: 15,
                  borderRadius: 20,
                  marginBottom: 15,
                }}
              >
                <Ionicons name="create-outline" size={28} color="white" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: 8,
                }}
              >
                Create Highlight
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Copy text from the PDF and paste it here to create a highlight
              </Text>
            </View>

            {/* Enhanced Text Input */}
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "#e2e8f0",
                marginBottom: 25,
              }}
            >
              <TextInput
                style={{
                  padding: 20,
                  fontSize: 16,
                  minHeight: 120,
                  textAlignVertical: "top",
                  color: "#1f2937",
                  lineHeight: 24,
                }}
                multiline={true}
                placeholder="Paste your copied text here..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                autoFocus={true}
              />
              {inputText.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 15,
                    backgroundColor: "#667eea",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {inputText.split(" ").length} words
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 15,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowTextInput(false);
                  setInputText("");
                }}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: "#64748b",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (inputText.trim().length > 0) {
                    setSelectedText(inputText.trim());
                    setShowTextInput(false);
                    setInputText("");
                  } else {
                    Alert.alert(
                      "Error",
                      "Please enter some text to highlight."
                    );
                  }
                }}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: "#667eea",
                  alignItems: "center",
                  shadowColor: "#667eea",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="bookmark" size={18} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    Create Highlight
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Professional Floating Action Buttons */}
      {!selectedText && !showTextInput && (
        <View
          style={{
            position: "absolute",
            bottom: 30,
            right: 20,
            alignItems: "center",
            zIndex: 10,
          }}
        >
          {/* Main Highlight Button */}
          <TouchableOpacity
            onPress={() => setShowTextInput(true)}
            style={{
              backgroundColor: isOfflineMode ? "#f59e0b" : "#667eea",
              width: 65,
              height: 65,
              borderRadius: 32.5,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: isOfflineMode ? "#f59e0b" : "#667eea",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 15,
              elevation: 10,
              marginBottom: 15,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>

          {/* Secondary Action Buttons */}
          <View style={{ alignItems: "center", gap: 12 }}>
            {/* Quick Highlight Button */}
            <TouchableOpacity
              onPress={() => {
                // Quick highlight with default color
                if (selectedText) {
                  handleSaveHighlight(selectedText);
                } else {
                  setShowTextInput(true);
                }
              }}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="bookmark-outline" size={22} color="#667eea" />
            </TouchableOpacity>

            {/* Reading Settings Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Reading Settings",
                  "Adjust your reading preferences",
                  [
                    { text: "Font Size", onPress: () => {} },
                    { text: "Night Mode", onPress: () => {} },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              }}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={22} color="#667eea" />
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          <View
            style={{
              backgroundColor: isOfflineMode ? "#f59e0b" : "#10b981",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 15,
              marginTop: 15,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {isOfflineMode ? "📱 Offline" : "☁️ Synced"}
            </Text>
          </View>
        </View>
      )}

      {/* Ultra-Modern Highlight Toolbar */}
      {selectedText && (
        <>
          {/* Dark Backdrop */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 5,
            }}
          />

          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#1a1a2e",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 25,
              shadowColor: "#667eea",
              shadowOpacity: 0.3,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -8 },
              elevation: 15,
              zIndex: 10,
            }}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    padding: 8,
                    borderRadius: 12,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="color-palette" size={20} color="white" />
                </View>
                <View>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Create Highlight
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 12,
                    }}
                  >
                    Choose your highlight style
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedText(null);
                  if (selectionTimeoutRef.current) {
                    clearTimeout(selectionTimeoutRef.current);
                  }
                  webViewRef.current?.injectJavaScript(`
                  window.getSelection().removeAllRanges();
                  currentSelection = null;
                `);
                }}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  padding: 10,
                  borderRadius: 15,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="color-palette" size={20} color="#6b7280" />
                <Text
                  style={{
                    marginLeft: 8,
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
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
                  backgroundColor: "#f3f4f6",
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Enhanced Color Picker */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                Highlight Colors
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {HIGHLIGHT_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={color.value}
                    onPress={() => setSelectedColor(color.value)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: color.value,
                      marginRight: 15,
                      borderWidth: selectedColor === color.value ? 4 : 2,
                      borderColor:
                        selectedColor === color.value
                          ? "white"
                          : "rgba(0, 0, 0, 0.8)",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: color.value,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: selectedColor === color.value ? 0.6 : 0.3,
                      shadowRadius: 8,
                      elevation: selectedColor === color.value ? 8 : 4,
                      transform: [
                        { scale: selectedColor === color.value ? 1.1 : 1 },
                      ],
                    }}
                    activeOpacity={0.8}
                  >
                    {selectedColor === color.value && (
                      <View
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          borderRadius: 15,
                          padding: 4,
                        }}
                      >
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                    )}
                    <Text
                      style={{
                        position: "absolute",
                        bottom: -25,
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: 10,
                        fontWeight: "500",
                        textAlign: "center",
                      }}
                    >
                      {color.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Preview */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
                Preview:
              </Text>
              <View
                style={{
                  backgroundColor: selectedColor,
                  padding: 8,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor:
                    HIGHLIGHT_COLORS.find((c) => c.value === selectedColor)
                      ?.border || "#e5e7eb",
                }}
              >
                <Text
                  style={{ color: "#1f2937", fontSize: 13, fontWeight: "500" }}
                >
                  This is how your highlight will look
                </Text>
              </View>
            </View>

            {/* Selection Tools */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
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
                  backgroundColor: "#e0f2fe",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#0284c7",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{ color: "#0284c7", fontWeight: "600", fontSize: 13 }}
                >
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
                  backgroundColor: "#fef3c7",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#d97706",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{ color: "#d97706", fontWeight: "600", fontSize: 13 }}
                >
                  🔄 Reselect
                </Text>
              </TouchableOpacity>
            </View>

            {/* Modern Action Buttons */}
            <View style={{ flexDirection: "row", gap: 15, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setSelectedText(null)}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.5)",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSaveHighlight(selectedText, selectedColor)}
                disabled={isLoadingAction}
                style={{
                  flex: 2,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: isLoadingAction
                    ? "rgba(102, 126, 234, 0.7)"
                    : "#667eea",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                activeOpacity={0.8}
              >
                {isLoadingAction ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="bookmark" size={20} color="white" />
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginLeft: 10,
                      }}
                    >
                      Save Highlight
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Enhanced Selected Text Preview */}
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 12,
                      fontWeight: "600",
                      marginLeft: 6,
                    }}
                  >
                    Selected Text
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: 10,
                      fontWeight: "500",
                    }}
                  >
                    {selectedText.split(" ").length} words •{" "}
                    {selectedText.length} chars
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: selectedColor,
                  borderRadius: 12,
                  padding: 15,
                  borderWidth: 1,
                  borderColor:
                    HIGHLIGHT_COLORS.find((c) => c.value === selectedColor)
                      ?.border || "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    color: "#1f2937",
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: "500",
                  }}
                  numberOfLines={4}
                >
                  "{selectedText}"
                </Text>
              </View>
            </View>

            {/* Instructions and auto-hide indicator */}
            <View style={{ marginTop: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  backgroundColor: "#f0f9ff",
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#e0f2fe",
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={12}
                  color="#0284c7"
                />
                <Text
                  style={{
                    color: "#0284c7",
                    fontSize: 10,
                    marginLeft: 4,
                    fontWeight: "500",
                  }}
                >
                  💡 Tip: Copy text from PDF, then use "Add Highlight" button
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  backgroundColor: "#f0f9ff",
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#e0f2fe",
                }}
              >
                <Ionicons name="time-outline" size={12} color="#0284c7" />
                <Text
                  style={{
                    color: "#0284c7",
                    fontSize: 10,
                    marginLeft: 4,
                    fontWeight: "500",
                  }}
                >
                  Selection will auto-hide in 30s • Tap ✕ to close now
                </Text>
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* Status Indicators */}
      {__DEV__ && (
        <View style={{ position: "absolute", top: 60, left: 15, zIndex: 5 }}>
          {/* Auth Status */}
          <View
            style={{
              backgroundColor: authContext?.user ? "#10b981" : "#ef4444",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              marginBottom: 5,
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
              {authContext?.user
                ? `✓ ${authContext.user.name || "User"}`
                : "✗ Not logged in"}
            </Text>
          </View>

          {/* Network Status */}
          {isOfflineMode && (
            <View
              style={{
                backgroundColor: "#f59e0b",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
                marginBottom: 5,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 12, fontWeight: "bold" }}
              >
                📱 Offline Mode
              </Text>
            </View>
          )}

          {/* Test Selection Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#8b5cf6",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              marginBottom: 5,
            }}
            onPress={() => {
              console.log("Test button pressed");
              setSelectedText("Test selection for debugging");
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
              🧪 Test Selection
            </Text>
          </TouchableOpacity>

          {/* Test Input Modal Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#10b981",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              marginBottom: 5,
            }}
            onPress={() => {
              console.log("Test input modal");
              setShowTextInput(true);
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
              📝 Test Input
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Button to toggle the highlights sidebar */}
      <TouchableOpacity
        onPress={toggleSidebar}
        style={{
          position: "absolute",
          top: 10,
          right: 15,
          backgroundColor: "#111827",
          paddingHorizontal: 15,
          paddingVertical: 10,
          borderRadius: 20,
          zIndex: 5,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {isSidebarOpen ? "Close" : "Highlights"}
        </Text>
      </TouchableOpacity>

      {/* Ultra-Modern Highlights Sidebar */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: Dimensions.get("window").width * 0.85,
          backgroundColor: "#1e293b",
          borderTopLeftRadius: 25,
          borderBottomLeftRadius: 25,
          shadowColor: "#000",
          shadowOffset: { width: -8, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
          transform: [
            {
              translateX: sidebarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get("window").width, 0],
              }),
            },
          ],
        }}
      >
        {/* Sidebar Header */}
        <View
          style={{
            paddingTop: 60,
            paddingHorizontal: 25,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 4,
                }}
              >
                My Highlights
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                {highlights.length} highlight
                {highlights.length !== 1 ? "s" : ""} in this book
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleSidebar}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: 12,
                borderRadius: 15,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#111827",
            marginBottom: 8,
            marginTop: 40, // Avoid overlapping with header/status bar
          }}
        >
          My Highlights
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 12,
          }}
        >
          {highlights.length} highlight{highlights.length !== 1 ? "s" : ""} in{" "}
          {currentTitle}
        </Text>

        {/* Highlights Content */}
        <View style={{ flex: 1, paddingHorizontal: 25, paddingTop: 20 }}>
          {highlights.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: 30,
                  borderRadius: 25,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={48}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </View>
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 18,
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                No Highlights Yet
              </Text>
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Start highlighting important passages to build your personal
                study notes
              </Text>
            </View>
          ) : (
            <FlatList
              data={highlights}
              keyExtractor={(item) =>
                item.id?.toString() || `${item.text}-${Math.random()}`
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item, index }) => {
                const colorConfig =
                  HIGHLIGHT_COLORS.find((c) => c.value === item.color) ||
                  HIGHLIGHT_COLORS[0];
                return (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: 20,
                      padding: 20,
                      marginBottom: 15,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Highlight Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: item.color || "#fef9c3",
                          marginRight: 10,
                        }}
                      />
                      <Text
                        style={{
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        Highlight #{highlights.length - index}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text
                        style={{
                          color: "rgba(255, 255, 255, 0.5)",
                          fontSize: 11,
                        }}
                      >
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* Highlight Content */}
                    <TouchableOpacity
                      onPress={() => jumpToHighlight(item.id)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: item.color || "#fef9c3",
                        borderRadius: 15,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: colorConfig.border,
                      }}
                    >
                      <Text
                        style={{
                          color: "#1f2937",
                          fontSize: 14,
                          lineHeight: 20,
                          fontWeight: "500",
                        }}
                      >
                        "{item.text}"
                      </Text>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => jumpToHighlight(item.id)}
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(102, 126, 234, 0.8)",
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderRadius: 12,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "rgba(102, 126, 234, 0.3)",
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: "#667eea",
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          📍 Jump to Text
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemoveHighlight(item)}
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.8)",
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderRadius: 12,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "rgba(239, 68, 68, 0.3)",
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: "#ef4444",
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          🗑️ Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export default BookReaderScreen;
