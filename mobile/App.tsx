/**
 * AI Course Architect - Mobile App
 * 
 * Main entry point for the React Native application.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { CourseProvider } from '@/contexts/CourseContext';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CourseProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </CourseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
