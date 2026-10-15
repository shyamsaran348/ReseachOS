# ResearchOS — Software Requirements Specification (SRS)
**Version**: 1.0.0  
**Status**: Frozen / Baseline Specification  
**Author**: ResearchOS Architecture & Systems Engineering Team  

---

## 1. Executive Summary & Product Scope

### 1.1 Product Vision
**ResearchOS** is a project-centric research workspace powered by an evidence-grounded Research Intelligence Engine (RIE). Unlike generic PDF chatbots that query unstructured context windows on an ad-hoc basis, ResearchOS ingests, validates, structures, and indexes scientific literature into persistent knowledge graphs and vector embeddings. This reusable knowledge foundation powers semantic search, source-cited Q&A, automated literature reviews, quantitative gap analysis, and experiment tracking.

### 1.2 Core Architectural Principle
> *Process each uploaded document into reusable, verifiable research knowledge once, then consume that structured knowledge across multiple downstream intelligence features without repeatedly prompting LLMs to re-parse raw PDFs.*

### 1.3 Target Audience & Primary Use Cases
* **Academic Researchers & Ph.D. Candidates**: Managing topic-specific paper collections, extracting methodologies/datasets, generating draft literature reviews.
* **R&D & Industrial Researchers**: Tracking experimental runs, comparing state-of-the-art results across publications, identifying under-explored methodological combinations.
* **Research Group Leaders & Labs**: Maintaining shared research repositories with strict project-level access boundaries.

---

## 2. In-Scope vs. Explicit Non-Goals

| Category | In-Scope (Phase 1 & Phase 2) | Explicit Out-of-Scope (Non-Goals) |
|---|---|---|
| **Document Processing** | Text, metadata, methodology, dataset, and limit extraction from PDF documents using PyMuPDF and LLM schemas. | Automated OCR for scanned historical documents (flagged as `requires_ocr`). |
| **Search & Retrieval** | Hybrid keyword (PostgreSQL Full-Text Search) and vector similarity (`pgvector`) retrieval scoped by project. | Internet-wide web scraping or automated multi-database crawling without uploaded PDFs. |
| **AI Generation** | Grounded Q&A with clickable citation provenance, section-by-section literature review generation. | Autonomous generation of publication-ready manuscripts without human review. |
| **Gap Analysis** | Collection-level quantitative metrics (distributions of methods, datasets, limitations) paired with candidate AI insights. | Guaranteeing discovery of novel scientific laws or proving absence of a concept across the global body of literature. |
| **Experimentation** | Structural logging of experiment parameters, datasets, metrics, and paper linkages. | Executing scientific code, ML training pipelines, or remote container orchestrations. |

---

## 3. User Roles and Authorization Matrix

### 3.1 Role Definitions
1. **System Administrator / System**: Global administrative access and automated system jobs.
2. **Project Owner**: Creator of a workspace; possesses full control over project configuration, membership, paper deletion, and data export.
3. **Project Editor (Researcher)**: Member with permissions to upload papers, trigger RIE jobs, edit metadata, create experiments, generate reviews, and run gap analyses.
4. **Project Viewer**: Member with read-only access to papers, metadata, analytics, and generated reports.

### 3.2 Authorization Matrix (RBAC)

| Action / Capability | Project Owner | Project Editor | Project Viewer | Non-Member |
|---|:---:|:---:|:---:|:---:|
| View Project Metadata & Dashboard | ✅ | ✅ | ✅ | ❌ |
| Invite / Remove Members | ✅ | ❌ | ❌ | ❌ |
| Edit Project Settings / Archive | ✅ | ❌ | ❌ | ❌ |
| Upload PDFs & Trigger Processing | ✅ | ✅ | ❌ | ❌ |
| Edit Extracted Paper Metadata | ✅ | ✅ | ❌ | ❌ |
| Delete Paper (Soft/Hard Delete) | ✅ | ❌ | ❌ | ❌ |
| Execute AI Q&A Assistant | ✅ | ✅ | ✅ | ❌ |
| Generate & Edit Literature Reviews | ✅ | ✅ | ❌ | ❌ |
| Run & Save Research Gap Analysis | ✅ | ✅ | ❌ | ❌ |
| Create / Update Experiment Records | ✅ | ✅ | ❌ | ❌ |
| Export PDF/DOCX Reports | ✅ | ✅ | ✅ | ❌ |

---

## 4. Functional Requirements & Acceptance Criteria

