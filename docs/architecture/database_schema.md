# ResearchOS — Database Schema & Data Model Specification
**Version**: 1.0.0  
**Target Engine**: PostgreSQL 15+ with `pgvector` extension  
**ORM Target**: SQLAlchemy 2.x + Alembic Migrations  

---

## 1. Relational Architecture & ERD Overview

ResearchOS uses PostgreSQL as the single source of truth for application state, user workspace authorization, structured research knowledge, and vector embeddings.

```
+----------------+      +-------------------+      +-----------------+
|     users      | 1──N |  project_members  | N──1 |    projects     |
+----------------+      +-------------------+      +-----------------+
        │                                                   │
        │ 1                                               1 │
        ▼ N                                                 ▼ N
+----------------+                                 +-----------------+
|  paper_notes   |                                 |     papers      |
+----------------+                                 +-----------------+
                                                            │ 1
                                                            ▼ N
                                                   +-----------------+
                                                   | paper_versions  |
                                                   +-----------------+
                                                            │ 1
                                       +--------------------+--------------------+
                                       │ 1                                     │ 1
                                       ▼ N                                     ▼ 1
                               +-----------------+                     +-----------------+
                               |  paper_chunks   |                     | paper_metadata  |
                               +-----------------+                     +-----------------+
                                       │ 1
                                       ▼ 1
                               +-----------------+
                               |chunk_embeddings |
                               +-----------------+
```

---

## 2. Complete SQL DDL Schema

```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- USERS & WORKSPACE AUTHORIZATION
-- -----------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    research_objective TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE project_role AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'EDITOR',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

-- -----------------------------------------------------------------------------
-- PAPERS & KNOWLEDGE INGESTION
-- -----------------------------------------------------------------------------

CREATE TYPE paper_processing_status AS ENUM (
    'QUEUED', 'VALIDATING', 'EXTRACTING', 'REQUIRES_OCR', 'READY', 'FAILED'
);

CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status paper_processing_status NOT NULL DEFAULT 'QUEUED',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE paper_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    file_key VARCHAR(500) NOT NULL, -- Storage path / URI
    file_name VARCHAR(255) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_paper_version UNIQUE (paper_id, version_number)
);

CREATE TABLE paper_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_version_id UUID NOT NULL UNIQUE REFERENCES paper_versions(id) ON DELETE CASCADE,
    authors JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array of author strings
    abstract TEXT,
    publication_year INT,
    doi VARCHAR(100),
    venue VARCHAR(255),
    keywords JSONB DEFAULT '[]'::jsonb NOT NULL,
    methodology_summary TEXT,
    primary_datasets JSONB DEFAULT '[]'::jsonb NOT NULL,
    evaluation_metrics JSONB DEFAULT '[]'::jsonb NOT NULL,
    key_findings JSONB DEFAULT '[]'::jsonb NOT NULL,
    stated_limitations JSONB DEFAULT '[]'::jsonb NOT NULL,
    suggested_future_work JSONB DEFAULT '[]'::jsonb NOT NULL,
    extraction_confidence FLOAT DEFAULT 1.0 NOT NULL,
    user_reviewed BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE paper_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_version_id UUID NOT NULL REFERENCES paper_versions(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_start INT NOT NULL,
    page_end INT NOT NULL,
    section_title VARCHAR(255),
    content TEXT NOT NULL,
    token_count INT NOT NULL,
    CONSTRAINT uk_paper_chunk UNIQUE (paper_version_id, chunk_index)
);

-- pgvector embeddings table (768 dimensions for standard embedding models)
CREATE TABLE chunk_embeddings (
    chunk_id UUID PRIMARY KEY REFERENCES paper_chunks(id) ON DELETE CASCADE,
    embedding vector(768) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_version_id UUID NOT NULL REFERENCES paper_versions(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    attempt_count INT DEFAULT 0 NOT NULL,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------------------------------
-- AI ASSISTANT & CITATIONS
-- -----------------------------------------------------------------------------

CREATE TYPE assistant_scope AS ENUM ('SELECTED_PAPERS', 'ENTIRE_PROJECT', 'SINGLE_PAPER');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    scope_type assistant_scope NOT NULL DEFAULT 'ENTIRE_PROJECT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE message_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    paper_version_id UUID NOT NULL REFERENCES paper_versions(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES paper_chunks(id) ON DELETE CASCADE,
    quoted_text TEXT NOT NULL,
    page_number INT NOT NULL
);

-- -----------------------------------------------------------------------------
-- LITERATURE REVIEWS & GAP ANALYSES
-- -----------------------------------------------------------------------------

CREATE TABLE literature_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    review_type VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE review_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES literature_reviews(id) ON DELETE CASCADE,
    heading VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    position INT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE gap_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    method_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE gap_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES gap_analyses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    finding_type VARCHAR(50) NOT NULL, -- e.g. 'METHOD_DATASET_GAP', 'LIMITATION_PATTERN'
    confidence_score FLOAT NOT NULL
);

-- -----------------------------------------------------------------------------
-- EXPERIMENTS & ANALYTICS
-- -----------------------------------------------------------------------------

CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_name VARCHAR(255),
    model_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PLANNED' NOT NULL,
    hyperparameters JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE experiment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    unit VARCHAR(50),
    context VARCHAR(255)
);

-- -----------------------------------------------------------------------------
-- INDEXES & PERFORMANCE OPTIMIZATION
-- -----------------------------------------------------------------------------

-- Project & User query optimization
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_papers_project ON papers(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_paper_versions_sha256 ON paper_versions(sha256);

-- Full-text search index on paper chunks
CREATE INDEX idx_paper_chunks_fts ON paper_chunks USING gin(to_tsvector('english', content));

-- Vector similarity HNSW index for pgvector
CREATE INDEX idx_chunk_embeddings_hnsw ON chunk_embeddings 
USING hnsw (embedding vector_cosine_ops);
```
