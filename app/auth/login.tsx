import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';
import { API_URL } from '../../config';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (!res.ok) {
        Alert.alert('Login Failed', data.msg || 'Invalid credentials');
        return;
      }

      // Use AuthContext to login (this will handle AsyncStorage automatically)
      if (authContext) {
        await authContext.login(data.token, data.user);
      }

      Alert.alert('Success', 'Welcome back!');
      router.replace('/(tabs)/profile');
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-gradient-to-br from-blue-50 to-indigo-50`}
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center px-6 py-8`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={tw`mb-10 items-center`}>
          <View style={tw`w-20 h-20 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg`}>
            <Text style={tw`text-white text-3xl font-bold`}>👤</Text>
          </View>
          <Text style={tw`text-3xl font-bold text-gray-800 mb-2`}>Welcome Back</Text>
          <Text style={tw`text-base text-gray-500 text-center`}>
            Sign in to continue to your account
          </Text>
        </View>

        {/* Login Form */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-xl ${Platform.OS === 'android' ? 'elevation-8' : ''}`}>
          {/* Email Input */}
          <View style={tw`mb-5`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Email Address</Text>
            <View
              style={tw`border-2 ${
                emailFocused ? 'border-blue-500' : 'border-gray-200'
              } rounded-xl bg-gray-50 flex-row items-center px-4`}
            >
              <Text style={tw`text-gray-400 mr-2 text-lg`}>📧</Text>
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={tw`flex-1 py-4 text-base text-gray-800`}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Password</Text>
            <View
              style={tw`border-2 ${
                passwordFocused ? 'border-blue-500' : 'border-gray-200'
              } rounded-xl bg-gray-50 flex-row items-center px-4`}
            >
              <Text style={tw`text-gray-400 mr-2 text-lg`}>🔒</Text>
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoComplete="password"
                style={tw`flex-1 py-4 text-base text-gray-800`}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={tw`text-gray-400 text-lg`}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={tw`mb-6 self-end`}
            onPress={() => Alert.alert('Info', 'Forgot password feature coming soon!')}
          >
            <Text style={tw`text-blue-600 font-semibold text-sm`}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={tw`bg-blue-600 rounded-xl py-4 items-center justify-center shadow-md ${
              loading ? 'opacity-70' : ''
            }`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={tw`text-white font-bold text-lg`}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={tw`flex-row items-center my-6`}>
            <View style={tw`flex-1 h-px bg-gray-300`} />
            <Text style={tw`mx-4 text-gray-500 text-sm`}>OR</Text>
            <View style={tw`flex-1 h-px bg-gray-300`} />
          </View>

          {/* Social Login Buttons */}
          <View style={tw`flex-row gap-3 mb-4`}>
            <TouchableOpacity
              style={tw`flex-1 border-2 border-gray-200 rounded-xl py-3 items-center justify-center`}
              onPress={() => Alert.alert('Info', 'Google login coming soon!')}
            >
              <Text style={tw`text-2xl`}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 border-2 border-gray-200 rounded-xl py-3 items-center justify-center`}
              onPress={() => Alert.alert('Info', 'Apple login coming soon!')}
            >
              <Text style={tw`text-2xl`}>🍎</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={tw`flex-row justify-center mt-8`}>
          <Text style={tw`text-gray-600 text-base`}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={tw`text-blue-600 font-bold text-base`}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;