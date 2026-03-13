/**
 * AI Course Architect - Main App Component
 * 
 * Root component that sets up routing, theme, and course context.
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CourseProvider } from '@/contexts/CourseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseViewer from '@/components/CourseViewer';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import SettingsPage from '@/pages/SettingsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import OfflinePage from '@/components/OfflinePage';
import InstallPWA from '@/components/InstallPWA';
import { usePWA } from '@/hooks/usePWA';
import './App.css';

const PWAInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = usePWA()
  const [accessAnyway, setAccessAnyway] = useState(false)
  
  // Show offline page when not online, unless user chose to access anyway
  if (!isOnline && !accessAnyway) {
    return <OfflinePage onAccessAnyway={() => setAccessAnyway(true)} />
  }
  
  return <>{children}</>
}

const App: React.FC = () => {

  return (
    <ThemeProvider>
      <AuthProvider>
        <CourseProvider>
          <Router>
            <PWAInitializer>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/courses"
                  element={
                    <ProtectedRoute>
                      <CoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses/:courseId"
                  element={
                    <ProtectedRoute>
                      <CourseViewer />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </PWAInitializer>
          </Router>
          <Toaster position="top-right" richColors />
          <InstallPWA />
        </CourseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
