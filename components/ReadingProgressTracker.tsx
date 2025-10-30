import { useParentalControls } from '@/context/ParentalControlContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Text,
    View
} from 'react-native';
import tw from 'twrnc';

interface ReadingProgressTrackerProps {
  userId?: string;
  showDetailedStats?: boolean;
}

const ReadingProgressTracker: React.FC<ReadingProgressTrackerProps> = ({ 
  userId, 
  showDetailedStats = true 
}) => {
  const parentalControls = useParentalControls();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    const targetUserId = userId || parentalControls.currentChild?.id?.toString();
    if (!targetUserId) return;

    setLoading(true);
    try {
      const statsData = await parentalControls.getReadingStats(targetUserId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '✨';
    if (streak >= 3) return '💫';
    return '📖';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <View style={tw`bg-white rounded-2xl p-6 m-4 shadow-sm`}>
        <Text style={tw`text-center text-gray-600`}>Loading reading progress...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={tw`bg-white rounded-2xl p-6 m-4 shadow-sm`}>
        <View style={tw`items-center`}>
          <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
          <Text style={tw`text-lg font-bold text-gray-800 mt-4 mb-2`}>
            No Reading Data Yet
          </Text>
          <Text style={tw`text-gray-600 text-center`}>
            Start reading to see your progress and achievements!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`m-4`}>
      {/* Current Session */}
      {parentalControls.currentSession && (
        <View style={tw`bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-white text-lg font-bold`}>
                📖 Currently Reading
              </Text>
              <Text style={tw`text-blue-100 mt-1`}>
                {parentalControls.currentSession.bookTitle}
              </Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-white text-2xl font-bold`}>
                {Math.floor((Date.now() - new Date(parentalControls.currentSession.startTime).getTime()) / 60000)}
              </Text>
              <Text style={tw`text-blue-100 text-sm`}>minutes</Text>
            </View>
          </View>
        </View>
      )}

      {/* Today's Progress */}
      <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          📅 Today's Progress
        </Text>
        
        <View style={tw`flex-row justify-between mb-4`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-blue-600`}>
              {formatTime(stats.todayMinutes || 0)}
            </Text>
            <Text style={tw`text-gray-600 text-sm`}>Reading Time</Text>
          </View>
          
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-green-600`}>
              {stats.todayPages || 0}
            </Text>
            <Text style={tw`text-gray-600 text-sm`}>Pages Read</Text>
          </View>
          
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-purple-600`}>
              {stats.todayHighlights || 0}
            </Text>
            <Text style={tw`text-gray-600 text-sm`}>Highlights</Text>
          </View>
        </View>

        {/* Daily Goal Progress */}
        {stats.dailyGoal && (
          <View>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-gray-700 font-semibold`}>Daily Goal</Text>
              <Text style={tw`text-gray-600`}>
                {Math.round((stats.todayMinutes / stats.dailyGoal) * 100)}%
              </Text>
            </View>
            <View style={tw`bg-gray-200 rounded-full h-3`}>
              <View 
                style={tw`${getProgressColor((stats.todayMinutes / stats.dailyGoal) * 100)} rounded-full h-3`}
                width={`${Math.min((stats.todayMinutes / stats.dailyGoal) * 100, 100)}%`}
              />
            </View>
          </View>
        )}
      </View>

      {/* Reading Streak */}
      <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <Text style={tw`text-lg font-bold text-gray-800`}>
              Reading Streak
            </Text>
            <Text style={tw`text-gray-600 mt-1`}>
              Keep it up! You're doing great.
            </Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-4xl mb-2`}>
              {getStreakEmoji(stats.readingStreak || 0)}
            </Text>
            <Text style={tw`text-2xl font-bold text-orange-600`}>
              {stats.readingStreak || 0}
            </Text>
            <Text style={tw`text-gray-600 text-sm`}>days</Text>
          </View>
        </View>
      </View>

      {showDetailedStats && (
        <>
          {/* Weekly Summary */}
          <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
              📊 This Week
            </Text>
            
            <View style={tw`flex-row justify-between mb-4`}>
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-xl font-bold text-indigo-600`}>
                  {stats.weeklyBooks || 0}
                </Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>Books Completed</Text>
              </View>
              
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-xl font-bold text-teal-600`}>
                  {formatTime(stats.weeklyMinutes || 0)}
                </Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>Total Time</Text>
              </View>
              
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-xl font-bold text-pink-600`}>
                  {stats.averageSession || 0}
                </Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>Avg Session</Text>
              </View>
            </View>
          </View>

          {/* Favorite Genres */}
          {stats.favoriteGenres && stats.favoriteGenres.length > 0 && (
            <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
                🎭 Favorite Genres
              </Text>
              <View style={tw`flex-row flex-wrap gap-2`}>
                {stats.favoriteGenres.map((genre: string, index: number) => (
                  <View key={index} style={tw`bg-blue-100 px-3 py-2 rounded-full`}>
                    <Text style={tw`text-blue-800 font-semibold text-sm`}>
                      {genre}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Achievements */}
          {stats.recentAchievements && stats.recentAchievements.length > 0 && (
            <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
                🏆 Recent Achievements
              </Text>
              {stats.recentAchievements.map((achievement: string, index: number) => (
                <View key={index} style={tw`flex-row items-center py-2`}>
                  <Text style={tw`text-2xl mr-3`}>🏆</Text>
                  <Text style={tw`text-gray-800 flex-1`}>{achievement}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default ReadingProgressTracker;