### Module A: Authentication & User Management
* **REQ-AUTH-01**: Users must register with a valid email address, full name, and strong password (minimum 8 characters, requiring uppercase, lowercase, and numeric characters).
* **REQ-AUTH-02**: Passwords must be hashed using `bcrypt` (or `argon2id`) with an appropriate cost factor before storage.
* **REQ-AUTH-03**: Authenticated sessions must use secure, short-lived JWT access tokens accompanied by HttpOnly, SameSite=Lax refresh cookies.
* **REQ-AUTH-04**: Access to all endpoints under `/api/v1/projects/{project_id}/*` must evaluate project membership and role permissions prior to execution.

### Module B: Project & Literature Library Management
* **REQ-LIT-01**: Users can create multi-member projects with explicit titles, research objectives, and tags.
* **REQ-LIT-02**: Paper uploads must validate PDF headers (magic bytes `%PDF-`), enforce configurable file size limits (default: 50MB), and calculate SHA-256 hashes to detect intra-project duplicates.
* **REQ-LIT-03**: Duplicate uploads within the same project must prompt the user to either navigate to the existing record or create a new explicit version.
* **REQ-LIT-04**: The Literature Library must render paginated, searchable, and filterable tables displaying title, authors, year, DOI, extracted methodology, tags, and RIE processing status.
* **REQ-LIT-05**: Deleting a paper must mark the record as soft-deleted, remove related vector embeddings from `pgvector`, and safely un-link dependent experiments.

### Module C: Research Intelligence Engine (RIE) - Ingestion & Extraction
* **REQ-RIE-01**: Extracted PDF text must preserve exact page numbers and chunk boundaries for downstream citation provenance.
* **REQ-RIE-02**: Metadata extraction must produce structured JSON matching Pydantic schemas for: `title`, `authors`, `publication_year`, `doi`, `abstract`, `methodology_summary`, `primary_datasets`, `evaluation_metrics`, `key_findings`, `stated_limitations`, and `suggested_future_work`.
* **REQ-RIE-03**: Text chunking must execute section-aware splitting with an target size of 512 tokens and 64-token overlap.
* **REQ-RIE-04**: Extracted claims must undergo automated schema and evidence validation against source text before status transitions to `READY`.

### Module D: Workspace AI Assistant
* **REQ-AI-01**: The assistant must support explicit search scopes: `Selected Papers`, `Entire Project Collection`, or `Single Paper Detail`.
* **REQ-AI-02**: Responses must strictly ground claims in retrieved text chunks and return structured citations containing `paper_id`, `paper_title`, `page_number`, and `exact_quote`.
* **REQ-AI-03**: If retrieved context fails relevance thresholds (< 0.65 cosine similarity), the assistant must explicitly respond that available project literature lacks sufficient evidence.

### Module E: Literature Review Generator
* **REQ-REV-01**: Users must select source papers and review parameters (Chronological, Thematic, or Methodological Comparison).
* **REQ-REV-02**: Review generation must first produce a high-level editable outline before synthesizing full sections.
* **REQ-REV-03**: Generation must execute section-by-section to prevent context exhaustion and ensure strict claim-to-source mapping.

### Module F: Research Gap Analyzer
* **REQ-GAP-01**: The system must compute deterministic collection-level statistics: method distribution, dataset counts, and limitation frequency matrices.
* **REQ-GAP-02**: Candidate gap identification must cross-reference underrepresented combinations (e.g., Method X evaluated on Dataset Y) with LLM-synthesized qualitative analysis.
* **REQ-GAP-03**: Every candidate gap must clearly distinguish between a *Measured Gap in Uploaded Collection* vs. an *Unverified Field-Wide Gap*.

### Module G: Experiment Management & Analytics
* **REQ-EXP-01**: Users can log experimental runs with parameters, dataset references, model configurations, metrics (e.g., accuracy, F1-score, throughput), and execution status (`PLANNED`, `RUNNING`, `COMPLETED`, `FAILED`).
* **REQ-EXP-02**: Side-by-side metric comparison must allow selecting multiple runs within a project.
* **REQ-EXP-03**: Experiments can be explicitly linked to one or more literature papers to track method provenance.

---

## 5. Non-Functional & Quality Requirements

* **Performance**: API response times for non-AI requests < 200ms. PDF extraction and vector indexing job completion < 30 seconds for standard 15-page papers.
* **Reliability & Idempotency**: All background processing jobs must support retry handling with exponential backoff and idempotent state transition guarantees.
* **Security & Isolation**: Strict project isolation at database query layer. Zero leak of vectors or papers across distinct projects. Private file storage via signed URLs.
* **Auditability**: Audit logging for all destructive actions (paper deletion, membership changes, schema updates).
