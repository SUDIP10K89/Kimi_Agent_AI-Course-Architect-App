/**
 * Splash Screen
 */

import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GraduationCap } from 'lucide-react-native';
import type { AuthStackParamList } from '@/navigation/types';

type SplashNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="h-24 w-24 rounded-3xl bg-indigo-100 dark:bg-indigo-500/20 items-center justify-center mb-6">
            <GraduationCap size={56} color="#6366f1" />
          </View>
          <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            AI Course Architect
          </Text>
          <Text className="text-base text-slate-500 dark:text-slate-400 text-center">
            Your work, secured
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-3">
            Build structured learning paths with AI and keep your progress protected.
          </Text>
        </View>

        <TouchableOpacity
          className="bg-indigo-600 dark:bg-indigo-500 rounded-xl h-14 items-center justify-center"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-white text-base font-semibold">Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;

