from pydantic import BaseModel
import uuid

class ProjectAnalyticsResponse(BaseModel):
    project_id: uuid.UUID
    total_papers: int
    total_chunks: int
    extracted_entities_count: int
