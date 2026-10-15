# ResearchOS — API & Service Contract Specification
**Version**: 1.0.0  
**Prefix**: `/api/v1`  
**Format**: OpenAPI 3.0 / JSON  

---

## 1. Error Response Contract

All API errors return a standardized JSON structure with HTTP status codes:

```json
{
  "error": {
    "code": "PAPER_PROCESSING_FAILED",
    "message": "Extracted PDF text is unreadable or empty.",
    "details": {
      "paper_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "stage": "text_extraction",
      "retryable": false,
      "recommended_action": "REQUIRES_OCR"
    },
    "request_id": "req-8f4b2a9e-1234-5678-9abc-def012345678"
  }
}
```

---

## 2. API Endpoint Inventory

### 2.1 Authentication & Profile
* `POST /api/v1/auth/register` — Create new user account.
* `POST /api/v1/auth/login` — Authenticate and receive JWT access token + refresh cookie.
* `POST /api/v1/auth/refresh` — Refresh access token.
* `GET /api/v1/auth/me` — Retrieve current authenticated user profile.

### 2.2 Projects & Members
* `GET /api/v1/projects` — List user's accessible projects.
* `POST /api/v1/projects` — Create a new project.
* `GET /api/v1/projects/{project_id}` — Retrieve project details & statistics.
* `PATCH /api/v1/projects/{project_id}` — Update project metadata.
* `DELETE /api/v1/projects/{project_id}` — Soft delete / archive project (Owner only).
* `GET /api/v1/projects/{project_id}/members` — List project members and roles.
* `POST /api/v1/projects/{project_id}/members` — Invite user to project.

### 2.3 Papers & Processing Jobs
* `POST /api/v1/projects/{project_id}/papers` — Upload PDF file (Multipart Form). Returns `202 Accepted` with `paper_id` and `job_id`.
* `GET /api/v1/projects/{project_id}/papers` — List papers in project with filtering & pagination.
* `GET /api/v1/papers/{paper_id}` — Get paper details, versions, and extracted metadata.
* `PATCH /api/v1/papers/{paper_id}/metadata` — Submit user corrections for extracted metadata fields.
* `DELETE /api/v1/papers/{paper_id}` — Soft delete paper and purge vector embeddings.
* `GET /api/v1/jobs/{job_id}` — Check status of background processing job.
* `POST /api/v1/jobs/{job_id}/retry` — Re-trigger failed job step.

### 2.4 Research Intelligence Engine (RIE) Services
* `POST /api/v1/projects/{project_id}/assistant/chat` — Send query to grounded AI assistant.
* `POST /api/v1/projects/{project_id}/reviews` — Initialize literature review request.
* `POST /api/v1/reviews/{review_id}/generate-section` — Synthesize specific outline section.
* `POST /api/v1/projects/{project_id}/gap-analysis` — Trigger quantitative gap analysis engine.
* `GET /api/v1/gap-analyses/{analysis_id}` — Fetch completed gap matrix & candidate insights.

---

## 3. RIE Pydantic Data Extraction Schema

The Research Intelligence Engine forces LLM metadata output to strictly conform to the following Pydantic schema:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class ExtractedPaperMetadata(BaseModel):
    title: str = Field(..., description="Full official title of the paper")
    authors: List[str] = Field(default_factory=list, description="List of author full names")
    publication_year: Optional[int] = Field(None, description="4-digit publication year")
    doi: Optional[str] = Field(None, description="Digital Object Identifier")
    abstract: str = Field(..., description="Extracted paper abstract")
    methodology_summary: str = Field(..., description="Concise summary of proposed methodology or algorithm")
    primary_datasets: List[str] = Field(default_factory=list, description="Datasets evaluated or benchmarked")
    evaluation_metrics: List[str] = Field(default_factory=list, description="Key performance metrics reported")
    key_findings: List[str] = Field(default_factory=list, description="Main empirical results or conclusions")
    stated_limitations: List[str] = Field(default_factory=list, description="Explicit limitations mentioned by authors")
    suggested_future_work: List[str] = Field(default_factory=list, description="Future research directions noted")
    extraction_confidence: float = Field(1.0, ge=0.0, le=1.0, description="Model self-assessed extraction confidence")
```
