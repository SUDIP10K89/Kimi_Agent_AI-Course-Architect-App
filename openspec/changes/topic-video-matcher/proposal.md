## Why

We need to match user-provided topics to relevant educational videos for course generation. Currently, the system may rely on keyword matching or other less accurate methods. By converting both the topic and video metadata (title, description) into embedding vectors using a powerful model like Gemini, we can compute semantic similarity to find the most relevant videos. This improves the accuracy and quality of video recommendations for course generation.

## What Changes

- Add a new capability for topic-to-video matching using embedding vectors and cosine similarity.
- This will involve creating a new service or modifying existing services to generate embeddings for topics and videos.
- We will use the Gemini embedding model for generating embeddings.
- We will compute cosine similarity between the topic embedding and video embeddings to rank videos.

## Capabilities

### New Capabilities
- `topic-video-matching`: Match a topic string to a list of videos by converting both to embedding vectors and computing cosine similarity.

### Modified Capabilities
- (None at this time)

## Impact

- This will affect the backend generation services, particularly the video recommendation or ranking services.
- We may need to add a new service or modify the existing videoRecommendation.service.js or videoRanking.service.js.
- We will need to integrate with the Gemini embedding API (or use an existing embedding service).
- We may need to store video embeddings for efficiency, which could affect the database or caching layer.