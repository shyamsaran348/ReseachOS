# ResearchOS — The AI-Native Research Workspace

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![pgvector](https://img.shields.io/badge/Vector_DB-PostgreSQL_pgvector-336791?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Groq](https://img.shields.io/badge/LLM_Engine-Groq_Qwen_27B-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Embeddings](https://img.shields.io/badge/Embeddings-MiniLM--L6--v2_(384d)-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ResearchOS** is a high-precision, distraction-free research operating system built for academics, scientists, and R&D engineers. It automates literature ingestion, parses dense multi-column PDFs, extracts verified semantic entities, executes grounded Retrieval-Augmented Generation (RAG) queries via `pgvector`, uncovers unexplored research gaps, and synthesizes publication-grade literature reviews with verified citations.

---

## 📌 Table of Contents
1. [Key Features & Capabilities](#-key-features--capabilities)
2. [System Architecture & Data Flow](#-system-architecture--data-flow)
3. [Under the Hood: RIE Pipeline & Vector Search](#-under-the-hood-rie-pipeline--vector-search)
4. [3-Member Engineering Responsibility Matrix](#-3-member-engineering-responsibility-matrix)
5. [Technology Stack](#-technology-stack)
6. [Repository Structure](#-repository-structure)
7. [Getting Started (Step-by-Step Setup)](#-getting-started)
8. [API Endpoints Reference](#-api-endpoints-reference)
9. [Verification & Live Demo Guide](#-verification--live-demo-guide)
10. [Security & Production Readiness](#-security--production-readiness)

---

## 🚀 Key Features & Capabilities

### 1. 📄 Intelligent PDF Ingestion & Chunking (RIE Pipeline)
- Drag-and-drop or batch upload academic PDFs.
- Automatic text cleansing, header/footer normalization, and section segmentation.
- Context-preserving overlapping sliding window (500 chars with 100 char overlap) so semantic meaning is never split across boundaries.
- Asynchronous processing with real-time status updates (`processing` ➔ `ready` or `failed`) via 3-second client polling.

### 2. 🔍 Grounded RAG Chat with Verified Chunk Citations
- Natural-language Q&A across individual papers or an entire multi-paper project library.
- Dense semantic vector search in PostgreSQL using the `pgvector` cosine distance operator (`<=>`).
- **Zero Hallucination Guarantee:** Responses cite exact chunks with paper titles, similarity confidence percentages, and page references.

### 3. 📝 Publication-Grade Literature Review Generator
- Multi-paper cross-document synthesis across uploaded manuscripts.
- Audience depth controls: Academic, Practitioner, or Executive summary.
- Outputs structured Markdown with hierarchical headings, thematic clusters, methodology comparisons, and full bibliographic citations.
- Built-in Markdown renderer with customized academic typography and one-click clipboard copy.

### 4. 🧭 Algorithmic Research Gap & Novelty Explorer
- Evaluates conflicting hypotheses, missing empirical benchmarks, and methodological limitations across papers.
- Two-column visual layout:
  - **Identified Literature Gaps:** Unexplored spaces and cross-paper contradictions.
  - **Recommended Future Directions:** Concrete, actionable experiment designs and hypotheses for new papers.

### 5. 📊 Real-Time Project Analytics Dashboard
- Metrics tracking: total indexed papers, vector chunks embedded, and processing health.
- Real-time verification of embeddings stored in PostgreSQL `pgvector`.

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    subgraph Client Layer [Frontend - React 18 + Vite + Tailwind]
        Browser([Researcher / Browser]) <--> UI[ResearchOS Modern Web UI]
        UI --> AuthView[Auth Modal]
        UI --> LibView[Papers Library & Ingestion]
        UI --> ChatView[Grounded Assistant Chat]
        UI --> ReviewView[Literature Review Generator]
        UI --> GapView[Novelty Gap Analysis]
    end

    subgraph API Gateway [Backend - FastAPI Async]
        UI <-->|REST API + JWT Bearer| FastAPI[FastAPI Application]
        FastAPI --> AuthMiddleware[JWT Auth & BCrypt Security]
        FastAPI --> RouteProjects[/api/v1/projects]
        FastAPI --> RoutePapers[/api/v1/papers]
        FastAPI --> RouteAssistant[/api/v1/assistant]
        FastAPI --> RouteReviews[/api/v1/reviews]
        FastAPI --> RouteGaps[/api/v1/gap-analysis]
    end

    subgraph RIE Pipeline [Research Information Extraction Engine]
        RoutePapers -->|Background Task| Ingestion[Ingestion Coordinator]
        Ingestion --> PDFParser[PyPDF Text Parser]
        PDFParser --> Chunker[Overlapping Sliding Window Chunker]
        Chunker --> LocalEmbedding[Sentence-Transformers all-MiniLM-L6-v2]
        LocalEmbedding -->|384-dim Dense Vectors| VectorWriter[Vector Insert Handler]
    end

    subgraph Data & Storage [Persistence Layer]
        VectorWriter --> Postgres[(PostgreSQL + pgvector on Supabase)]
        RouteProjects <--> Postgres
        RoutePapers <--> Postgres
        RouteAssistant -->|Cosine Distance Search| Postgres
    end

    subgraph LLM Intelligence [Groq Cloud Engine]
        RouteAssistant <-->|Context-Grounded Prompt| GroqLLM[Groq Qwen 27B / Llama 70B]
        RouteReviews <-->|Multi-Doc Synthesis Prompt| GroqLLM
        RouteGaps <-->|Cross-Paper Gap Prompt| GroqLLM
    end
```

---

## 🔬 Under the Hood: RIE Pipeline & Vector Search

### 1. Vector Embeddings
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Dimensionality: **384 dimensions** (dense float vectors)
- Runs completely locally on CPU inside `backend/app/rie/embeddings/local_provider.py`.
- Benefits: Ultra-fast vectorization (~20ms/chunk), zero external embedding API cost, deterministic output, and complete data privacy.

### 2. Vector Indexing with pgvector
Chunks are stored in the `paper_chunks` table with a custom vector column:
```sql
embedding vector(384)
```
Similarity lookups utilize cosine distance:
```python
# Cosine distance ordering via pgvector
query = (
    select(PaperChunk, PaperChunk.embedding.cosine_distance(query_vector).label("distance"))
    .where(PaperChunk.paper_id.in_(project_paper_ids))
    .order_by("distance")
    .limit(top_k)
)
```

### 3. LLM Rate Limit Budgeting
To operate safely within high-speed free-tier and enterprise limits (e.g. Groq 1,000 OTPM / 7,000 ITPM):
- Input chunks are capped and deduplicated before prompt assembly.
- Token limits are enforced via `max_tokens=800` on synthesis completions and `max_tokens=600` on structured JSON extraction.
- Automatic retry logic with exponential backoff on HTTP 429 status codes.

---

## 👥 3-Member Engineering Responsibility Matrix

For academic reviews, project vivas, and presentations, the workload is partitioned across three core engineering domains:

| Role & Lead | Primary Domain | Core Assigned Files | Key Presentation Focus |
| :--- | :--- | :--- | :--- |
| **Member 1: AI Pipeline & Vector Search Lead** | Ingestion, Embeddings & RAG Engine | `backend/app/rie/pipeline.py`<br>`backend/app/rie/extraction/pdf_extractor.py`<br>`backend/app/rie/embeddings/local_provider.py`<br>`backend/app/rie/retrieval/semantic_search.py`<br>`backend/app/api/v1/assistant.py` | PDF parsing, chunk overlap mechanics, 384-dim vector generation, pgvector cosine search, and citation grounding. |
| **Member 2: Backend Architecture & ML Systems Lead** | Database, Auth & Synthesis Intelligence | `backend/app/db/models.py`<br>`backend/app/db/session.py`<br>`backend/app/api/v1/auth.py`<br>`backend/app/api/v1/projects.py`<br>`backend/app/api/v1/reviews.py`<br>`backend/app/api/v1/gap_analysis.py`<br>`backend/app/rie/integrations/groq_provider.py` | Async SQLAlchemy schemas, foreign key cascade design, JWT auth, multi-paper review synthesis, and LLM rate-limit budgeting. |
| **Member 3: Frontend Architecture & UI/UX Lead** | Modern Web UI, State & Live Polling | `frontend/src/App.tsx`<br>`frontend/src/api/client.ts`<br>`frontend/src/components/UploadModal.tsx`<br>`frontend/src/components/PapersLibrary.tsx`<br>`frontend/src/components/LiteratureReview.tsx`<br>`frontend/src/components/AssistantChat.tsx`<br>`frontend/src/components/GapAnalysis.tsx` | React 18 + Vite setup, editorial typography, 3-second background polling lifecycle, and safe ReactMarkdown rendering. |

> 📘 *For comprehensive presentation scripts and anticipated viva questions with answers, see [`PROJECT_REVIEW_GUIDE_3_MEMBERS.md`](PROJECT_REVIEW_GUIDE_3_MEMBERS.md).*

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.10+, Asynchronous runtime)
- **Database:** PostgreSQL on Supabase with the [`pgvector`](https://github.com/pgvector/pgvector) extension
- **ORM & Migrations:** SQLAlchemy 2.0 (AsyncIO) + Alembic
- **LLM Engine:** Groq Cloud API (`qwen/qwen3.8-27b` / `llama-3.3-70b-versatile`)
- **Embeddings:** Local HuggingFace embeddings (`all-MiniLM-L6-v2`, 384 dimensions)
- **PDF Extraction:** `pypdf` structural extraction

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS with custom editorial design tokens (`design.md`)
- **Markdown Engine:** `react-markdown` with customized typography components
- **Icons:** Lucide React
- **State Management:** Reactive hooks with real-time polling (3s interval during PDF extraction)

---

## 📁 Repository Structure

```
.
├── PROJECT_REVIEW_GUIDE_3_MEMBERS.md # Complete viva & 3-member presentation guide
├── backend/
│   ├── alembic/                      # Database schema migrations
│   ├── app/
│   │   ├── api/v1/                   # FastAPI route endpoints
│   │   │   ├── analytics.py          # Project statistics & chunk counts
│   │   │   ├── assistant.py          # Grounded RAG chat with citations
│   │   │   ├── auth.py               # Register, login, /me with JWT
│   │   │   ├── gap_analysis.py       # Research gap & novelty explorer
│   │   │   ├── papers.py             # PDF upload, listing, reprocessing
│   │   │   ├── projects.py           # Project CRUD & isolation
│   │   │   ├── reviews.py            # Literature review generator
│   │   │   └── router.py             # Central v1 route aggregator
│   │   ├── config.py                 # Pydantic BaseSettings & environment configs
│   │   ├── db/                       # SQLAlchemy models & async session factory
│   │   │   ├── models.py             # User, Project, Paper, PaperChunk, Review
│   │   │   └── session.py            # Async engine & get_db generator
│   │   ├── rie/                      # Research Information Extraction pipeline
│   │   │   ├── embeddings/           # Sentence-transformers local embeddings
│   │   │   ├── extraction/           # PDF text parser & chunker
│   │   │   ├── integrations/         # Groq LLM integration with rate limit handling
│   │   │   ├── retrieval/            # Cosine distance pgvector search
│   │   │   └── pipeline.py           # Pipeline orchestrator
│   │   ├── schemas/                  # Pydantic request/response validation
│   │   └── main.py                   # FastAPI app entrypoint & CORS middleware
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                      # Client API wrapper with JWT interceptor
│   │   ├── components/               # Modular UI views
│   │   │   ├── AssistantChat.tsx     # Grounded chat with citations panel & markdown
│   │   │   ├── AuthModal.tsx         # Pre-filled credentials modal
│   │   │   ├── GapAnalysis.tsx       # Two-column gap & direction explorer
│   │   │   ├── Header.tsx            # Project switcher & live status
│   │   │   ├── LiteratureReview.tsx  # Synthesis parameter controls & markdown view
│   │   │   ├── PapersLibrary.tsx     # Papers table, auto-polling, reprocess
│   │   │   ├── ProjectAnalyticsDashboard.tsx # Vector & entity metrics
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   └── UploadModal.tsx       # Drag-and-drop PDF uploader
│   │   ├── types/                    # TypeScript interfaces & types
│   │   ├── App.tsx                   # Master SPA state orchestrator
│   │   ├── index.css                 # Custom design tokens
│   │   └── main.tsx
│   ├── design.md                     # Design system & tokens specification
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ and `npm`
- PostgreSQL instance with `pgvector` enabled (e.g. Supabase)
- Groq Cloud API Key ([groq.com](https://groq.com))

---

### 2. Backend Installation

1. **Navigate to the backend directory and activate a virtual environment:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables (`backend/.env`):**
   ```ini
   APP_NAME=ResearchOS
   ENVIRONMENT=development
   LOG_LEVEL=INFO

   # Supabase or PostgreSQL with pgvector extension
   DATABASE_URL=postgresql+asyncpg://postgres.your_id:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres

   # Security
   SECRET_KEY=your_secure_random_secret_key_here

   # Groq LLM
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=qwen/qwen3.8-27b

   # Local Embedding Configuration
   EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
   EMBEDDING_DIMENSIONS=384

   # CORS
   CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
   ```

3. **Run Database Migrations:**
   ```bash
   alembic upgrade head
   ```

4. **Launch the FastAPI Server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Swagger API docs available at:* `http://localhost:8000/docs`

---

### 3. Frontend Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Vite Development Server:**
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
   *Access the web application at:* `http://localhost:5173`

---

## 📖 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new researcher account |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT Bearer token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/v1/projects` | List all research projects with paper counts |
| `POST` | `/api/v1/projects` | Create a new research project workspace |
| `DELETE` | `/api/v1/projects/{id}` | Archive / delete a research project |
| `POST` | `/api/v1/projects/{id}/papers` | Upload PDF (returns `202 Accepted` & triggers background RIE) |
| `GET` | `/api/v1/projects/{id}/papers` | List papers with real-time extraction statuses |
| `POST` | `/api/v1/projects/{id}/papers/{paper_id}/reprocess` | Re-trigger failed extraction pipeline |
| `POST` | `/api/v1/projects/{id}/assistant/chat` | Grounded RAG query stream with chunk citations |
| `POST` | `/api/v1/projects/{id}/gap-analysis` | 2-column literature gap and novel direction discovery |
| `POST` | `/api/v1/projects/{id}/reviews` | Automated multi-paper literature review synthesis |
| `GET` | `/api/v1/projects/{id}/analytics` | pgvector chunk count, total papers, and entity metrics |

---

## 🎯 Verification & Live Demo Guide

To perform an end-to-end demonstration during a presentation:

1. **Pre-Filled Login:**
   - Open `http://localhost:5173`.
   - The Auth modal is pre-configured with active researcher credentials:
     - **Email:** `scholar_final@oxford.edu`
     - **Password:** `Demo@1234`
2. **Project Library (5 Papers):**
   - Select the pre-loaded **LLM Attention & Fine-Tuning** project.
   - Note the papers: *Attention Is All You Need*, *FlashAttention*, *LoRA*, *QLoRA*, and *DeepSeek-V3*.
   - All papers show `ready` status with 40+ vector chunks indexed in pgvector.
3. **Research Assistant:**
   - In the Assistant tab, enter:
     > *"How does FlashAttention optimize the quadratic memory complexity of standard attention?"*
   - Verify the **100% Grounded** indicator and the exact chunk citation cards with similarity scores.
4. **Literature Review:**
   - In the Literature Review tab, click **Generate Synthesis**.
   - Observe the editorial-grade formatted Markdown headings, thematic analysis, and cited papers.
5. **Gap Analysis:**
   - In the Gap Analysis tab, click **Explore Research Gaps** to see conflicting methodologies and recommended novel directions.

---

## 🔒 Security & Production Readiness

- **Native BCrypt Password Hashing:** Uses salted native bcrypt to prevent truncation vulnerabilities.
- **Strict JWT Token Verification:** All workspace queries require an `Authorization: Bearer <token>` header.
- **Tenant Isolation:** All paper chunks, vector queries, and synthesis documents are strictly scoped to the active project ID.
- **Data Protection:** Secrets and uploaded files are protected from version control via `.gitignore`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
