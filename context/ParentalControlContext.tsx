import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

interface ParentalControlContextType {
  // User Management
  children: User[];
  currentChild: User | null;
  setCurrentChild: (child: User | null) => void;
  
  // Reading Sessions
  currentSession: ReadingSession | null;
  startReadingSession: (bookId: string, bookTitle: string) => Promise<void>;
  endReadingSession: () => Promise<void>;
  
  // Recommendations
  recommendations: BookRecommendation[];
  createRecommendation: (recommendation: Omit<BookRecommendation, 'id' | 'createdAt'>) => Promise<void>;
  updateRecommendationStatus: (id: string, status: BookRecommendation['status']) => Promise<void>;
  
  // Reports
  generateReport: (childId: string, type: ParentalReport['reportType']) => Promise<ParentalReport>;
  getReports: (childId: string) => Promise<ParentalReport[]>;
  
  // Restrictions
  checkContentRestrictions: (bookMetadata: BookMetadata) => boolean;
  checkTimeRestrictions: () => boolean;
  
  // Analytics
  getReadingStats: (childId: string, period?: { start: string; end: string }) => Promise<any>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

export const ParentalControlContext = createContext<ParentalControlContextType | null>(null);

export const ParentalControlProvider = ({ children }: { children: ReactNode }) => {
  const authContext = useContext(AuthContext);
  const [childrenList, setChildrenList] = useState<User[]>([]);
  const [currentChild, setCurrentChild] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<ReadingSession | null>(null);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load children and data when user changes
  useEffect(() => {
    if (authContext?.user && authContext.user.accountType === 'parent') {
      // Use children data from auth context if available (from login)
      if (authContext.user.children) {
        setChildrenList(authContext.user.children);
      } else {
        // Fallback to demo children data
        const demoChildren = [
          { id: 'child1', name: 'Emma', email: 'emma@family.com' },
          { id: 'child2', name: 'Alex', email: 'alex@family.com' }
        ];
        setChildrenList(demoChildren);
      }
      
      // Load demo recommendations
      const demoRecommendations = [
        {
          id: 'rec1',
          bookTitle: 'Harry Potter and the Philosopher\'s Stone',
          recommendedFor: 'child1',
          recommendedBy: authContext.user.id,
          reason: 'Perfect for your reading level!',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      setRecommendations(demoRecommendations);
    }
  }, [authContext?.user]);

  // Auto-save current session
  useEffect(() => {
    const saveSession = async () => {
      if (currentSession) {
        await AsyncStorage.setItem('currentReadingSession', JSON.stringify(currentSession));
      } else {
        await AsyncStorage.removeItem('currentReadingSession');
      }
    };
    saveSession();
  }, [currentSession]);

  // Load children data (offline version)
  const loadChildrenData = async () => {
    if (!authContext?.user || authContext.user.accountType !== 'parent') return;
    
    setLoading(true);
    try {
      // Use children from auth context or demo data
      let children = [];
      if (authContext.user.children) {
        children = authContext.user.children;
      } else {
        children = [
          { id: 'child1', name: 'Emma', email: 'emma@family.com' },
          { id: 'child2', name: 'Alex', email: 'alex@family.com' }
        ];
      }
      
      setChildrenList(children);
      
      // Load saved current child
      const savedChild = await AsyncStorage.getItem('currentChild');
      if (savedChild) {
        const child = JSON.parse(savedChild);
        const foundChild = children.find((c: User) => c.id === child.id);
        if (foundChild) setCurrentChild(foundChild);
      }
    } catch (err) {
      console.log('Using demo children data');
      // Fallback to demo data
      const demoChildren = [
        { id: 'child1', name: 'Emma', email: 'emma@family.com' },
        { id: 'child2', name: 'Alex', email: 'alex@family.com' }
      ];
      setChildrenList(demoChildren);
    } finally {
      setLoading(false);
    }
  };

  // Load recommendations (offline version)
  const loadRecommendations = async () => {
    if (!authContext?.user) return;
    
    try {
      // Use demo recommendations
      const demoRecommendations = [
        {
          id: 'rec1',
          bookId: 'book1',
          bookTitle: 'Harry Potter and the Philosopher\'s Stone',
          recommendedFor: 'child1',
          recommendedBy: authContext.user.id,
          reason: 'Perfect for your reading level and interests!',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'rec2',
          bookId: 'book2',
          bookTitle: 'The Chronicles of Narnia',
          recommendedFor: 'child2',
          recommendedBy: authContext.user.id,
          reason: 'Great fantasy adventure series!',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      setRecommendations(demoRecommendations);
    } catch (err) {
      console.log('Using demo recommendations');
      setRecommendations([]);
    }
  };

  // Start reading session (offline version)
  const startReadingSession = async (bookId: string, bookTitle: string) => {
    const userId = currentChild?.id || authContext?.user?.id;
    if (!userId) return;

    const session: ReadingSession = {
      id: `session-${Date.now()}`,
      userId,
      bookId,
      bookTitle,
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setCurrentSession(session);
    console.log('Reading session started (offline):', bookTitle);
  };

  // End reading session (offline version)
  const endReadingSession = async () => {
    if (!currentSession) return;

    const endTime = new Date().toISOString();
    const duration = Math.round((new Date(endTime).getTime() - new Date(currentSession.startTime).getTime()) / 60000);

    console.log('Reading session ended (offline):', currentSession.bookTitle, duration, 'minutes');
    setCurrentSession(null);
  };

  // Create recommendation (offline version)
  const createRecommendation = async (recommendation: Omit<BookRecommendation, 'id' | 'createdAt'>) => {
    const newRecommendation: BookRecommendation = {
      ...recommendation,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setRecommendations(prev => [newRecommendation, ...prev]);
    console.log('Recommendation created (offline):', newRecommendation.bookTitle);
  };

  // Update recommendation status (offline version)
  const updateRecommendationStatus = async (id: string, status: BookRecommendation['status']) => {
    setRecommendations(prev => 
      prev.map(rec => rec.id === id ? { ...rec, status } : rec)
    );
    console.log('Recommendation status updated (offline):', id, status);
  };

  // Check content restrictions
  const checkContentRestrictions = (bookMetadata: BookMetadata): boolean => {
    const user = currentChild || authContext?.user;
    if (!user?.preferences?.restrictions) return true;

    const restrictions = user.preferences.restrictions;

    // Check age rating
    if (bookMetadata.ageRating) {
      const ageLimit = parseInt(bookMetadata.ageRating.replace('+', ''));
      const userAge = user.dateOfBirth ? 
        Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 18;
      
      if (userAge < ageLimit) return false;
    }

    // Check blocked genres
    if (restrictions.blockedGenres?.length) {
      const hasBlockedGenre = bookMetadata.genre.some(genre => 
        restrictions.blockedGenres!.includes(genre)
      );
      if (hasBlockedGenre) return false;
    }

    // Check allowed genres (if specified)
    if (restrictions.allowedGenres?.length) {
      const hasAllowedGenre = bookMetadata.genre.some(genre => 
        restrictions.allowedGenres!.includes(genre)
      );
      if (!hasAllowedGenre) return false;
    }

    return true;
  };

  // Check time restrictions
  const checkTimeRestrictions = (): boolean => {
    const user = currentChild || authContext?.user;
    if (!user?.preferences?.restrictions?.bedtimeRestriction?.enabled) return true;

    const bedtime = user.preferences.restrictions.bedtimeRestriction;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = parseInt(bedtime.startTime.split(':')[0]) * 60 + parseInt(bedtime.startTime.split(':')[1]);
    const endTime = parseInt(bedtime.endTime.split(':')[0]) * 60 + parseInt(bedtime.endTime.split(':')[1]);

    // Handle overnight restrictions
    if (startTime > endTime) {
      return !(currentTime >= startTime || currentTime <= endTime);
    } else {
      return !(currentTime >= startTime && currentTime <= endTime);
    }
  };

  // Generate report (offline version)
  const generateReport = async (childId: string, type: ParentalReport['reportType']): Promise<ParentalReport> => {
    // Return demo report
    const demoReport: ParentalReport = {
      id: `report-${Date.now()}`,
      childId,
      parentId: authContext?.user?.id || 'parent1',
      reportType: type,
      period: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      stats: {
        totalReadingTime: 120, // 2 hours
        booksCompleted: 2,
        averageSessionLength: 30,
        favoriteGenres: ['Fantasy', 'Adventure'],
        readingStreak: 5,
        highlightsCreated: 15
      },
      recommendations: [],
      achievements: ['Read 5 days in a row!', 'Completed 2 books this week'],
      createdAt: new Date().toISOString()
    };
    
    console.log('Report generated (offline):', type);
    return demoReport;
  };

  // Get reports (offline version)
  const getReports = async (childId: string): Promise<ParentalReport[]> => {
    // Return demo reports
    const demoReports: ParentalReport[] = [
      {
        id: 'report1',
        childId,
        parentId: authContext?.user?.id || 'parent1',
        reportType: 'weekly',
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        stats: {
          totalReadingTime: 180,
          booksCompleted: 3,
          averageSessionLength: 35,
          favoriteGenres: ['Fantasy', 'Mystery'],
          readingStreak: 7,
          highlightsCreated: 22
        },
        recommendations: [],
        achievements: ['Week reading champion!'],
        createdAt: new Date().toISOString()
      }
    ];
    
    console.log('Reports fetched (offline)');
    return demoReports;
  };

  // Get reading stats (offline version)
  const getReadingStats = async (childId: string, period?: { start: string; end: string }) => {
    // Return demo stats
    const demoStats = {
      todayMinutes: 45,
      todayPages: 12,
      todayHighlights: 3,
      weeklyMinutes: 180,
      weeklyBooks: 2,
      weeklyProgress: 75,
      booksThisWeek: 2,
      readingStreak: 5,
      averageSession: 30,
      favoriteGenres: ['Fantasy', 'Adventure', 'Mystery'],
      recentSessions: [
        {
          bookTitle: 'Harry Potter',
          startTime: new Date().toISOString(),
          duration: 45
        },
        {
          bookTitle: 'Charlotte\'s Web',
          startTime: new Date(Date.now() - 86400000).toISOString(),
          duration: 30
        }
      ],
      recentAchievements: [
        'Read 5 days in a row!',
        'Completed first chapter of Harry Potter'
      ]
    };
    
    console.log('Reading stats fetched (offline)');
    return demoStats;
  };

  // Set current child and save to storage
  const setCurrentChildWithStorage = async (child: User | null) => {
    setCurrentChild(child);
    if (child) {
      await AsyncStorage.setItem('currentChild', JSON.stringify(child));
    } else {
      await AsyncStorage.removeItem('currentChild');
    }
  };

  return (
    <ParentalControlContext.Provider value={{
      children: childrenList,
      currentChild,
      setCurrentChild: setCurrentChildWithStorage,
      currentSession,
      startReadingSession,
      endReadingSession,
      recommendations,
      createRecommendation,
      updateRecommendationStatus,
      generateReport,
      getReports,
      checkContentRestrictions,
      checkTimeRestrictions,
      getReadingStats,
      loading,
      error,
    }}>
      {children}
    </ParentalControlContext.Provider>
  );
};

// Custom hook for using parental controls
export const useParentalControls = () => {
  const context = useContext(ParentalControlContext);
  if (!context) {
    // Instead of throwing an error, return a mock object for graceful degradation
    console.warn('useParentalControls used outside of ParentalControlProvider, returning mock object');
    return {
      children: [],
      currentChild: null,
      setCurrentChild: () => {},
      currentSession: null,
      startReadingSession: () => Promise.resolve(),
      endReadingSession: () => Promise.resolve(),
      recommendations: [],
      createRecommendation: () => Promise.resolve(),
      updateRecommendationStatus: () => Promise.resolve(),
      generateReport: () => Promise.resolve({} as ParentalReport),
      getReports: () => Promise.resolve([]),
      checkContentRestrictions: () => true,
      checkTimeRestrictions: () => true,
      getReadingStats: () => Promise.resolve({}),
      loading: false,
      error: null,
    };
  }
  return context;
};