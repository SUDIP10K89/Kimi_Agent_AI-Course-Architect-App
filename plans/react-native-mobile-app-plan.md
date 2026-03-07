# AI Course Architect - React Native Mobile App Plan

## Project Overview

**Goal**: Create a React Native mobile app that clones the functionality of the existing AI Course Architect website.

## Technical Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Local Storage**: AsyncStorage
- **API**: Same backend as web app (configurable via environment variable)

## Project Structure

```
mobile/
├── App.tsx                    # Root component
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces (matching web app)
│   ├── api/
│   │   ├── client.ts         # Axios instance with interceptors
│   │   ├── authApi.ts        # Authentication endpoints
│   │   └── courseApi.ts      # Course management endpoints
│   ├── contexts/
│   │   ├── AuthContext.tsx   # Auth state management
│   │   └── CourseContext.tsx # Course state management
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CoursesScreen.tsx
│   │   ├── CourseDetailScreen.tsx
│   │   ├── LessonScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── CourseCard.tsx
│   │   ├── CourseGenerator.tsx
│   │   ├── ModuleAccordion.tsx
│   │   ├── LessonContent.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── LoadingSpinner.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── utils/
│       └── storage.ts        # AsyncStorage helpers
```

## Features to Implement

### 1. Authentication
- Login with email/password
- Signup with name/email/password
- Token management with AsyncStorage
- Auto-logout on 401

### 2. Home Screen
- App branding and features showcase
- Quick stats (total courses, progress)
- Recent courses list
- Quick generate course button
- Suggested topics

### 3. Course Management
- List all courses with search/filter
- Generate new course from topic
- View course details with modules
- Track completion progress
- Mark lessons as complete

### 4. Course Content
- Module navigation (accordion style)
- Lesson content display (explanation, examples, analogies)
- YouTube video integration
- Practice questions

### 5. Settings
- User profile display
- Theme preference (light/dark)
- Logout functionality

### 6. Offline Support
- Cache courses locally
- Show offline indicator
- Sync when back online

## API Endpoints (from existing backend)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/courses` - Get all courses
- `POST /api/courses/generate` - Generate new course
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id/progress` - Update progress
- `GET /api/courses/stats` - Get course statistics

## Navigation Flow

```
AuthStack (when logged out)
├── LoginScreen
└── SignupScreen

MainTab (when logged in)
├── HomeStack
│   ├── HomeScreen
│   ├── CourseDetailScreen
│   └── LessonScreen
├── CoursesStack
│   ├── CoursesListScreen
│   └── CourseDetailScreen
└── SettingsScreen
```

## Next Steps

Once approved, the implementation will proceed step by step according to the todo list.
