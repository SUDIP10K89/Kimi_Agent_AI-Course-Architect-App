/**
 * Navigation Types
 * 
 * Type definitions for React Navigation.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ============================================
// Auth Stack
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

// ============================================
// Home Stack
// ============================================

export type HomeStackParamList = {
  Home: undefined;
  GenerateCourse: undefined;
  PublicCourses: undefined;
  CourseDetail: { courseId: string };
  Lesson: { courseId: string; moduleId: string; microTopicId: string };
};

// ============================================
// Courses Stack
// ============================================

export type CoursesStackParamList = {
  CoursesList: undefined;
  GenerateCourse: undefined;
  PublicCourses: undefined;
  CourseDetail: { courseId: string };
  Lesson: { courseId: string; moduleId: string; microTopicId: string };
};

// ============================================
// Main Tab Navigator
// ============================================

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CoursesTab: NavigatorScreenParams<CoursesStackParamList>;
  ExploreTab: NavigatorScreenParams<CoursesStackParamList>;
  GenerateTab: NavigatorScreenParams<CoursesStackParamList>;
  Settings: undefined;
};

// ============================================
// Root Navigator
// ============================================

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// ============================================
// Screen Props Types
// ============================================

// Auth Stack Props
export type LoginScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Login'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type SignupScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Signup'>,
  BottomTabScreenProps<MainTabParamList>
>;

// Home Stack Props
export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type CourseDetailScreenProps = NativeStackScreenProps<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;

export type LessonScreenProps = NativeStackScreenProps<HomeStackParamList | CoursesStackParamList, 'Lesson'>;

// Courses Stack Props
export type CoursesListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<CoursesStackParamList, 'CoursesList'>,
  BottomTabScreenProps<MainTabParamList>
>;

// Tab Props
export type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type MainTabScreenProps = BottomTabScreenProps<MainTabParamList>;
