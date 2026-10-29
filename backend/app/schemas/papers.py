import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class PaperMetadataResponse(BaseModel):
    authors: List[str] = []
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    venue: Optional[str] = None
    methodology_summary: Optional[str] = None
    primary_datasets: List[str] = []
    evaluation_metrics: List[str] = []
    key_findings: List[str] = []
    stated_limitations: List[str] = []
    suggested_future_work: List[str] = []
    extraction_confidence: float = 1.0

    class Config:
        from_attributes = True

class PaperResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    status: str
    created_at: datetime
    metadata: Optional[PaperMetadataResponse] = None

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    research_objective: Optional[str] = None
    created_at: datetime
    paper_count: int = 0

    class Config:
        from_attributes = True

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    research_objective: Optional[str] = None

class AssistantChatRequest(BaseModel):
    query: str
    scope_type: str = "ENTIRE_PROJECT" # ENTIRE_PROJECT, SELECTED_PAPERS, SINGLE_PAPER
    selected_paper_ids: List[uuid.UUID] = []

class AssistantCitation(BaseModel):
    citation_id: int = 1
    paper_title: str
    page_number: int
    quoted_text: str
    verified: bool = True
    confidence_score: float = 0.95

class AssistantChatResponse(BaseModel):
    answer: str
    citations: List[AssistantCitation] = []
    grounded: bool = True
    verification_summary: Optional[str] = None
