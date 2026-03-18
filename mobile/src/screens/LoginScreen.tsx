/**
 * Login Screen
 * 
 * User authentication screen with email, password, and Google OAuth.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GraduationCap, Mail, Lock, ArrowRight, RefreshCw } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import { googleLogin as googleLoginApi, resendVerification } from '@/api/authApi';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const { login, isLoading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleLogin = async () => {
    setLocalError(null);
    setShowResendOption(false);
    setResendStatus('idle');
    
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      const lowerError = errorMessage.toLowerCase();
      
      // Check if this is a verification required error
      if (lowerError.includes('verify') || lowerError.includes('verification')) {
        setShowResendOption(true);
        setLocalError(errorMessage + ' Use the button below to resend the verification email.');
      } else {
        setLocalError(errorMessage);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    
    setResendStatus('sending');
    try {
      const response = await resendVerification(email.trim());
      if (response.success) {
        setResendStatus('sent');
        setLocalError('Verification email sent! Check your inbox.');
      } else {
        setResendStatus('error');
        setLocalError(response.error || 'Failed to resend verification email');
      }
    } catch (err: any) {
      setResendStatus('error');
      setLocalError('Failed to resend verification email');
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsGoogleLoading(true);

    try {
      // In a real implementation, you would use a library like:
      // @react-native-google-signin/google-signin
      // to get the ID token from Google
      
      // For now, we'll show a message that Google sign-in
      // needs to be configured with the proper package
      setLocalError('Google Sign-In requires @react-native-google-signin package. Please install it to enable.');
      
      // Example implementation once package is installed:
      // import { GoogleSignin } from '@react-native-google-signin/google-signin';
      // await GoogleSignin.hasPlayServices();
      // const { idToken } = await GoogleSignin.signIn();
      // await googleLoginApi(idToken);
    } catch (err: any) {
      setLocalError(err.message || 'Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoToVerify = () => {
    if (!email.trim()) {
      setLocalError('Enter your email to verify your account');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    navigation.navigate('VerifyEmail', { email: normalizedEmail });
  };

  const displayError = localError || error;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-10">
            <View className="h-20 w-20 rounded-full bg-indigo-100 items-center justify-center mb-4">
              <GraduationCap size={48} color="#6366f1" />
            </View>
            <Text className="text-3xl font-bold text-slate-900 mb-2">AI Course Architect</Text>
            <Text className="text-base text-slate-500 text-center">
              Learn anything with AI-powered courses
            </Text>
          </View>

          {/* Form */}
          <View className="bg-white rounded-2xl p-6 shadow-sm shadow-black/10 border border-slate-100">
            {displayError && (
              <View className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-3 mb-4">
                <Text className="text-rose-600 text-sm">{displayError}</Text>
              </View>
            )}

            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 h-14 mb-4">
              <Mail size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 ml-3"
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 h-14 mb-4">
              <Lock size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 ml-3"
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`bg-indigo-500 rounded-xl h-14 flex-row items-center justify-center gap-2 mt-2 ${
                isLoading ? 'opacity-70' : ''
              }`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-base font-semibold">Sign In</Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Resend Verification Option */}
            {showResendOption && resendStatus !== 'sent' && (
              <TouchableOpacity
                className={`mt-4 flex-row items-center justify-center gap-2 py-3 ${
                  resendStatus === 'sending' ? 'opacity-70' : ''
                }`}
                onPress={handleResendVerification}
                disabled={resendStatus === 'sending'}
              >
                <RefreshCw size={18} color="#6366f1" />
                <Text className="text-indigo-500 text-sm font-semibold">
                  {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification Email'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Also show resend option if user has entered email but not tried to login yet */}
            {!showResendOption && email.trim() && !isLoading && (
              <TouchableOpacity
                className="mt-4 flex-row items-center justify-center gap-2 py-3"
                onPress={() => {
                  setShowResendOption(true);
                  setLocalError('Enter your password and try to login, or click below to resend verification email.');
                }}
              >
                <RefreshCw size={18} color="#6366f1" />
                <Text className="text-indigo-500 text-sm font-semibold">
                  Didn't receive verification email?
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="text-slate-400 text-sm mx-4">or</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              className={`bg-white border border-slate-200 rounded-xl h-14 flex-row items-center justify-center gap-3 ${
                isGoogleLoading ? 'opacity-70' : ''
              }`}
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#6366f1" />
              ) : (
                <>
                  <View className="h-6 w-6 rounded-full bg-white items-center justify-center shadow-sm">
                    <Text className="text-[18px] font-bold text-blue-500">G</Text>
                  </View>
                  <Text className="text-slate-700 text-base font-medium">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-8 gap-2">
            <Text className="text-slate-500 text-sm">Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-indigo-500 text-sm font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mt-3 gap-2">
            <Text className="text-slate-500 text-sm">Already received an OTP?</Text>
            <TouchableOpacity onPress={handleGoToVerify}>
              <Text className="text-indigo-500 text-sm font-semibold">Verify Email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
