/**
 * Register Screen
 */

import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Mail, User, Lock } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/components/auth/ToastProvider';
import { isValidEmail } from '@/utils/auth';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { signup as signupApi } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavigationProp>();
  const { showToast } = useToast();
  const { completeAuth } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const nameShake = useShake();
  const emailShake = useShake();
  const passwordShake = useShake();

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      nameShake.triggerShake();
      showToast('Please enter your name', 'error');
      return;
    }
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      emailShake.triggerShake();
      showToast('Please enter a valid email', 'error');
      return;
    }
    if (password.length < 8) {
      passwordShake.triggerShake();
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const response = await signupApi({ name: name.trim(), email: normalizedEmail, password });
      if (response.success && response.data?.requiresVerification) {
        navigation.navigate('RegisterOtp', {
          name: name.trim(),
          email: normalizedEmail,
          resetKey: Date.now(),
        });
        showToast(`Code sent to ${normalizedEmail}`, 'success');
        return;
      }
      if (response.success && response.data?.token) {
        await completeAuth(response.data);
        showToast('Account created!', 'success');
        return;
      }
      showToast(response.error || 'Signup failed', 'error');
    } catch (err: any) {
      showToast(err.message || 'Signup failed', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-6 pt-4">
        <TouchableOpacity className="flex-row items-center gap-2" onPress={() => navigation.navigate('Login')}>
          <ArrowLeft size={18} color="#64748b" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Back</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Create Account</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">Get started in seconds</Text>

        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm shadow-black/10 border border-slate-100 dark:border-slate-800">
          <Animated.View style={nameShake.animatedStyle}>
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
          </Animated.View>

          <Animated.View style={emailShake.animatedStyle}>
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

          <Animated.View style={passwordShake.animatedStyle}>
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14">
              <Lock size={20} color="#6b7280" />
              <TextInput
                className="flex-1 text-base text-slate-900 dark:text-white ml-3"
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!visible}
              />
              <TouchableOpacity onPress={() => setVisible(!visible)}>
                {visible ? <Eye size={18} color="#6366f1" /> : <EyeOff size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </Animated.View>

          <PasswordStrength password={password} />

          <TouchableOpacity
            className="bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 items-center justify-center mt-6"
            onPress={handleSendCode}
          >
            <Text className="text-white text-base font-semibold">Send Verification Code</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 items-center">
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} className="mt-2">
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;
