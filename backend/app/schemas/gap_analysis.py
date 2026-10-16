from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class GapAnalysisRequest(BaseModel):
    project_id: uuid.UUID
    topic_focus: Optional[str] = Field(default="", description="Optional topic focus for gap discovery")

class GapAnalysisResult(BaseModel):
    id: uuid.UUID
    topic_focus: Optional[str] = ""
    identified_gaps: List[str]
    proposed_directions: List[str]
