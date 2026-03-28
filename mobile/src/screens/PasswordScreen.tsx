/**
 * Password Screen (existing user)
 */

import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/components/auth/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';

type PasswordRouteProp = RouteProp<AuthStackParamList, 'Password'>;
type PasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Password'>;

const PasswordScreen: React.FC = () => {
  const navigation = useNavigation<PasswordNavigationProp>();
  const route = useRoute<PasswordRouteProp>();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { animatedStyle, triggerShake } = useShake();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const email = route.params.email;

  const handleSignIn = async () => {
    if (!password.trim()) {
      triggerShake();
      showToast('Please enter your password', 'error');
      return;
    }

    try {
      await login({ email, password });
      showToast('Signed in successfully', 'success');
    } catch (err: any) {
      triggerShake();
      showToast(err.message || 'Login failed', 'error');
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
        <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Enter Password</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">{email}</Text>

        <Animated.View style={animatedStyle}>
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14 mb-4">
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

        <TouchableOpacity
          className="bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 items-center justify-center"
          onPress={handleSignIn}
        >
          <Text className="text-white text-base font-semibold">Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-5 items-center"
          onPress={() => navigation.navigate('ForgotPassword', { email })}
        >
          <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PasswordScreen;
