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
