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

const SignupScreen = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSignup = async () => {
    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (form.name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    console.log('--- handleSignup start ---');
    console.log('Form data:', form);
    setLoading(true);

    try {
      const url = `${API_URL}/api/auth/signup`;
      console.log('Request URL:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response JSON:', data);

      if (!res.ok) {
        console.warn('res.ok is false, error:', data);
        Alert.alert('Signup Failed', data.msg || `Error code ${res.status}`);
        return;
      }

      console.log('Signup success, data.user:', data.user, 'token:', data.token);

      // Use AuthContext to login (this will handle AsyncStorage automatically)
      if (authContext) {
        await authContext.login(data.token, data.user);
      }

      Alert.alert('Success', 'Account created successfully! Welcome aboard! 🎉');

      console.log('Navigating to /(tabs)/profile');
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      console.error('Caught error in signup:', err);
      Alert.alert('Error', err.message || 'Failed to connect to server');
    } finally {
      console.log('Setting loading = false');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-gradient-to-br from-purple-50 to-blue-50`}
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center px-6 py-8`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={tw`mb-10 items-center`}>
          <View style={tw`w-20 h-20 bg-purple-600 rounded-full items-center justify-center mb-4 shadow-lg`}>
            <Text style={tw`text-white text-3xl font-bold`}>✨</Text>
          </View>
          <Text style={tw`text-3xl font-bold text-gray-800 mb-2`}>Create Account</Text>
          <Text style={tw`text-base text-gray-500 text-center`}>
            Join us and start your journey today
          </Text>
        </View>

        {/* Signup Form */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-xl ${Platform.OS === 'android' ? 'elevation-8' : ''}`}>
          {/* Name Input */}
          <View style={tw`mb-5`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Full Name</Text>
            <View
              style={tw`border-2 ${
                focusedField === 'name' ? 'border-purple-500' : 'border-gray-200'
              } rounded-xl bg-gray-50 flex-row items-center px-4`}
            >
              <Text style={tw`text-gray-400 mr-2 text-lg`}>👤</Text>
              <TextInput
                placeholder="Enter your full name"
                value={form.name}
                onChangeText={(val) => handleChange('name', val)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                style={tw`flex-1 py-4 text-base text-gray-800`}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={tw`mb-5`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Email Address</Text>
            <View
              style={tw`border-2 ${
                focusedField === 'email' ? 'border-purple-500' : 'border-gray-200'
              } rounded-xl bg-gray-50 flex-row items-center px-4`}
            >
              <Text style={tw`text-gray-400 mr-2 text-lg`}>📧</Text>
              <TextInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(val) => handleChange('email', val)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
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
                focusedField === 'password' ? 'border-purple-500' : 'border-gray-200'
              } rounded-xl bg-gray-50 flex-row items-center px-4`}
            >
              <Text style={tw`text-gray-400 mr-2 text-lg`}>🔒</Text>
              <TextInput
                placeholder="Create a password (min. 6 characters)"
                value={form.password}
                onChangeText={(val) => handleChange('password', val)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoComplete="password"
                style={tw`flex-1 py-4 text-base text-gray-800`}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={tw`text-gray-400 text-lg`}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={tw`text-xs text-gray-500 mt-2 ml-1`}>
              Use at least 6 characters for security
            </Text>
          </View>

          {/* Terms & Conditions */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-xs text-gray-500 text-center`}>
              By signing up, you agree to our{' '}
              <Text style={tw`text-purple-600 font-semibold`}>Terms & Conditions</Text>
              {' '}and{' '}
              <Text style={tw`text-purple-600 font-semibold`}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={tw`bg-purple-600 rounded-xl py-4 items-center justify-center shadow-md ${
              loading ? 'opacity-70' : ''
            }`}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={tw`text-white font-bold text-lg`}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={tw`flex-row items-center my-6`}>
            <View style={tw`flex-1 h-px bg-gray-300`} />
            <Text style={tw`mx-4 text-gray-500 text-sm`}>OR</Text>
            <View style={tw`flex-1 h-px bg-gray-300`} />
          </View>

          {/* Social Signup Buttons */}
          <View style={tw`flex-row gap-3 mb-4`}>
            <TouchableOpacity
              style={tw`flex-1 border-2 border-gray-200 rounded-xl py-3 items-center justify-center`}
              onPress={() => Alert.alert('Info', 'Google signup coming soon!')}
            >
              <Text style={tw`text-2xl`}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 border-2 border-gray-200 rounded-xl py-3 items-center justify-center`}
              onPress={() => Alert.alert('Info', 'Apple signup coming soon!')}
            >
              <Text style={tw`text-2xl`}>🍎</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Link */}
        <View style={tw`flex-row justify-center mt-8`}>
          <Text style={tw`text-gray-600 text-base`}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={tw`text-purple-600 font-bold text-base`}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;