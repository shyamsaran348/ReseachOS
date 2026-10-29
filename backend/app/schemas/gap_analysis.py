from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class GapAnalysisRequest(BaseModel):
    project_id: uuid.UUID
    topic_focus: Optional[str] = Field(default="", description="Optional topic focus for gap discovery")

class EvidenceGroundedGap(BaseModel):
    gap_title: str
    gap_description: str
    supporting_evidence: List[str] = [] # quotes or limitation references
    recommended_experiment: str

class GapAnalysisResult(BaseModel):
    id: uuid.UUID
    topic_focus: Optional[str] = ""
    identified_gaps: List[str]
    proposed_directions: List[str]
    grounded_gaps: List[EvidenceGroundedGap] = []
