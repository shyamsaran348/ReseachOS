from pydantic import BaseModel
from typing import List
import uuid

class GapAnalysisRequest(BaseModel):
    project_id: uuid.UUID
    topic_focus: str

class GapAnalysisResult(BaseModel):
    id: uuid.UUID
    topic_focus: str
    identified_gaps: List[str]
    proposed_directions: List[str]
