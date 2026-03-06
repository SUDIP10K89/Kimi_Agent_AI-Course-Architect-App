# AI Course Architect

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/MongoDB-%234ea94b?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-yellow?style=for-the-badge&logo=openai" alt="OpenAI">
</p>

> An AI-powered application that generates comprehensive courses from any topic. Courses include structured modules, micro-topics, AI-generated lesson content (explanations, examples, analogies, and practice questions), and relevant YouTube videos.

LIVE : https://coursexai.vercel.app

## 🚀 Features

### Course Generation
- **AI-Powered Content**: Uses OpenAI's SDK to generate detailed course content
- **Structured Learning**: Courses are organized into modules and micro-topics
- **Rich Lesson Content**: Each lesson includes:
  - Comprehensive explanations
  - Practical examples
  - Memorable analogies
  - Key takeaways
  - Practice questions with answers

### Video Integration
- **YouTube Integration**: Automatically fetches relevant educational videos
- **Multiple Videos per Topic**: Each micro-topic can include up to 3 relevant videos
- **Video Metadata**: Title, description, thumbnail, channel, and duration

### User Management
- **User Authentication**: Secure JWT-based authentication
- **User Dashboard**: View and manage generated courses
- **Progress Tracking**: Mark lessons as completed

### Real-time Updates
- **Server-Sent Events (SSE)**: Real-time course generation progress
- **Status Tracking**: Monitor generation status with detailed progress

## 🏗️ Architecture

```
ai-course-architect/
├── backend/                 # Express.js REST API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── package.json
│
└── app/                     # React Frontend (Vite + TypeScript)
    ├── src/
    │   ├── api/           # API client functions
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts
    │   ├── hooks/         # Custom React hooks
    │   ├── pages/         # Page components
    │   ├── types/         # TypeScript definitions
    │   └── utils/         # Utility functions
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI**: OpenAI SDK (User can add their own OpenAI-compatible endpoint)
- **Video**: YouTube Data API v3
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or Atlas cloud)
3. **OpenAI Compatible API Key** (for AI content generation) (You can use OpenRouter or other OpenAI-compatible endpoints)
4. **YouTube Data API Key** (for video fetching)

## ⚙️ Installation

### 1. Clone the Repository

```bash
cd ai-course-architect
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-course-architect

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
# Optional: Use OpenRouter or other OpenAI-compatible endpoints
# OPENAI_BASE_URL=https://openrouter.ai/api/v1

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_MAX_RESULTS=3

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# CORS Origins (comma-separated)
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Start the backend server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# From the project root
cd app
npm install
```

Create a `.env` file in the `app` directory:

```env
# API Base URL
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📖 API Documentation

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Course Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/generate` | Generate a new course (requires auth + SSE) |
| GET | `/api/courses` | Get all courses for current user |
| GET | `/api/courses/stats/overview` | Get course statistics |
| GET | `/api/courses/recent` | Get recent courses |
| GET | `/api/courses/:id` | Get course by ID |
| GET | `/api/courses/:id/status` | Get generation status (SSE) |
| PUT | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course |
| PATCH | `/api/courses/:id/lessons/:lessonId` | Mark lesson as completed |

### Health Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint |
| GET | `/api/health/db` | Database connection status |

### SSE (Server-Sent Events)

- **Course Generation**: Connect to `/api/courses/:id/status` to receive real-time updates on course generation progress

## 🔐 Environment Variables Reference

### Backend (.env)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | 5000 |
| `NODE_ENV` | No | Environment | development |
| `MONGODB_URI` | Yes | MongoDB connection string | - |
| `OPENAI_API_KEY` | Yes | OpenAI API key | - |
| `OPENAI_MODEL` | No | OpenAI model to use | gpt-4 |
| `OPENAI_BASE_URL` | No | Custom OpenAI endpoint | - |
| `YOUTUBE_API_KEY` | Yes | YouTube Data API key | - |
| `YOUTUBE_MAX_RESULTS` | No | Max videos per topic | 3 |
| `JWT_SECRET` | Yes | JWT signing secret | - |
| `JWT_EXPIRES_IN` | No | JWT expiration time | 7d |
| `CORS_ORIGIN` | No | Allowed CORS origins | localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (ms) | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | 100 |

### Frontend (.env)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_URL` | No | Backend API URL | http://localhost:5000 |

## 📁 Project Structure

### Backend Structure

```
backend/src/
├── config/
│   ├── database.js         # MongoDB connection
│   └── env.js              # Environment configuration
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── courseController.js # Course CRUD & generation
│   └── userController.js   # User management
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── errorHandler.js     # Error handling
│   └── rateLimiter.js      # Rate limiting
├── models/
│   ├── Course.js           # Course schema
│   └── User.js             # User schema
├── routes/
│   ├── authRoutes.js       # Auth endpoints
│   ├── courseRoutes.js     # Course endpoints
│   ├── healthRoutes.js     # Health check endpoints
│   ├── sseRoutes.js        # SSE endpoints
│   └── userRoutes.js       # User endpoints
├── services/
│   ├── courseService.js    # Course business logic
│   ├── openaiService.js    # OpenAI integration
│   └── youtubeService.js   # YouTube API integration
├── utils/
│   ├── logger.js           # Logging utility
│   └── sse.js              # SSE helpers
└── server.js               # Express app entry point
```

### Frontend Structure

```
app/src/
├── api/
│   ├── authApi.ts          # Auth API calls
│   ├── client.ts           # Axios client setup
│   ├── courseApi.ts        # Course API calls
│   └── settingsApi.ts      # Settings API calls
├── components/
│   ├── CourseGenerator.tsx # Course generation form
│   ├── CourseList.tsx      # Course listing
│   ├── CourseViewer.tsx    # Course content viewer
│   ├── LessonContent.tsx   # Lesson display
│   ├── Layout/
│   │   ├── Header.tsx      # App header
│   │   └── Sidebar.tsx     # Navigation sidebar
│   └── ui/                 # shadcn/ui components
├── contexts/
│   ├── AuthContext.tsx     # Auth state management
│   ├── CourseContext.tsx   # Course state management
│   └── ThemeContext.tsx    # Theme management
├── pages/
│   ├── CoursesPage.tsx     # Courses dashboard
│   ├── HomePage.tsx        # Landing/home page
│   ├── LoginPage.tsx       # Login form
│   ├── SettingsPage.tsx    # User settings
│   └── SignupPage.tsx      # Registration form
├── types/
│   └── index.ts            # TypeScript interfaces
└── utils/
    └── sse.ts              # SSE client utilities
```

## 🔧 Scripts

### Backend

```bash
cd backend
npm run dev    # Start in development mode with nodemon
npm start      # Start in production mode
npm test       # Run tests
```

### Frontend

```bash
cd app
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run ESLint
npm run preview # Preview production build
```

## 📦 Dependencies

### Backend Key Dependencies

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `openai` - OpenAI API client
- `googleapis` - YouTube Data API
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `helmet` - Security headers
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting

### Frontend Key Dependencies

- `react` - UI framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `tailwindcss` - Styling
- `shadcn/ui` - Component library
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `lucide-react` - Icons
- `recharts` - Charts
- `sonner` - Toast notifications


## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT models
- [YouTube](https://www.youtube.com/) for video content
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling
