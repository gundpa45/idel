import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
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
  const [isParentalLogin, setIsParentalLogin] = useState(false);
  const [parentalCode, setParentalCode] = useState('');

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
      // Try backend first, fallback to offline demo login
      let loginSuccess = false;
      let userData = null;
      let token = null;

      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          userData = data.user;
          token = data.token;
          loginSuccess = true;
          console.log('Backend login successful');
        }
      } catch (apiError) {
        console.log('Backend not available, using offline login');
      }

      // Fallback to offline demo login
      if (!loginSuccess) {
        // Demo credentials for testing
        const demoCredentials = [
          { email: 'demo@example.com', password: 'demo123', name: 'Demo User' },
          { email: 'test@example.com', password: 'test123', name: 'Test User' },
          { email: 'user@example.com', password: 'user123', name: 'Sample User' },
          { email: email, password: password, name: 'Guest User' } // Allow any email/password
        ];

        const validCredential = demoCredentials.find(
          cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
        );

        if (validCredential || password === 'demo123') { // Accept demo123 as universal password
          userData = {
            id: 'user_' + Date.now(),
            name: validCredential?.name || 'Demo User',
            email: email,
            accountType: 'user'
          };
          token = 'demo_token_' + Date.now();
          loginSuccess = true;
          console.log('Offline demo login successful');
        }
      }

      if (!loginSuccess) {
        Alert.alert('Login Failed', 'Invalid credentials. Try:\n• Email: demo@example.com\n• Password: demo123');
        return;
      }

      // Use AuthContext to login
      if (authContext && userData && token) {
        await authContext.login(token, userData);
      }

      Alert.alert('Success', loginSuccess ? 'Welcome back!' : 'Welcome! (Demo Mode)');
      router.replace('/(tabs)/profile');
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Login Failed', 'Please try demo credentials:\n• Email: demo@example.com\n• Password: demo123');
    } finally {
      setLoading(false);
    }
  };

  const handleParentalLogin = async () => {
    if (!parentalCode.trim()) {
      Alert.alert('Error', 'Please enter the parental access code');
      return;
    }

    setLoading(true);
    console.log('Starting parental login with code:', parentalCode);
    console.log('API URL:', `${API_URL}/api/auth/parental-access`);
    
    try {
      // Call backend to verify parental access and get child data
      const res = await fetch(`${API_URL}/api/auth/parental-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessCode: parentalCode,
          parentEmail: 'gundpa45@gmail.com' // The parent's email
        }),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      const data = await res.json();
      console.log('Parental access response:', data);

      if (!res.ok) {
        Alert.alert('Access Denied', data.msg || data.message || 'Invalid parental access code');
        return;
      }

      // Login with parent user data from backend
      if (authContext && data.parentUser) {
        await authContext.login(data.token, {
          ...data.parentUser,
          accountType: 'parent',
          accessLevel: 'parental_dashboard',
          children: data.children || []
        });
      }

      Alert.alert('Parental Access Granted', `Welcome! Monitoring ${data.children?.length || 0} child(ren)`);
      router.replace('/parental-dashboard');
    } catch (err) {
      console.error('Parental login error:', err);
      
      // Fallback to offline mode when server is not available
      console.log('Server not available, using offline parental access');
      
      try {
        // Validate access code locally
        const validCodes = ['PARENT123', 'FAMILY456', 'MONITOR789'];
        if (!validCodes.includes(parentalCode.toUpperCase())) {
          Alert.alert('Access Denied', 'Invalid parental access code');
          return;
        }

        // Create offline parent user
        const parentUser = {
          id: 'parent_offline_' + Date.now(),
          name: 'Parent User (Offline)',
          email: 'gundpa45@gmail.com',
        };

        const children = [
          { id: 'child1', name: 'Emma', email: 'emma@family.com' },
          { id: 'child2', name: 'Alex', email: 'alex@family.com' }
        ];

        // Login with offline parent user
        if (authContext) {
          await authContext.login('parent_offline_token_' + Date.now(), {
            ...parentUser,
            accountType: 'parent',
            accessLevel: 'parental_dashboard',
            children: children
          });
        }

        Alert.alert('Parental Access Granted (Offline)', 'Welcome! Using demo data while server is unavailable.');
        router.replace('/parental-dashboard');
      } catch (offlineError) {
        Alert.alert('Error', 'Failed to access parental dashboard');
      }
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

        {/* Parental Access Section */}
        <View style={tw`mt-8`}>
          <TouchableOpacity
            onPress={() => setIsParentalLogin(!isParentalLogin)}
            style={tw`bg-orange-100 border-2 border-orange-200 rounded-2xl p-4 items-center`}
          >
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-2xl mr-2`}>👨‍👩‍👧‍👦</Text>
              <Text style={tw`text-orange-800 font-bold text-base`}>
                {isParentalLogin ? 'Hide Parental Access' : 'Parental Dashboard Access'}
              </Text>
            </View>
            <Text style={tw`text-orange-600 text-sm mt-1 text-center`}>
              Monitor your child's reading activity
            </Text>
          </TouchableOpacity>

          {isParentalLogin && (
            <View style={tw`bg-white rounded-2xl p-6 mt-4 shadow-lg ${Platform.OS === 'android' ? 'elevation-4' : ''}`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4 text-center`}>
                🔐 Parental Access Code
              </Text>
              
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Enter Access Code</Text>
                <View style={tw`border-2 border-orange-300 rounded-xl bg-orange-50 flex-row items-center px-4`}>
                  <Text style={tw`text-orange-500 mr-2 text-lg`}>🔑</Text>
                  <TextInput
                    placeholder="Enter parental code"
                    value={parentalCode}
                    onChangeText={setParentalCode}
                    autoCapitalize="characters"
                    style={tw`flex-1 py-4 text-base text-gray-800 font-mono`}
                    placeholderTextColor="#FB923C"
                    secureTextEntry={true}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={tw`bg-orange-600 rounded-xl py-4 items-center justify-center shadow-md ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={handleParentalLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={tw`text-white font-bold text-lg`}>Access Dashboard</Text>
                )}
              </TouchableOpacity>

              <View style={tw`mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200`}>
                <Text style={tw`text-yellow-800 text-xs text-center mb-2`}>
                  💡 Demo codes: PARENT123, FAMILY456, MONITOR789
                </Text>
                
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      console.log('Testing server connection...');
                      const response = await fetch(`${API_URL}/api/health`);
                      const data = await response.json();
                      Alert.alert('Server Status', `✅ Server is running!\n\nStatus: ${data.status}\nMessage: ${data.message}`);
                    } catch (error) {
                      Alert.alert('Server Status', `❌ Server not reachable!\n\nError: ${error.message}\n\nPlease start the server:\ncd server && npm start`);
                    }
                  }}
                  style={tw`bg-blue-100 py-2 px-3 rounded-lg mt-2`}
                >
                  <Text style={tw`text-blue-800 text-xs text-center font-semibold`}>
                    🔍 Test Server Connection
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Demo Credentials Info */}
        <View style={tw`mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200`}>
          <Text style={tw`text-blue-800 font-bold text-sm mb-2 text-center`}>
            🎯 Demo Credentials (Works Offline)
          </Text>
          <Text style={tw`text-blue-700 text-xs text-center mb-2`}>
            Email: demo@example.com
          </Text>
          <Text style={tw`text-blue-700 text-xs text-center mb-2`}>
            Password: demo123
          </Text>
          <Text style={tw`text-blue-600 text-xs text-center`}>
            Or use any email with password: demo123
          </Text>
        </View>

        {/* Sign Up Link */}
        <View style={tw`flex-row justify-center mt-6`}>
          <Text style={tw`text-gray-600 text-base`}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={tw`text-blue-600 font-bold text-base`}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;