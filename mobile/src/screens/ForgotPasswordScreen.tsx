/**
 * Forgot Password Screen
 */

import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mail } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/components/auth/ToastProvider';
import { isValidEmail } from '@/utils/auth';
import { forgotPassword as forgotPasswordApi } from '@/api/authApi';

type ForgotRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotNavigationProp>();
  const route = useRoute<ForgotRouteProp>();
  const [email, setEmail] = useState(route.params?.email || '');
  const { showToast } = useToast();
  const { animatedStyle, triggerShake } = useShake();

  const handleSend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      triggerShake();
      showToast('Please enter a valid email', 'error');
      return;
    }

    try {
      const response = await forgotPasswordApi(normalizedEmail);
      if (response.success) {
        navigation.navigate('ResetOtp', { email: normalizedEmail, resetKey: Date.now() });
        showToast('Reset code sent!', 'success');
        return;
      }
      showToast(response.error || 'Failed to send reset code', 'error');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset code', 'error');
    }
  };

  const handleBack = () => {
    if (email.trim()) {
      navigation.navigate('Password', { email: email.trim().toLowerCase() });
      return;
    }
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-6 pt-4">
        <TouchableOpacity className="flex-row items-center gap-2" onPress={handleBack}>
          <ArrowLeft size={18} color="#64748b" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Back</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Forgot password?</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          We&apos;ll send a reset code to your email.
        </Text>

        <Animated.View style={animatedStyle}>
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
        </Animated.View>

        <TouchableOpacity
          className="bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 items-center justify-center"
          onPress={handleSend}
        >
          <Text className="text-white text-base font-semibold">Send Reset Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
            Back to sign in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
