from pydantic import BaseModel
from typing import List, Optional
import uuid

class LiteratureReviewRequest(BaseModel):
    project_id: uuid.UUID
    topic: str
    target_audience: Optional[str] = "researchers"
    max_papers: int = 10

class LiteratureReviewResult(BaseModel):
    id: uuid.UUID
    topic: str
    markdown_content: str
    cited_paper_ids: List[uuid.UUID]

class MatrixPaperEntry(BaseModel):
    paper_id: uuid.UUID
    title: str
    authors: List[str] = []
    publication_year: Optional[int] = None
    core_methodology: str = "Deep Learning Architecture"
    datasets_evaluated: List[str] = []
    metrics_reported: List[str] = []
    key_findings: List[str] = []
    limitations: List[str] = []

class ComparativeMatrixResponse(BaseModel):
    project_id: uuid.UUID
    total_papers: int
    matrix: List[MatrixPaperEntry]
    latex_table: str
