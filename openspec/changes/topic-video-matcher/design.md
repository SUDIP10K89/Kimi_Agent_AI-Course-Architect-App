## Context

We are building an AI Course Architect App that helps users generate courses from topics. Currently, the system likely uses keyword-based or less sophisticated methods to match topics to educational videos. We need to improve this by using semantic embeddings to find more relevant videos.

The backend has a generation module with services like videoRecommendation.service.js and videoRanking.service.js that likely handle video selection. We'll need to integrate embedding generation and similarity computation into this flow.

## Goals / Non-Goals

**Goals:**
- Convert topic text to embedding vector using Gemini embedding model
- Convert video title + description to embedding vector using same model
- Compute cosine similarity between topic and video embeddings
- Rank videos by similarity score to pick most relevant ones
- Integrate this matching capability into the video recommendation/ranking pipeline

**Non-Goals:**
- Training custom embedding models (we'll use pre-trained Gemini)
- Storing embeddings permanently without caching strategy (we'll consider caching but not implement long-term storage in this change)
- Modifying the database schema for embedding storage (we'll use in-memory or cache for now)
- Handling multilingual topics/videos beyond what Gemini supports

## Decisions

### Embedding Model Choice
**Decision:** Use Gemini embedding model via Google's AI API
**Rationale:** 
- High-quality semantic embeddings suitable for text matching
- Already available in the project context (mentioned in user request)
- Good balance of performance and accuracy for educational content
**Alternatives Considered:**
- OpenAI embeddings: Would require additional API keys and setup
- Local models (like sentence-transformers): Would increase complexity and resource usage
- TF-IDF or BM25: Less accurate for semantic matching

### Similarity Metric
**Decision:** Use cosine similarity
**Rationale:**
- Standard for comparing embedding vectors
- Efficient to compute
- Works well with normalized embeddings (Gemini embeddings are typically normalized)
**Alternatives Considered:**
- Euclidean distance: Requires normalization consideration
- Dot product: Equivalent to cosine similarity for normalized vectors
- Jaccard similarity: Not suitable for embedding vectors

### Integration Point
**Decision:** Enhance existing videoRecommendation.service.js or create a new topic-video-matching service
**Rationale:**
- The generation module already has video recommendation services
- Minimizes disruption to existing code
- Leverages existing video data fetching logic
**Alternatives Considered:**
- Create completely new service: More isolated but duplicates video fetching logic
- Modify videoRanking.service.js: Similar to recommendation but may be less appropriate

### Caching Strategy
**Decision:** Implement basic in-memory caching for video embeddings during a session
**Rationale:**
- Avoids re-computing embeddings for same videos repeatedly
- Reduces API calls to Gemini (which may have costs/rate limits)
- Simple to implement for initial version
**Alternatives Considered:**
- No caching: Simpler but inefficient and costly
- Persistent caching (Redis/database): More complex; defer to later if needed
- Cache with TTL: Good balance but adds complexity for v1

## Risks / Trade-offs

[Risk] Gemini API costs and rate limits → Mitigation: Implement caching, batch requests where possible, monitor usage
[Risk] Embedding generation adds latency → Mitigation: Cache video embeddings, compute topic embedding once per request
[Risk] Semantic matching may not align with editorial judgment → Mitigation: Allow tuning of similarity thresholds, combine with keyword signals
[Risk] Video description may be missing or poor quality → Mitigation: Fall back to title-only embedding, weight title higher if description missing