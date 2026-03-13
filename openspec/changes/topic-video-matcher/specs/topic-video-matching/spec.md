## ADDED Requirements

### Requirement: Topic-to-Video Matching via Embedding Similarity
The system SHALL convert a topic string and video metadata (title, description) into embedding vectors using the Gemini embedding model and compute cosine similarity to rank videos by relevance.

#### Scenario: Match topic to videos using embeddings
- **WHEN** the system receives a topic string and a list of videos with titles and descriptions
- **THEN** the system generates an embedding for the topic and for each video's combined title and description
- **AND** computes cosine similarity between the topic embedding and each video embedding
- **AND** returns the videos sorted by similarity score in descending order

#### Scenario: Handle missing video description
- **WHEN** a video has a title but no description
- **THEN** the system uses only the title for generating the video's embedding
- **AND** still computes similarity and ranks appropriately

#### Scenario: Empty topic or video list
- **WHEN** the topic string is empty or the video list is empty
- **THEN** the system returns an empty list or handles gracefully without error