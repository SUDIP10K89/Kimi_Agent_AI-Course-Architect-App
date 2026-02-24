# AI Course Architect - Backend

Node.js/Express backend for the AI Course Architect application.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API key | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | No |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload

## Architecture

```
src/
├── config/         # Configuration
│   ├── database.js # MongoDB connection
│   └── env.js      # Environment variables
├── controllers/    # Request handlers
├── middleware/     # Express middleware
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── requestValidator.js
├── models/         # Mongoose models
│   └── Course.js
├── routes/         # API routes
├── services/       # Business logic
│   ├── openaiService.js
│   ├── youtubeService.js
│   └── courseService.js
├── utils/          # Utilities
└── server.js       # Entry point
```

## API Documentation

### POST /api/courses/generate

Generate a new course from a topic.

**Request:**
```json
{
  "topic": "Machine Learning"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courseId": "...",
    "title": "Introduction to Machine Learning",
    "description": "...",
    "modulesCount": 5,
    "microTopicsCount": 15
  }
}
```

### GET /api/courses/:id

Get course with generation status.

**Response:**
```json
{
  "success": true,
  "data": {
    "course": { ... },
    "generationStatus": {
      "isComplete": false,
      "generatedCount": 5,
      "totalCount": 15,
      "percentage": 33
    }
  }
}
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_ERROR` - OpenAI API error
- `VIDEO_SERVICE_ERROR` - YouTube API error
