# AI Course Architect

A full-stack AI-powered web application that automatically generates comprehensive courses from a single user input topic.

## Features

- **AI-Powered Course Generation**: Enter any topic and get a structured course with modules and micro-topics
- **Detailed Lesson Content**: Each lesson includes explanation, real-world examples, analogies, key takeaways, and practice questions
- **Curated Videos**: Automatically fetches relevant YouTube videos for each topic
- **Progress Tracking**: Track your learning progress across all courses
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **OpenAI API** for content generation
- **YouTube Data API** for video fetching

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

## Project Structure

```
ai-course-architect/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Main server file
│   ├── .env.example        # Environment variables template
│   └── package.json
│
└── frontend/               # React frontend
    ├── src/
    │   ├── api/           # API client
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts
    │   ├── pages/         # Page components
    │   ├── types/         # TypeScript types
    │   ├── App.tsx        # Main app component
    │   └── main.tsx       # Entry point
    ├── .env.example       # Environment variables template
    └── package.json
```

## Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- OpenAI API key
- YouTube Data API key

## Setup Instructions

### 1. Clone and Navigate

```bash
cd ai-course-architect
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API keys
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 4. Environment Variables

#### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-course-architect

# APIs (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## API Key Setup

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key
5. Copy the key to your backend `.env` file

### YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **YouTube Data API v3**
4. Go to Credentials → Create Credentials → API Key
5. Copy the key to your backend `.env` file

## Running Locally

### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### Access the Application

Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed service status

### Courses
- `POST /api/courses/generate` - Generate new course
- `GET /api/courses` - List all courses
- `GET /api/courses/recent` - Get recent courses
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/:id/status` - Get generation status
- `POST /api/courses/:id/modules/:moduleId/topics/:topicId/generate` - Generate micro-topic content
- `POST /api/courses/:id/modules/:moduleId/topics/:topicId/complete` - Mark as complete
- `POST /api/courses/:id/modules/:moduleId/regenerate` - Regenerate module
- `POST /api/courses/:id/archive` - Archive course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/:id/export` - Export course
- `GET /api/courses/stats/overview` - Get statistics

## Database Schema

### Course
```javascript
{
  title: String,
  description: String,
  topic: String,
  difficulty: String,
  modules: [{
    title: String,
    microTopics: [{
      title: String,
      content: {
        explanation: String,
        example: String,
        analogy: String,
        keyTakeaways: [String],
        practiceQuestions: [{ question: String, answer: String }]
      },
      videos: [{ videoId, title, description, thumbnailUrl, channelTitle, duration }]
    }]
  }],
  progress: { completedMicroTopics, totalMicroTopics, percentage }
}
```

## Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "ai-course-architect"
   ```
3. Set up MongoDB Atlas for cloud database
4. Configure CORS for your domain

### Frontend

1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `dist/` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Or serve with Nginx

### Environment Variables for Production

```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-course-architect
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...
CORS_ORIGIN=https://yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com/api
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running locally
   - Check MONGODB_URI in .env

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota on OpenAI dashboard

3. **YouTube API Errors**
   - Verify API key is correct
   - Check API quota on Google Cloud Console
   - Ensure YouTube Data API v3 is enabled

4. **CORS Errors**
   - Add frontend URL to CORS_ORIGIN in backend .env

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
