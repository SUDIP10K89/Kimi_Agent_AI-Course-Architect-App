/**
 * Verify Email Screen
 * 
 * Screen for email verification using OTP.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  const { login } = useAuth();

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

        // Auto-login after verification
        await login({
          email: response.data.user.email,
          password: '',
        });
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Invalid or expired OTP');
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
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.message}>{message}</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.statusContainer}>
            <CheckCircle size={64} color="#10b981" />
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.successText}>Redirecting to home...</Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.statusContainer}>
            <AlertCircle size={64} color="#ef4444" />
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        );

      case 'resend':
      case 'idle':
      default:
        return (
          <View style={styles.statusContainer}>
            <Mail size={64} color="#6366f1" />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9ca3af"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerify}
            >
              <Text style={styles.buttonText}>Verify Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
            >
              <RefreshCw size={18} color="#6366f1" />
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <GraduationCap size={48} color="#6366f1" />
        </View>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  successText: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 8,
  },
  inputContainer: {
    width: '100%',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  resendButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VerifyEmailScreen;
