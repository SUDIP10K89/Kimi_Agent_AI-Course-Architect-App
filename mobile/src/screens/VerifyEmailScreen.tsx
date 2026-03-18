/**
 * Verify Email Screen
 * 
 * Screen for email verification using OTP.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GraduationCap, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import { verifyEmail, resendVerification } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';

type VerifyEmailRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;
type VerifyEmailNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error' | 'resend';

const VerifyEmailScreen: React.FC = () => {
  const navigation = useNavigation<VerifyEmailNavigationProp>();
  const route = useRoute<VerifyEmailRouteProp>();
  const { completeAuth } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState('Enter the OTP sent to your email');
  const [email, setEmail] = useState<string>(route.params?.email || '');
  const [otp, setOtp] = useState<string>('');

  useEffect(() => {
    // If email is passed in params, we're ready to verify
    if (email) {
      setStatus('idle');
    }
  }, [email]);

  const handleVerify = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setStatus('error');
      return;
    }
    
    if (!otp.trim()) {
      setMessage('Please enter the OTP');
      setStatus('error');
      return;
    }

    if (otp.trim().length !== 6) {
      setMessage('OTP must be 6 digits');
      setStatus('error');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('Verifying...');

      const response = await verifyEmail(email.trim(), otp.trim());

      if (response.success && response.data) {
        setStatus('success');
        setMessage('Email verified successfully!');

        // Store auth and let navigator switch to Main
        await completeAuth(response.data);
      } else {
        setStatus('error');
        setMessage(response.error || 'Invalid or expired OTP');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.error || error.message || 'Invalid or expired OTP');
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('Sending OTP...');

      const response = await resendVerification(email.trim());

      if (response.success) {
        setMessage(response.data?.message || 'OTP sent! Check your inbox.');
        setStatus('idle');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to resend OTP');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <View className="items-center w-full">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-500 dark:text-slate-400 text-base text-center mt-4 px-5">{message}</Text>
          </View>
        );

      case 'success':
        return (
          <View className="items-center w-full">
            <CheckCircle size={64} color="#10b981" />
            <Text className="text-slate-500 dark:text-slate-400 text-base text-center mt-4 px-5">{message}</Text>
            <Text className="text-emerald-600 dark:text-emerald-300 text-sm mt-2">Redirecting to home...</Text>
          </View>
        );

      case 'error':
        return (
          <View className="items-center w-full">
            <AlertCircle size={64} color="#ef4444" />
            <Text className="text-slate-500 dark:text-slate-400 text-base text-center mt-4 px-5">{message}</Text>
            <TouchableOpacity className="bg-indigo-600 dark:bg-indigo-500 rounded-xl py-3 px-6 mt-5" onPress={() => navigation.navigate('Login')}>
              <Text className="text-white font-semibold">Back to Login</Text>
            </TouchableOpacity>
          </View>
        );

      case 'resend':
      case 'idle':
      default:
        return (
          <View className="items-center w-full">
            <Mail size={64} color="#6366f1" />
            <Text className="text-slate-900 dark:text-white text-2xl font-bold mt-4">Verify Your Email</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-base text-center mt-3 px-5">{message}</Text>

            <View className="w-full mt-5">
              <TextInput
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-slate-900 dark:text-white text-base"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="w-full mt-4">
              <TextInput
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-slate-900 dark:text-white text-base"
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9ca3af"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              className="bg-indigo-600 dark:bg-indigo-500 rounded-xl py-3 px-6 mt-5 w-full items-center"
              onPress={handleVerify}
            >
              <Text className="text-white font-semibold">Verify Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 flex-row items-center justify-center gap-2 py-3"
              onPress={handleResend}
            >
              <RefreshCw size={18} color="#6366f1" />
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Resend OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-2 py-2"
              onPress={() => navigation.navigate('Login')}
            >
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Back to Login</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 justify-center items-center px-6">
        <View className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 items-center justify-center mb-6">
          <GraduationCap size={48} color="#6366f1" />
        </View>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

export default VerifyEmailScreen;
