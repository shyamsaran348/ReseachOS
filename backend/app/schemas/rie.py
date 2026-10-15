import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, field_validator


class ExtractedPaperMetadata(BaseModel):
    """Pydantic schema for structured metadata extracted by the Groq LLM."""
    title: str = "Unknown Title"
    authors: List[str] = []
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    venue: Optional[str] = None
    keywords: List[str] = []
    methodology_summary: Optional[str] = None
    primary_datasets: List[str] = []
    evaluation_metrics: List[str] = []
    key_findings: List[str] = []
    stated_limitations: List[str] = []
    suggested_future_work: List[str] = []
    extraction_confidence: float = 0.9

    @field_validator("publication_year", mode="before")
    @classmethod
    def validate_year(cls, v):
        if v is None:
            return None
        try:
            year = int(v)
            if 1900 <= year <= datetime.now().year + 1:
                return year
        except (ValueError, TypeError):
            pass
        return None

    @field_validator("extraction_confidence", mode="before")
    @classmethod
    def clamp_confidence(cls, v):
        try:
            return max(0.0, min(1.0, float(v)))
        except (TypeError, ValueError):
            return 0.9


class GapAnalysisSchema(BaseModel):
    """Internal Pydantic schema for Groq structured gap analysis."""
    identified_gaps: List[str] = []
    proposed_directions: List[str] = []
