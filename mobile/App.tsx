/**
 * AI Course Architect - Mobile App
 * 
 * Main entry point for the React Native application.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CourseProvider } from '@/contexts/CourseContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import AppNavigator from '@/navigation/AppNavigator';
import { registerLogoutCallback } from '@/api/client';

// Component to register logout callback after AuthContext is available
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  
  useEffect(() => {
    // Register the logout callback for 401 handling
    registerLogoutCallback(() => {
      logout();
    });
  }, [logout]);
  
  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthInitializer>
            <CourseProvider>
              <AppShell />
            </CourseProvider>
          </AuthInitializer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
