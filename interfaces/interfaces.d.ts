interface Movie {
  id: number;
  title: string;
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface TrendingMovie {
  searchTerm: string;
  movie_id: number;
  title: string;
  count: number;
  poster_url: string;
}

interface MovieDetails {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
  } | null;
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  original_language: string;
  original_title: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface TrendingCardProps {
  movie: TrendingMovie;
  index: number;
}

interface Highlight {
  id: string | number;
  text: string;
  bookId: string | number;
  bookTitle: string;
  userId: string | number;
  color?: string;
  page?: number;
  createdAt: string;
  updatedAt?: string;
}

interface BookStats {
  bookId: string | number;
  userId: string | number;
  currentPage?: number;
  totalPages?: number;
  progress?: number;
  lastReadAt: string;
  highlightsCount: number;
  notesCount?: number;
}

// Parental Control Interfaces
interface User {
  id: string | number;
  name: string;
  email: string;
  dateOfBirth?: string;
  accountType: 'child' | 'parent' | 'adult';
  parentId?: string | number;
  children?: User[];
  createdAt: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  readingGoals?: {
    dailyMinutes?: number;
    weeklyBooks?: number;
    preferredGenres?: string[];
  };
  restrictions?: {
    allowedGenres?: string[];
    blockedGenres?: string[];
    maxReadingTime?: number; // minutes per day
    bedtimeRestriction?: {
      enabled: boolean;
      startTime: string; // "22:00"
      endTime: string; // "07:00"
    };
  };
  notifications?: {
    readingReminders: boolean;
    progressUpdates: boolean;
    parentalReports: boolean;
  };
}

interface ReadingSession {
  id: string | number;
  userId: string | number;
  bookId: string | number;
  bookTitle: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  pagesRead?: number;
  highlightsCreated?: number;
  comprehensionScore?: number;
  createdAt: string;
}

interface BookRecommendation {
  id: string | number;
  bookId: string | number;
  bookTitle: string;
  recommendedFor: string | number; // userId
  recommendedBy?: string | number; // parentId or system
  reason: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  dueDate?: string;
}

interface ParentalReport {
  id: string | number;
  childId: string | number;
  parentId: string | number;
  reportType: 'daily' | 'weekly' | 'monthly';
  period: {
    startDate: string;
    endDate: string;
  };
  stats: {
    totalReadingTime: number; // minutes
    booksCompleted: number;
    averageSessionLength: number;
    favoriteGenres: string[];
    readingStreak: number; // days
    highlightsCreated: number;
    comprehensionAverage?: number;
  };
  recommendations: BookRecommendation[];
  concerns?: string[];
  achievements?: string[];
  createdAt: string;
}

interface BookMetadata {
  id: string | number;
  title: string;
  author: string;
  genre: string[];
  ageRating: string; // "6+", "12+", "16+", "18+"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  educationalValue?: string[];
  contentWarnings?: string[];
  readingTime?: number; // estimated minutes
  pageCount?: number;
  language: string;
  publishedDate?: string;
  description?: string;
  coverImage?: string;
}
