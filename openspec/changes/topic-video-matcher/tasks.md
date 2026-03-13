## 1. Embedding Service Setup

- [x] 1.1 Investigate existing AI service structure in backend/src/modules/providers/ai/
- [x] 1.2 Create or extend embedding service for Gemini embeddings
- [x] 1.3 Add necessary API keys/configuration for Gemini embedding API

## 2. Core Matching Functionality

- [x] 2.1 Implement function to generate embedding for a single text string
- [x] 2.2 Implement function to compute cosine similarity between two vectors
- [x] 2.3 Implement function to generate embeddings for video title + description
- [x] 2.4 Implement main matching function that takes topic and video list, returns ranked videos

## 3. Integration with Video Services

- [x] 3.1 Examine existing videoRecommendation.service.js and videoRanking.service.js
- [x] 3.2 Decide on integration approach (enhance existing or create new service)
- [x] 3.3 Implement topic-video matching service that uses embedding functions
- [x] 3.4 Integrate matching service into video recommendation pipeline

## 4. Caching and Optimization

- [x] 4.1 Implement in-memory cache for video embeddings
- [x] 4.2 Add cache invalidation/update strategy
- [x] 4.3 Optimize to compute topic embedding once per request
- [x] 4.4 Handle batching of embedding requests if beneficial

## 5. Error Handling and Edge Cases

- [x] 5.1 Handle empty topic string
- [x] 5.2 Handle empty video list
- [x] 5.3 Handle missing video description (fallback to title only)
- [x] 5.4 Handle API errors from Gemini embedding service
- [x] 5.5 Add logging for debugging and monitoring

## 6. Testing and Validation

- [x] 6.1 Create unit tests for embedding generation
- [x] 6.2 Create unit tests for cosine similarity computation
- [x] 6.3 Create unit tests for matching function with various inputs
- [x] 6.4 Test integration with existing video services
- [x] 6.5 Verify performance improvements and correctness