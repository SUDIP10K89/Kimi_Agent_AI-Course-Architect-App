/**
 * Set New Password Screen
 */

import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/components/auth/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { resetPassword as resetPasswordApi } from '@/api/authApi';

type SetNewPasswordRouteProp = RouteProp<AuthStackParamList, 'SetNewPassword'>;
type SetNewPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SetNewPassword'>;

const SetNewPasswordScreen: React.FC = () => {
  const navigation = useNavigation<SetNewPasswordNavigationProp>();
  const route = useRoute<SetNewPasswordRouteProp>();
  const { completeAuth } = useAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const passwordShake = useShake();
  const confirmShake = useShake();

  const { email, resetToken } = route.params;

  const handleReset = async () => {
    if (password.length < 8) {
      passwordShake.triggerShake();
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (confirm !== password) {
      confirmShake.triggerShake();
      showToast("Passwords don't match", 'error');
      return;
    }

    try {
      const response = await resetPasswordApi(email, resetToken, password);
      if (response.success) {
        await completeAuth(response.data);
        showToast("Password reset! You're in ✓", 'success');
        return;
      }
      showToast(response.error || 'Password reset failed', 'error');
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-6 pt-4">
        <TouchableOpacity className="flex-row items-center gap-2" onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#64748b" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Back</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Set new password</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">Use at least 8 characters.</Text>

        <Animated.View style={passwordShake.animatedStyle}>
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14 mb-3">
            <Lock size={20} color="#6b7280" />
            <TextInput
              className="flex-1 text-base text-slate-900 dark:text-white ml-3"
              placeholder="New password"
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

        <View className="mt-4">
          <Animated.View style={confirmShake.animatedStyle}>
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 h-14">
            <Lock size={20} color="#6b7280" />
            <TextInput
              className="flex-1 text-base text-slate-900 dark:text-white ml-3"
              placeholder="Confirm password"
              placeholderTextColor="#9ca3af"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            </View>
          </Animated.View>
        </View>

        <TouchableOpacity
          className="bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 items-center justify-center mt-6"
          onPress={handleReset}
        >
          <Text className="text-white text-base font-semibold">Reset Password</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SetNewPasswordScreen;
