import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

const Profile = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since AuthContext loads user data automatically, we just need to wait for it
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const user = authContext?.user;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (authContext) {
                await authContext.logout();
              }
              Alert.alert('Success', 'You have been logged out');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  // Loading State
  if (loading) {
    return (
      <View style={tw`flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 justify-center items-center`}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={tw`text-gray-600 mt-4 text-base`}>Loading profile...</Text>
      </View>
    );
  }

  // Not Logged In State
  if (!user) {
    return (
      <View style={tw`flex-1 bg-gradient-to-br from-blue-50 to-indigo-50`}>
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center px-6 py-8`}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={tw`items-center mb-10`}>
            <View style={tw`w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg`}>
              <Text style={tw`text-white text-5xl`}>👤</Text>
            </View>
            <Text style={tw`text-3xl font-bold text-gray-800 mb-2`}>Welcome!</Text>
            <Text style={tw`text-base text-gray-500 text-center px-8`}>
              Please sign in to access your profile and personalized features
            </Text>
          </View>

          {/* Action Card */}
          <View style={tw`bg-white rounded-3xl p-6 shadow-xl ${Platform.OS === 'android' ? 'elevation-8' : ''} mb-6`}>
            <Text style={tw`text-xl font-bold text-gray-800 mb-2 text-center`}>
              Get Started
            </Text>
            <Text style={tw`text-sm text-gray-500 text-center mb-6`}>
              Join our community and unlock exclusive features
            </Text>

            {/* Login Button */}
            <TouchableOpacity
              style={tw`bg-blue-600 rounded-xl py-4 items-center justify-center shadow-md mb-3`}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.8}
            >
              <Text style={tw`text-white font-bold text-lg`}>Sign In</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={tw`bg-white border-2 border-blue-600 rounded-xl py-4 items-center justify-center`}
              onPress={() => router.push('/auth/signup')}
              activeOpacity={0.8}
            >
              <Text style={tw`text-blue-600 font-bold text-lg`}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Features List */}
          <View style={tw`bg-white rounded-3xl p-6 shadow-lg ${Platform.OS === 'android' ? 'elevation-4' : ''}`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Why Join Us?</Text>
            
            <View style={tw`flex-row items-start mb-3`}>
              <Text style={tw`text-2xl mr-3`}>✨</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-800 font-semibold`}>Personalized Experience</Text>
                <Text style={tw`text-gray-500 text-sm`}>Get recommendations tailored to you</Text>
              </View>
            </View>

            <View style={tw`flex-row items-start mb-3`}>
              <Text style={tw`text-2xl mr-3`}>🔒</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-800 font-semibold`}>Secure & Private</Text>
                <Text style={tw`text-gray-500 text-sm`}>Your data is safe with us</Text>
              </View>
            </View>

            <View style={tw`flex-row items-start`}>
              <Text style={tw`text-2xl mr-3`}>🚀</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-800 font-semibold`}>Premium Features</Text>
                <Text style={tw`text-gray-500 text-sm`}>Access exclusive content and tools</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Logged In State
  return (
    <View style={tw`flex-1 bg-gradient-to-br from-blue-50 to-indigo-50`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-8`}
      >
        {/* Header with Avatar */}
        <View style={tw`bg-blue-600 pt-16 pb-20 px-6 rounded-b-3xl shadow-lg`}>
          <View style={tw`items-center`}>
            {/* Avatar */}
            <View style={tw`w-28 h-28 bg-white rounded-full items-center justify-center shadow-xl mb-4`}>
              <Text style={tw`text-blue-600 text-5xl font-bold`}>
                {user.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            
            <Text style={tw`text-white text-2xl font-bold mb-1`}>
              {user.name}
            </Text>
            <Text style={tw`text-blue-100 text-sm`}>Member since 2024</Text>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={tw`mx-6 -mt-12 bg-white rounded-3xl p-6 shadow-xl ${Platform.OS === 'android' ? 'elevation-8' : ''}`}>
          <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>Account Details</Text>
          
          {/* Name Field */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-xs font-semibold text-gray-500 mb-2 uppercase`}>Full Name</Text>
            <View style={tw`bg-gray-50 rounded-xl p-4 border border-gray-200`}>
              <Text style={tw`text-gray-800 text-base font-medium`}>{user.name}</Text>
            </View>
          </View>

          {/* Email Field */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-xs font-semibold text-gray-500 mb-2 uppercase`}>Email Address</Text>
            <View style={tw`bg-gray-50 rounded-xl p-4 border border-gray-200`}>
              <Text style={tw`text-gray-800 text-base font-medium`}>{user.email}</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={tw`bg-blue-50 rounded-xl py-3 items-center justify-center border border-blue-200`}
            onPress={() => Alert.alert('Info', 'Edit profile feature coming soon!')}
            activeOpacity={0.7}
          >
            <Text style={tw`text-blue-600 font-semibold text-base`}>✏️  Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={tw`mx-6 mt-6`}>
          <Text style={tw`text-lg font-bold text-gray-800 mb-3 px-2`}>Quick Actions</Text>
          
          {/* Settings */}
          <TouchableOpacity
            style={tw`bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-md ${Platform.OS === 'android' ? 'elevation-3' : ''}`}
            onPress={() => Alert.alert('Info', 'Settings coming soon!')}
            activeOpacity={0.7}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4`}>
                <Text style={tw`text-2xl`}>⚙️</Text>
              </View>
              <View>
                <Text style={tw`text-gray-800 font-semibold text-base`}>Settings</Text>
                <Text style={tw`text-gray-500 text-xs`}>App preferences & privacy</Text>
              </View>
            </View>
            <Text style={tw`text-gray-400 text-xl`}>›</Text>
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity
            style={tw`bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-md ${Platform.OS === 'android' ? 'elevation-3' : ''}`}
            onPress={() => Alert.alert('Info', 'Help & Support coming soon!')}
            activeOpacity={0.7}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4`}>
                <Text style={tw`text-2xl`}>💬</Text>
              </View>
              <View>
                <Text style={tw`text-gray-800 font-semibold text-base`}>Help & Support</Text>
                <Text style={tw`text-gray-500 text-xs`}>Get assistance anytime</Text>
              </View>
            </View>
            <Text style={tw`text-gray-400 text-xl`}>›</Text>
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity
            style={tw`bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-md ${Platform.OS === 'android' ? 'elevation-3' : ''}`}
            onPress={() => Alert.alert('About', 'App Version 1.0.0')}
            activeOpacity={0.7}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4`}>
                <Text style={tw`text-2xl`}>ℹ️</Text>
              </View>
              <View>
                <Text style={tw`text-gray-800 font-semibold text-base`}>About</Text>
                <Text style={tw`text-gray-500 text-xs`}>App info & version</Text>
              </View>
            </View>
            <Text style={tw`text-gray-400 text-xl`}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={tw`mx-6 mt-6`}>
          <TouchableOpacity
            style={tw`bg-red-500 rounded-2xl py-4 items-center justify-center shadow-lg`}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={tw`text-white font-bold text-lg`}>🚪  Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={tw`text-center text-gray-400 text-xs mt-6`}>
          Made with ❤️ • v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

export default Profile;