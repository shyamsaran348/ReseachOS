# ResearchOS — Software Requirements Specification (SRS)
**Version**: 2.0.0  
**Status**: Milestone 2 Enhanced Specification  
**Author**: ResearchOS Architecture & Systems Engineering Team  

---

## 1. Executive Summary & Product Scope

### 1.1 Product Vision
**ResearchOS** is a project-centric research workspace powered by an evidence-grounded Research Intelligence Engine (RIE). Unlike generic PDF chatbots that query unstructured context windows on an ad-hoc basis, ResearchOS ingests, validates, structures, and indexes scientific literature into persistent knowledge graphs and vector embeddings. This reusable knowledge foundation powers semantic search, source-cited Q&A with claim entailment, automated literature reviews, cross-paper comparative matrices, quantitative gap analysis, and experiment tracking.

### 1.2 Core Architectural Principle
> *Process each uploaded document into reusable, verifiable research knowledge once, then consume that structured knowledge across multiple downstream intelligence features without repeatedly prompting LLMs to re-parse raw PDFs.*

---

## 2. In-Scope vs. Explicit Non-Goals

| Category | In-Scope (Milestone 1 & Milestone 2) | Explicit Out-of-Scope (Non-Goals) |
|---|---|---|
| **Document Processing** | Text, metadata, methodology, dataset, and limit extraction from PDF documents using PyMuPDF and LLM schemas; **Dynamic OCR Fallback with Tesseract for scanned manuscripts**; Section-aware hierarchical AST chunking. | Full multi-modal diagram vectorization or OCR training from scratch. |
| **Search & Retrieval** | **Hybrid Dense-Sparse Retrieval**: pgvector dense cosine distance merged with lexical keyword matching via Reciprocal Rank Fusion ($RRF$). | Internet-wide web scraping or automated multi-database crawling without uploaded PDFs. |
| **AI Generation** | Grounded Q&A with **claim entailment verification**, multi-paper literature reviews, and **Comparative Literature Matrices with LaTeX export**. | Autonomous generation of publication-ready manuscripts without human review. |
| **Gap Analysis** | **Evidence-Grounded Research Gap Explorer** linking candidate gaps directly to extracted limitations and future work snippets. | Guaranteeing discovery of novel scientific laws across the unread global literature. |
| **Experimentation** | Structural logging of experiment parameters, datasets, metrics, and paper linkages. | Executing scientific code or remote container orchestrations. |

---

## 3. User Roles and Authorization Matrix (RBAC)

| Action / Capability | Project Owner | Project Editor | Project Viewer | Non-Member |
|---|:---:|:---:|:---:|:---:|
| View Project Metadata & Dashboard | ✅ | ✅ | ✅ | ❌ |
| Invite / Remove Members | ✅ | ❌ | ❌ | ❌ |
| Edit Project Settings / Archive | ✅ | ❌ | ❌ | ❌ |
| Upload PDFs & Trigger Processing | ✅ | ✅ | ❌ | ❌ |
| Edit Extracted Paper Metadata | ✅ | ✅ | ❌ | ❌ |
| Delete Paper (Soft/Hard Delete) | ✅ | ❌ | ❌ | ❌ |
| Execute Grounded Q&A Assistant | ✅ | ✅ | ✅ | ❌ |
| Generate Literature Reviews & Matrices | ✅ | ✅ | ❌ | ❌ |
| Run & Save Research Gap Analysis | ✅ | ✅ | ❌ | ❌ |
| Export Markdown / LaTeX Tables | ✅ | ✅ | ✅ | ❌ |

---

## 4. Functional Requirements & Acceptance Criteria (Milestone 2 Updates)

### Module A: Authentication & User Management
* **REQ-AUTH-01**: Users register with email, display name, and password.
* **REQ-AUTH-02**: Passwords hashed using `bcrypt`.
* **REQ-AUTH-03**: Secure JWT Bearer access token verification.

### Module B: Ingestion & Open-Source OCR Fallback
* **REQ-RIE-01**: Text extraction via PyMuPDF.
* **REQ-RIE-02 (New in M2)**: If page text contains $< 30$ words or is a scanned image, dynamically render page pixmap (`dpi=200`) and execute Tesseract OCR.
* **REQ-RIE-03 (New in M2)**: Hierarchical Section-Aware AST chunking detecting canonical academic headers (`Abstract`, `Introduction`, `Methodology`, `Results`, `Limitations`, `Future Work`), prefixing chunks with `[<SectionTitle> | Pages X-Y]`.

### Module C: Hybrid Retrieval & Citation Entailment
* **REQ-RET-01 (New in M2)**: Hybrid retrieval combining PostgreSQL `pgvector` cosine similarity with sparse lexical matching using Reciprocal Rank Fusion ($RRF$).
* **REQ-RET-02 (New in M2)**: Citation claim entailment validation checking semantic token overlap between generated answers citing `[Citation N]` and source chunks.

### Module D: Synthesis Reviews & Comparative Literature Matrix
* **REQ-REV-01**: Multi-paper literature review synthesis tailored to target depth (Academic, Practitioner, Executive).
* **REQ-REV-02 (New in M2)**: Automated extraction of cross-paper Comparative Literature Matrix aligning Core Methods, Datasets, Metrics, and Limitations side-by-side with one-click **LaTeX Table (`.tex`) export**.

### Module E: Evidence-Grounded Research Gap Explorer
* **REQ-GAP-01 (New in M2)**: Discovered gaps must ground each candidate frontier in extracted limitation quotes from the literature, accompanied by actionable experimental hypotheses.
