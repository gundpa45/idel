import { useParentalControls } from '@/context/ParentalControlContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

interface ReadingRecommendationsProps {
  userId?: string;
  showParentRecommendations?: boolean;
}

const ReadingRecommendations: React.FC<ReadingRecommendationsProps> = ({ 
  userId, 
  showParentRecommendations = true 
}) => {
  const parentalControls = useParentalControls();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Filter recommendations for current user
      const userRecommendations = parentalControls.recommendations.filter(
        rec => rec.recommendedFor.toString() === (userId || parentalControls.currentChild?.id?.toString())
      );
      setRecommendations(userRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (recommendation: BookRecommendation, action: 'accept' | 'decline') => {
    try {
      await parentalControls.updateRecommendationStatus(
        recommendation.id.toString(), 
        action === 'accept' ? 'accepted' : 'declined'
      );
      
      if (action === 'accept') {
        Alert.alert(
          'Recommendation Accepted!',
          `"${recommendation.bookTitle}" has been added to your reading list.`,
          [
            { text: 'Read Now', onPress: () => {
              // Navigate to book reader - you'd need the actual book link
              // router.push(`/BookReader?title=${recommendation.bookTitle}&bookId=${recommendation.bookId}`);
            }},
            { text: 'Later', style: 'cancel' }
          ]
        );
      }
      
      loadRecommendations();
    } catch (error) {
      Alert.alert('Error', 'Failed to update recommendation');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (recommendations.length === 0) {
    return (
      <View style={tw`bg-white rounded-2xl p-6 m-4 shadow-sm`}>
        <View style={tw`items-center`}>
          <Ionicons name="book-outline" size={48} color="#d1d5db" />
          <Text style={tw`text-lg font-bold text-gray-800 mt-4 mb-2`}>
            No Recommendations Yet
          </Text>
          <Text style={tw`text-gray-600 text-center`}>
            {showParentRecommendations 
              ? "Your parent hasn't recommended any books yet."
              : "No recommendations available at the moment."
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`m-4`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-xl font-bold text-gray-800`}>
          📚 Recommended for You
        </Text>
        <Text style={tw`text-sm text-gray-600`}>
          {recommendations.filter(r => r.status === 'pending').length} new
        </Text>
      </View>

      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-start mb-3`}>
              <View style={tw`flex-1 mr-3`}>
                <Text style={tw`text-lg font-bold text-gray-800`}>
                  {item.bookTitle}
                </Text>
                <Text style={tw`text-gray-600 mt-1`}>
                  {item.reason}
                </Text>
              </View>
              
              <View style={tw`flex-row gap-2`}>
                <View style={tw`px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                  <Text style={tw`text-xs font-semibold capitalize`}>
                    {item.priority}
                  </Text>
                </View>
                <View style={tw`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                  <Text style={tw`text-xs font-semibold capitalize`}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Metadata */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-sm text-gray-500`}>
                {showParentRecommendations ? '👨‍👩‍👧‍👦 From Parent' : '🤖 AI Recommended'}
              </Text>
              <Text style={tw`text-sm text-gray-500`}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {/* Due Date */}
            {item.dueDate && (
              <View style={tw`flex-row items-center mb-4`}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={tw`text-sm text-gray-600 ml-2`}>
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Actions */}
            {item.status === 'pending' && (
              <View style={tw`flex-row gap-3 mt-4`}>
                <TouchableOpacity
                  onPress={() => handleRecommendationAction(item, 'decline')}
                  style={tw`flex-1 bg-gray-100 py-3 rounded-xl items-center`}
                >
                  <Text style={tw`text-gray-700 font-semibold`}>Maybe Later</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleRecommendationAction(item, 'accept')}
                  style={tw`flex-1 bg-blue-600 py-3 rounded-xl items-center`}
                >
                  <Text style={tw`text-white font-semibold`}>Accept & Read</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'accepted' && (
              <TouchableOpacity
                onPress={() => {
                  // Navigate to book reader
                  // router.push(`/BookReader?title=${item.bookTitle}&bookId=${item.bookId}`);
                }}
                style={tw`bg-green-600 py-3 rounded-xl items-center mt-4`}
              >
                <Text style={tw`text-white font-semibold`}>Continue Reading</Text>
              </TouchableOpacity>
            )}

            {item.status === 'completed' && (
              <View style={tw`bg-purple-50 py-3 rounded-xl items-center mt-4`}>
                <Text style={tw`text-purple-700 font-semibold`}>✅ Completed!</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default ReadingRecommendations;