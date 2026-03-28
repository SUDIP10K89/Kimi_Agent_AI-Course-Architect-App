/**
 * Register OTP Screen
 */

import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';
import OtpInput from '@/components/auth/OtpInput';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/components/auth/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { verifyEmail, resendVerification } from '@/api/authApi';

type RegisterOtpRouteProp = RouteProp<AuthStackParamList, 'RegisterOtp'>;
type RegisterOtpNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterOtp'>;

const RegisterOtpScreen: React.FC = () => {
  const navigation = useNavigation<RegisterOtpNavigationProp>();
  const route = useRoute<RegisterOtpRouteProp>();
  const { completeAuth } = useAuth();
  const { showToast } = useToast();
  const { animatedStyle, triggerShake } = useShake();
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [hasError, setHasError] = useState(false);

  const { name, email, resetKey } = route.params;

  useEffect(() => {
    setOtp('');
    setHasError(false);
    setTimeLeft(120);
  }, [resetKey]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const timeLabel = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      triggerShake();
      showToast('Please enter the full code', 'error');
      return;
    }
    if (otp === '000000') {
      setHasError(true);
      triggerShake();
      showToast('Wrong code. Try again', 'error');
      return;
    }

    try {
      const response = await verifyEmail(email, otp);
      if (response.success) {
        await completeAuth(response.data);
        showToast('Account created! Welcome 🎉', 'success');
        return;
      }
      showToast(response.error || 'Verification failed', 'error');
    } catch (err: any) {
      setHasError(true);
      triggerShake();
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  const handleResend = async () => {
    try {
      const response = await resendVerification(email);
      if (response.success) {
        setTimeLeft(120);
        setOtp('');
        setHasError(false);
        showToast('New code sent!', 'success');
        return;
      }
      showToast(response.error || 'Failed to resend code', 'error');
    } catch (err: any) {
      showToast(err.message || 'Failed to resend code', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-6 pt-4">
        <TouchableOpacity className="flex-row items-center gap-2" onPress={() => navigation.navigate('Register')}>
          <ArrowLeft size={18} color="#64748b" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center px-6">
        <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Verify your email</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Enter the 6-digit code sent to {email}
        </Text>

        <Animated.View style={animatedStyle}>
          <OtpInput value={otp} onChange={(value) => { setOtp(value); setHasError(false); }} hasError={hasError} />
        </Animated.View>

        {timeLeft > 0 ? (
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-4 text-center">
            Code expires in {timeLabel}
          </Text>
        ) : (
          <TouchableOpacity className="mt-4 items-center" onPress={handleResend}>
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Resend code</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 items-center justify-center mt-6"
          onPress={handleVerify}
        >
          <Text className="text-white text-base font-semibold">Verify & Create Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RegisterOtpScreen;
