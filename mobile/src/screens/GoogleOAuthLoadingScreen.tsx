/**
 * Google OAuth Loading Screen
 */

import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthStackParamList } from '@/navigation/types';
import { googleLogin } from '@/api/authApi';
import { useToast } from '@/components/auth/ToastProvider';

type GoogleOAuthRouteProp = RouteProp<AuthStackParamList, 'GoogleOAuthLoading'>;
type GoogleOAuthNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'GoogleOAuthLoading'>;

const GoogleOAuthLoadingScreen: React.FC = () => {
  const route = useRoute<GoogleOAuthRouteProp>();
  const navigation = useNavigation<GoogleOAuthNavigationProp>();
  const { completeAuth } = useAuth();
  const { showToast } = useToast();
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  useEffect(() => {
    const run = async () => {
      if (!webClientId) {
        showToast('Missing Google client ID', 'error');
        navigation.navigate('Login');
        return;
      }

      try {
        GoogleSignin.configure({
          webClientId,
        });

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const result: any = await GoogleSignin.signIn();
        const idToken = result?.idToken ?? result?.data?.idToken;
        if (!idToken) {
          throw new Error('Google Sign-In failed to return an ID token');
        }

        const response = await googleLogin(idToken);
        if (response.success) {
          await completeAuth(response.data);
          showToast('Signed in with Google', 'success');
          return;
        }
        throw new Error(response.error || 'Google login failed');
      } catch (err: any) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          showToast('Google sign-in cancelled', 'error');
        } else if (err.code === statusCodes.IN_PROGRESS) {
          showToast('Google sign-in in progress', 'error');
        } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          showToast('Google Play Services not available', 'error');
        } else {
          showToast(err.message || 'Google login failed', 'error');
        }
        navigation.navigate('Login');
      }
    };

    run();
  }, [completeAuth, navigation, showToast, webClientId]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 justify-center items-center px-6">
        <View className="h-16 w-16 rounded-full bg-white items-center justify-center shadow-sm mb-4">
          <Text className="text-2xl font-bold text-blue-500">G</Text>
        </View>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-600 dark:text-slate-300 text-base mt-4">
          Authenticating your account...
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default GoogleOAuthLoadingScreen;
