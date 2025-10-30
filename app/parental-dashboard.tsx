import { AuthContext } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';
import { API_URL } from '../config';

interface ReadingActivity {
  id: string;
  childName: string;
  bookTitle: string;
  date: string;
  time: string;
  duration: number; // minutes
  pagesRead: number;
  status: 'reading' | 'completed' | 'paused';
}

const ParentalDashboard = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [activities, setActivities] = useState<ReadingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadReadingActivities();
  }, [selectedPeriod]);

  const loadReadingActivities = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend first
      if (authContext?.token && authContext?.user) {
        try {
          const res = await fetch(`${API_URL}/api/parental/reading-activities?period=${selectedPeriod}`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authContext.token}`
            },
          });

          if (res.ok) {
            const data = await res.json();
            const transformedActivities: ReadingActivity[] = data.activities.map((activity: any) => ({
              id: activity._id || activity.id,
              childName: activity.childName || activity.userName,
              bookTitle: activity.bookTitle,
              date: new Date(activity.startTime || activity.createdAt).toISOString().split('T')[0],
              time: new Date(activity.startTime || activity.createdAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              duration: activity.duration || 0,
              pagesRead: activity.pagesRead || 0,
              status: activity.status || 'reading'
            }));
            setActivities(transformedActivities);
            return;
          }
        } catch (apiError) {
          console.log('API not available, using demo data');
        }
      }

      // Fallback to demo data when API is not available
      const demoActivities: ReadingActivity[] = [
        {
          id: '1',
          childName: 'Emma',
          bookTitle: 'Harry Potter and the Sorcerer\'s Stone',
          date: new Date().toISOString().split('T')[0],
          time: '14:30',
          duration: 45,
          pagesRead: 12,
          status: 'reading'
        },
        {
          id: '2',
          childName: 'Emma',
          bookTitle: 'The Cat in the Hat',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          time: '16:15',
          duration: 20,
          pagesRead: 8,
          status: 'completed'
        },
        {
          id: '3',
          childName: 'Alex',
          bookTitle: 'Charlotte\'s Web',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          duration: 30,
          pagesRead: 15,
          status: 'paused'
        }
      ];

      // Filter demo data based on selected period
      const now = new Date();
      const filteredActivities = demoActivities.filter(activity => {
        const activityDate = new Date(activity.date);
        const diffTime = now.getTime() - activityDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (selectedPeriod) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReadingActivities();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reading': return '📖';
      case 'completed': return '✅';
      case 'paused': return '⏸️';
      default: return '📚';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTotalStats = () => {
    const totalMinutes = activities.reduce((sum, activity) => sum + activity.duration, 0);
    const totalPages = activities.reduce((sum, activity) => sum + activity.pagesRead, 0);
    const completedBooks = activities.filter(activity => activity.status === 'completed').length;
    
    return { totalMinutes, totalPages, completedBooks };
  };

  const stats = getTotalStats();

  // Check if user has parental access
  if (!authContext?.user || authContext.user.accountType !== 'parent') {
    return (
      <View style={tw`flex-1 bg-gradient-to-br from-orange-50 to-red-50 justify-center items-center px-6`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-6xl mb-4`}>🚫</Text>
          <Text style={tw`text-xl font-bold text-gray-800 mb-2 text-center`}>
            Access Denied
          </Text>
          <Text style={tw`text-gray-600 text-center mb-6`}>
            You need parental access to view this dashboard.
          </Text>
          <TouchableOpacity
            style={tw`bg-orange-600 px-6 py-3 rounded-xl`}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={tw`text-white font-semibold`}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-orange-600 pt-12 pb-6 px-6`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View>
            <Text style={tw`text-white text-2xl font-bold`}>👨‍👩‍👧‍👦 Parental Dashboard</Text>
            <Text style={tw`text-orange-100 mt-1`}>Monitor your children's reading</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Logout',
                    onPress: async () => {
                      await authContext.logout();
                      router.replace('/auth/login');
                    }
                  }
                ]
              );
            }}
            style={tw`bg-orange-500 p-2 rounded-lg`}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={tw`flex-row bg-orange-500 rounded-xl p-1`}>
          {(['today', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              style={tw`flex-1 py-2 rounded-lg ${
                selectedPeriod === period ? 'bg-white' : ''
              }`}
            >
              <Text style={tw`text-center font-semibold capitalize ${
                selectedPeriod === period ? 'text-orange-600' : 'text-white'
              }`}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={tw`px-6 -mt-4 mb-4`}>
        <View style={tw`bg-white rounded-2xl p-6 shadow-lg`}>
          <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
            📊 Reading Summary ({selectedPeriod})
          </Text>
          <View style={tw`flex-row justify-between`}>
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-2xl font-bold text-blue-600`}>
                {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
              </Text>
              <Text style={tw`text-gray-600 text-sm`}>Total Time</Text>
            </View>
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-2xl font-bold text-green-600`}>
                {stats.totalPages}
              </Text>
              <Text style={tw`text-gray-600 text-sm`}>Pages Read</Text>
            </View>
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-2xl font-bold text-purple-600`}>
                {stats.completedBooks}
              </Text>
              <Text style={tw`text-gray-600 text-sm`}>Books Done</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Activities List */}
      <View style={tw`flex-1 px-6`}>
        <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>
          📚 Recent Reading Activities
        </Text>

        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#ea580c" />
            <Text style={tw`text-gray-600 mt-2`}>Loading activities...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={tw`text-6xl mb-4`}>📖</Text>
            <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>
              No Reading Activities
            </Text>
            <Text style={tw`text-gray-600 text-center`}>
              No reading activities found for the selected period.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100`}>
                {/* Header */}
                <View style={tw`flex-row justify-between items-start mb-3`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center mb-1`}>
                      <Text style={tw`text-lg font-bold text-gray-800`}>
                        {item.childName}
                      </Text>
                      <View style={tw`ml-2 px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                        <Text style={tw`text-xs font-semibold`}>
                          {getStatusIcon(item.status)} {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={tw`text-gray-700 font-medium`}>
                      {item.bookTitle}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text style={tw`text-gray-600 text-sm ml-1`}>
                      {formatDate(item.date)} at {item.time}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="time-outline" size={16} color="#6b7280" />
                      <Text style={tw`text-gray-600 text-sm ml-1`}>
                        {item.duration}min
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                      <Text style={tw`text-gray-600 text-sm ml-1`}>
                        {item.pagesRead} pages
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default ParentalDashboard;