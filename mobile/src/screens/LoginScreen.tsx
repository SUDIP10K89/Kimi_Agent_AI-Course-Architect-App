/**
 * Login Screen
 *
 * Entry point for auth with email or Google.
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GraduationCap, Mail } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/components/auth/ToastProvider';
import { isValidEmail } from '@/utils/auth';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const { showToast } = useToast();
  const { animatedStyle, triggerShake } = useShake();

  const handleContinueEmail = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      triggerShake();
      showToast('Please enter a valid email', 'error');
      return;
    }
    navigation.navigate('Password', { email: normalizedEmail });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 items-center justify-center mb-4">
            <GraduationCap size={48} color="#6366f1" />
          </View>
          <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back
          </Text>
          <Text className="text-base text-slate-500 dark:text-slate-400 text-center">
            Sign in to keep learning
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm shadow-black/10 border border-slate-100 dark:border-slate-800">
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
            onPress={handleContinueEmail}
          >
            <Text className="text-white text-base font-semibold">Continue with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-14 flex-row items-center justify-center gap-3"
            onPress={() => navigation.navigate('GoogleOAuthLoading', { email })}
          >
            <View className="h-6 w-6 rounded-full bg-white items-center justify-center shadow-sm">
              <Text className="text-[18px] font-bold text-blue-500">G</Text>
            </View>
            <Text className="text-slate-700 dark:text-slate-200 text-base font-medium">
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 items-center">
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} className="mt-2">
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
              Create account
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
