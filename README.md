# ResearchOS — The AI-Native Research Workspace

**ResearchOS** is a high-precision, distraction-free research operating system built for academics, scientists, and R&D teams. It automates literature ingestion, extracts verified semantic entities, performs grounded Retrieval-Augmented Generation (RAG) queries via `pgvector`, uncovers unexplored research gaps, and synthesizes publication-grade literature reviews.

---

## 🚀 Key Highlights & Architecture

- **Minimalist Academic UI:** Designed based on a calm, clean editorial design system (inspired by Notion, Linear, and academic journals).
- **Asynchronous RIE (Research Information Extraction) Pipeline:** PDF ingestion with chunking, sentence transformer embeddings (`sentence-transformers/all-MiniLM-L6-v2`), and metadata parsing via Groq LLMs (`llama-3.3-70b-versatile`).
- **Grounded Vector Retrieval:** Hybrid RAG pipeline querying PostgreSQL with `pgvector`, providing ground-truth chunk citations and similarity scoring.
- **Novelty & Gap Analysis:** Algorithmic gap detection that finds unexplored intersections across project papers and recommends actionable future experiments.
- **Automated Literature Reviews:** Generates targeted syntheses based on audience depth (academic, practitioner, executive) with one-click Markdown copy and export.
- **Enterprise-Ready Auth:** JWT Bearer authentication with native bcrypt security, multi-project workspace switching, and real-time pipeline status polling.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12, Async/Await)
- **Database:** PostgreSQL on Supabase with the [`pgvector`](https://github.com/pgvector/pgvector) extension
- **ORM & Migrations:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async) + [Alembic](https://alembic.sqlalchemy.org/)
- **LLM Engine:** [Groq Cloud API](https://groq.com/) (`llama-3.3-70b-versatile`)
- **Embeddings:** Local HuggingFace embeddings (`all-MiniLM-L6-v2`, 384 dimensions)
- **PDF Extraction:** `pypdf` & structural text extraction

### Frontend
- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom tokens from `design.md`
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** Reactive hooks with real-time polling (3s intervals during extraction)

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── alembic/                      # Database migrations
│   ├── app/
│   │   ├── api/v1/                   # FastAPI route handlers
│   │   │   ├── auth.py               # Register, Login (OAuth2), /me
│   │   │   ├── projects.py           # Project CRUD & archive
│   │   │   ├── papers.py             # PDF upload, listing, reprocess, delete
│   │   │   ├── assistant.py          # Grounded RAG chat endpoint
│   │   │   ├── gap_analysis.py       # Research gap & novelty explorer
│   │   │   ├── reviews.py            # Literature review generator
│   │   │   └── analytics.py          # Project analytics & vector counts
│   │   ├── db/                       # SQLAlchemy models & async engine
│   │   ├── rie/                      # Research Information Extraction pipeline
│   │   │   ├── embeddings/           # Vector embeddings provider
│   │   │   ├── extraction/           # PDF text parser
│   │   │   ├── integrations/         # Groq LLM provider
│   │   │   └── retrieval/            # Semantic similarity search
│   │   ├── schemas/                  # Pydantic request/response schemas
│   │   └── main.py                   # FastAPI app entrypoint & middleware
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                      # Client API wrapper with JWT interceptor
│   │   ├── components/               # Modular UI views
│   │   │   ├── AuthModal.tsx         # Login & Register modal
│   │   │   ├── Header.tsx            # Project switcher & live status
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── PapersLibrary.tsx     # Papers table, auto-polling, reprocess
│   │   │   ├── UploadModal.tsx       # Drag-and-drop PDF uploader
│   │   │   ├── AssistantChat.tsx     # Grounded chat with citations panel
│   │   │   ├── LiteratureReview.tsx  # Synthesis parameter controls & .md export
│   │   │   ├── GapAnalysis.tsx       # Two-column gap & direction explorer
│   │   │   └── ProjectAnalyticsDashboard.tsx # Vector & entity metrics
│   │   ├── App.tsx                   # Master SPA state orchestrator
│   │   ├── main.tsx
│   │   └── index.css                 # Custom design tokens
│   ├── design.md                     # Design system & tokens specification
│   ├── stitch_prompt.md              # Stitch AI generator prompt
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`
- PostgreSQL instance with `pgvector` enabled (e.g. Supabase)
- Free Groq API Key

---

### 2. Backend Setup

1. **Navigate to the backend directory and activate virtual environment:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   Create a `.env` file inside `backend/`:
   ```ini
   APP_NAME=ResearchOS
   ENVIRONMENT=development
   LOG_LEVEL=INFO

   # Supabase Session Pooler or Direct PostgreSQL with pgvector
   DATABASE_URL=postgresql+asyncpg://postgres.your_id:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres

   # Security
   SECRET_KEY=your_generated_secret_key_here

   # Groq Free API
   GROQ_API_KEY=gsk_your_groq_key_here
   GROQ_MODEL=llama-3.3-70b-versatile

   # Embedding Configuration
   EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
   EMBEDDING_DIMENSIONS=384

   # CORS
   CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
   ```

3. **Run Alembic Migrations:**
   ```bash
   alembic upgrade head
   ```

4. **Start the FastAPI Backend:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Interactive API docs available at:* `http://localhost:8000/docs`

---

### 3. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev -- --port 5173
   ```
   *Open your browser at:* `http://localhost:5173`

---

## 📖 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Create a new researcher account |
| `POST` | `/api/v1/auth/login` | Obtain JWT Bearer token via OAuth2 |
| `GET` | `/api/v1/auth/me` | Fetch active authenticated user profile |
| `GET` | `/api/v1/projects` | List projects with paper counts |
| `POST` | `/api/v1/projects` | Create a new research project workspace |
| `DELETE` | `/api/v1/projects/{id}` | Soft-delete / archive a project |
| `POST` | `/api/v1/projects/{id}/papers` | Upload PDF (returns `202 Accepted` & triggers background RIE) |
| `GET` | `/api/v1/projects/{id}/papers` | List papers with extraction statuses (`QUEUED`, `EXTRACTING`, `READY`, `FAILED`) |
| `POST` | `/api/v1/projects/{id}/papers/{paper_id}/reprocess` | Re-trigger failed extraction pipeline |
| `POST` | `/api/v1/projects/{id}/assistant/chat` | Grounded RAG query stream with citations |
| `POST` | `/api/v1/projects/{id}/gap-analysis` | 2-column literature gap and novel direction discovery |
| `POST` | `/api/v1/projects/{id}/reviews` | Automated multi-paper literature review synthesis |
| `GET` | `/api/v1/projects/{id}/analytics` | pgvector chunk count, total papers, and entity counts |

---

## 🔒 Security & Data Privacy

- **Safe Passwords:** Passwords hashed with salted native `bcrypt` (mitigating Python 3.12 Passlib 72-byte truncation issues).
- **JWT Protection:** Secure HS256 tokens passed in HTTP Authorization headers (`Bearer <token>`).
- **Workspace Isolation:** Every manuscript, chunk, and vector query is scoped strictly to the project and authenticated user.
- **Zero Raw Data Leaks:** Environment secrets and raw uploaded storage files are protected via `.gitignore`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
