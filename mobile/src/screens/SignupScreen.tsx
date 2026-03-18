/**
 * Signup Screen
 * 
 * User registration screen with name, email, and password.
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
import { GraduationCap, Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';

type SignupNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<SignupNavigationProp>();
  const { signup, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const goToVerifyEmail = (normalizedEmail: string) => {
    navigation.navigate('VerifyEmail', { email: normalizedEmail });
  };

  const handleSignup = async () => {
    setLocalError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await signup({ name: name.trim(), email: normalizedEmail, password });
      console.log('[SIGNUP DEBUG] Signup result:', result);
      // Only navigate to OTP verification when the API requires it
      if (result?.requiresVerification === true) {
        goToVerifyEmail(normalizedEmail);
      }
    } catch (err: any) {
      console.log('[SIGNUP DEBUG] Caught error:', err.message);
      // Check if this is a verification required message
      if (err.message?.includes('verify your email') || err.message?.includes('verify your account')) {
        const normalizedEmail = email.trim().toLowerCase();
        goToVerifyEmail(normalizedEmail);
      } else {
        setLocalError(err.message || 'Signup failed. Please try again.');
      }
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <View className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 items-center justify-center mb-4">
              <GraduationCap size={48} color="#6366f1" />
            </View>
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</Text>
            <Text className="text-base text-slate-500 dark:text-slate-400 text-center">
              Start your AI-powered learning journey
            </Text>
          </View>

          {/* Form */}
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm shadow-black/10 border border-slate-100 dark:border-slate-800">
            {displayError && (
              <View className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30 rounded-lg px-3 py-3 mb-4">
                <Text className="text-rose-600 dark:text-rose-200 text-sm">{displayError}</Text>
              </View>
            )}

            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14 mb-4">
              <User size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 dark:text-white ml-3"
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14 mb-4">
              <Mail size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 dark:text-white ml-3"
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14 mb-4">
              <Lock size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 dark:text-white ml-3"
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14 mb-4">
              <Lock size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 dark:text-white ml-3"
                placeholder="Confirm Password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 flex-row items-center justify-center gap-2 mt-2 ${
                isLoading ? 'opacity-70' : ''
              }`}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-base font-semibold">Create Account</Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-8 gap-2">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
