# ResearchOS — The AI-Native Research Workspace

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![pgvector](https://img.shields.io/badge/Vector_DB-PostgreSQL_pgvector-336791?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Groq](https://img.shields.io/badge/LLM_Engine-Groq_Qwen_/_Llama_70B-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Embeddings](https://img.shields.io/badge/Embeddings-MiniLM--L6--v2_(384d)-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
[![OCR](https://img.shields.io/badge/OCR_Engine-Tesseract_/_PyMuPDF-4B8BBE?logo=python&logoColor=white)](https://github.com/tesseract-ocr/tesseract)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ResearchOS** is a high-precision, distraction-free research operating system built for academics, scientists, and R&D engineers. It automates literature ingestion with OCR fallbacks, parses dense multi-column PDFs with section-aware chunking, executes hybrid dense-sparse vector queries via `pgvector` and BM25 with Reciprocal Rank Fusion ($RRF$), validates citation claim entailment, uncovers grounded research gaps, and synthesizes publication-grade literature reviews and comparative matrices with LaTeX export.

---

## 📌 Table of Contents
1. [What's New in Milestone 2 (Major Enhancements)](#-whats-new-in-milestone-2-major-enhancements)
2. [Key Features & Capabilities](#-key-features--capabilities)
3. [System Architecture & Data Flow](#-system-architecture--data-flow)
4. [Under the Hood: RIE Pipeline, OCR & Hybrid Retrieval](#-under-the-hood-rie-pipeline-ocr--hybrid-retrieval)
5. [3-Member Engineering Responsibility Matrix](#-3-member-engineering-responsibility-matrix)
6. [Technology Stack](#-technology-stack)
7. [Repository Structure](#-repository-structure)
8. [Getting Started (Step-by-Step Setup)](#-getting-started)
9. [API Endpoints Reference](#-api-endpoints-reference)
10. [Verification & Live Demo Guide](#-verification--live-demo-guide)
11. [Security & Production Readiness](#-security--production-readiness)

---

## 🌟 What's New in Milestone 2 (Major Enhancements)

Based on a comprehensive technical audit of academic PDF ingestion and RAG QA limitations, 6 core architectural improvements have been added:

1. **🔍 Open-Source OCR Ingestion Engine (`pytesseract` + PyMuPDF)**:
   - Scanned or rasterized PDF pages with $< 30$ words are dynamically rendered to high-resolution pixmaps (`dpi=200`) and extracted via Tesseract OCR, ensuring zero ingestion failures on non-digitized manuscripts.
2. **📑 Section-Aware Hierarchical AST Chunking**:
   - Replaced blind 512-word fixed slicing with canonical academic heading detection (`Abstract`, `Methodology`, `Results`, `Limitations`, `Future Work`). Chunks are prepended with provenance breadcrumbs (`[<SectionTitle> | Pages X-Y]`) to preserve semantic and mathematical context.
3. **🛡️ Automated Citation Entailment & Claim Verification**:
   - Replaced static grounding claims with algorithmic claim-level entailment verification. Evaluates overlap between LLM-generated citations and source chunks, displaying confidence badges and drawer verification.
4. **⚡ Hybrid Dense-Sparse Retrieval with Reciprocal Rank Fusion ($RRF$)**:
   - Blends `pgvector` 384-dimensional dense cosine similarity with sparse lexical matching. Accurately surfaces exact model names, acronyms (`LoRA`, `FlashAttention-2`), and dataset tokens without drift.
5. **📊 Cross-Paper Comparative Literature Matrix & LaTeX Export**:
   - Dedicated interactive matrix view aggregating *Core Innovation*, *Model Architecture*, *Benchmark Datasets*, *Evaluation Metrics*, and *Acknowledged Limitations* across papers, with one-click **LaTeX Table (`.tex`) export**.
6. **🧭 Evidence-Grounded Research Gap Explorer**:
   - Proposed frontiers and hypotheses are directly tied to extracted `limitations` and `future_work` sections from uploaded literature, complete with actionable experimental designs.

---

## 🚀 Key Features & Capabilities

### 1. 📄 Intelligent PDF Ingestion & OCR Fallback
- Drag-and-drop or batch upload academic PDFs.
- Automatic text cleansing, header/footer normalization, and section segmentation.
- Dynamic fallback to Tesseract OCR for scanned papers or image-heavy pages.
- Asynchronous processing with real-time status updates via 3-second client polling.

### 2. 🔍 Grounded RAG Chat with Hybrid Search & Verification
- Natural-language Q&A across individual papers or an entire multi-paper project library.
- Dense semantic vector search in PostgreSQL using `pgvector` combined with lexical search via Reciprocal Rank Fusion ($RRF$).
- **Claim Entailment Verification:** Responses cite exact chunks with paper titles, page references, and verification confidence percentages.

### 3. 📝 Publication-Grade Literature Review & Comparative Matrix
- Multi-paper cross-document synthesis across uploaded manuscripts.
- Audience depth controls: Academic, Practitioner, or Executive summary.
- Interactive Comparative Literature Matrix comparing methodologies, datasets, metrics, and bottlenecks side-by-side.
- One-click export to Markdown (`.md`) and LaTeX table code (`.tex`).

### 4. 🧭 Algorithmic Research Gap & Novelty Explorer
- Evaluates conflicting hypotheses, missing empirical benchmarks, and methodological limitations.
- Two-column visual layout paired with Evidence-Grounded Frontier Cards detailing supporting limitation snippets and proposed experiments.

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
        UI --> LibView[Papers Library & OCR Ingestion]
        UI --> ChatView[Grounded Chat with Entailment Verification]
        UI --> ReviewView[Synthesis Review & Comparative Matrix]
        UI --> GapView[Evidence-Grounded Gap Explorer]
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
        Ingestion --> PDFParser[PyMuPDF Parser + Tesseract OCR Fallback]
        PDFParser --> Chunker[Section-Aware Hierarchical Chunker]
        Chunker --> LocalEmbedding[Sentence-Transformers all-MiniLM-L6-v2]
        LocalEmbedding -->|384-dim Dense Vectors| VectorWriter[Vector Insert Handler]
    end

    subgraph Data & Storage [Persistence Layer]
        VectorWriter --> Postgres[(PostgreSQL + pgvector on Supabase/Local)]
        RouteProjects <--> Postgres
        RoutePapers <--> Postgres
        RouteAssistant -->|Hybrid RRF Search: pgvector + BM25| Postgres
        RouteReviews -->|Metadata Matrix Aggregation| Postgres
    end

    subgraph LLM Intelligence [Groq Cloud Engine]
        RouteAssistant <-->|Context-Grounded Prompt| GroqLLM[Groq Qwen 27B / Llama 70B]
        RouteReviews <-->|Multi-Doc Synthesis Prompt| GroqLLM
        RouteGaps <-->|Grounded Gap Extraction| GroqLLM
    end
```

---

## 🔬 Under the Hood: RIE Pipeline, OCR & Hybrid Retrieval

### 1. Vector Embeddings
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Dimensionality: **384 dimensions** (dense float vectors)
- Runs completely locally on CPU/MPS inside `backend/app/rie/embeddings/local_provider.py`.
- Benefits: Ultra-fast vectorization (~20ms/chunk), zero external embedding API cost, deterministic output, and complete data privacy for unpublished drafts.

### 2. Hybrid Retrieval with Reciprocal Rank Fusion (RRF)
To prevent keyword drift while preserving semantic matching, candidate chunks are retrieved via two channels and merged:
$$RRF(d) = \frac{1}{60 + \text{rank}_{\text{dense}}(d)} + \frac{1}{60 + \text{rank}_{\text{sparse}}(d)}$$

### 3. Automated OCR Fallback
- Uses `pytesseract` to scan rasterized pages with $< 30$ words.
- Generates 200 DPI image pixmaps on-the-fly and reconstructs clean text before chunking and embedding.

---

## 👥 3-Member Engineering Responsibility Matrix

| Role & Lead | Primary Domain | Core Assigned Files | Key Presentation Focus |
| :--- | :--- | :--- | :--- |
| **Member 1: AI Pipeline & Vector Search Lead** | Ingestion, OCR, Embeddings & Hybrid RAG Engine | `backend/app/rie/pipeline.py`<br>`backend/app/rie/extraction/pdf_extractor.py`<br>`backend/app/rie/embeddings/local_provider.py`<br>`backend/app/rie/retrieval/semantic_search.py`<br>`backend/app/api/v1/assistant.py` | PDF parsing, OCR fallback, section-aware chunking, 384-dim vector generation, pgvector + BM25 hybrid search, and citation entailment verification. |
| **Member 2: Backend Architecture & ML Systems Lead** | Database, Auth & Synthesis Intelligence | `backend/app/db/models.py`<br>`backend/app/db/session.py`<br>`backend/app/api/v1/auth.py`<br>`backend/app/api/v1/projects.py`<br>`backend/app/api/v1/reviews.py`<br>`backend/app/api/v1/gap_analysis.py`<br>`backend/app/rie/integrations/groq_provider.py` | Async SQLAlchemy schemas, JWT auth, multi-paper review synthesis, cross-paper comparative matrix endpoint, and grounded gap analysis. |
| **Member 3: Frontend Architecture & UI/UX Lead** | Modern Web UI, State & Live Polling | `frontend/src/App.tsx`<br>`frontend/src/api/client.ts`<br>`frontend/src/components/UploadModal.tsx`<br>`frontend/src/components/PapersLibrary.tsx`<br>`frontend/src/components/LiteratureReview.tsx`<br>`frontend/src/components/AssistantChat.tsx`<br>`frontend/src/components/GapAnalysis.tsx` | React 18 + Vite setup, dynamic API base resolution, citation drawer, comparative table view with LaTeX export, and responsive academic typography. |

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.12, Asynchronous runtime)
- **Database:** PostgreSQL on Supabase or local instance with [`pgvector`](https://github.com/pgvector/pgvector)
- **ORM & Migrations:** SQLAlchemy 2.0 (AsyncIO) + Alembic
- **LLM Engine:** Groq Cloud API (`qwen/qwen3.8-27b` / `llama-3.3-70b-versatile`)
- **Embeddings:** Local Sentence-Transformers (`all-MiniLM-L6-v2`, 384 dimensions)
- **PDF & OCR Engine:** `PyMuPDF` (fitz) + `pytesseract`

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS with custom editorial design tokens
- **Markdown & Math Engine:** `react-markdown` + `remark-math` + `rehype-katex`
- **Icons:** Lucide React
- **State Management:** Reactive hooks with real-time polling (3s interval during ingestion)

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
│   │   │   ├── assistant.py          # Grounded RAG chat with entailment verification
│   │   │   ├── auth.py               # Register, login, /me with JWT
│   │   │   ├── gap_analysis.py       # Evidence-grounded research gap explorer
│   │   │   ├── papers.py             # PDF upload, listing, reprocessing
│   │   │   ├── projects.py           # Project CRUD & isolation
│   │   │   ├── reviews.py            # Synthesis review & comparative matrix
│   │   │   └── router.py             # Central v1 route aggregator
│   │   ├── config.py                 # Pydantic BaseSettings & environment configs
│   │   ├── db/                       # SQLAlchemy models & async session factory
│   │   ├── rie/                      # Research Information Extraction pipeline
│   │   │   ├── embeddings/           # Sentence-transformers local embeddings
│   │   │   ├── extraction/           # Section-aware PDF text parser & OCR fallback
│   │   │   ├── integrations/         # Groq LLM integration with rate limit handling
│   │   │   └── retrieval/            # Hybrid pgvector + lexical RRF search
│   │   └── schemas/                  # Pydantic request/response validation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts             # Client API wrapper with dynamic base URL
│   │   ├── components/               # Modular UI views
│   │   │   ├── AssistantChat.tsx     # Grounded chat with verified citation drawer
│   │   │   ├── LiteratureReview.tsx  # Synthesis review & comparative matrix table
│   │   │   ├── GapAnalysis.tsx       # Evidence-grounded research gap explorer
│   │   │   ├── PapersLibrary.tsx     # Papers table, auto-polling, reprocess
│   │   │   └── UploadModal.tsx       # Drag-and-drop PDF uploader
│   │   ├── types.ts                  # TypeScript interfaces & types
│   │   └── App.tsx                   # Master SPA state orchestrator
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and `npm`
- PostgreSQL instance with `pgvector` enabled (Supabase or local Postgres)
- Groq Cloud API Key ([groq.com](https://groq.com))
- Tesseract OCR (installed via Homebrew: `brew install tesseract` or `apt install tesseract-ocr`)

---

### 2. Backend Installation

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pytesseract
```

Configure your `backend/.env` file:
```ini
APP_NAME=ResearchOS
ENVIRONMENT=development
LOG_LEVEL=INFO

# PostgreSQL with pgvector extension
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/researchos

SECRET_KEY=your_secure_random_secret_key_here
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

Run database migrations & start backend:
```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 3. Frontend Installation

```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📖 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new researcher account |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT Bearer token |
| `GET` | `/api/v1/projects` | List all research projects with paper counts |
| `POST` | `/api/v1/projects/{id}/papers` | Upload PDF (triggers background OCR & RIE pipeline) |
| `POST` | `/api/v1/projects/{id}/assistant/chat` | Hybrid RAG query stream with claim entailment verification |
| `POST` | `/api/v1/projects/{id}/gap-analysis` | Evidence-grounded research gap & novel direction discovery |
| `POST` | `/api/v1/projects/{id}/reviews` | Automated multi-paper literature review synthesis |
| `GET` | `/api/v1/projects/{id}/reviews/comparative-matrix/{id}` | Cross-paper comparative matrix with LaTeX export |
| `GET` | `/api/v1/projects/{id}/analytics` | pgvector chunk count, total papers, and entity metrics |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
