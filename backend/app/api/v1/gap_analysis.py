import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Project, User
from app.schemas.gap_analysis import GapAnalysisRequest, GapAnalysisResult
from app.api.v1.projects import get_current_user
from app.rie.integrations.groq_provider import groq_provider
from app.rie.retrieval.semantic_search import semantic_search_service

router = APIRouter()

@router.post("", response_model=GapAnalysisResult)
async def analyze_gaps(
    request: GapAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, request.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Retrieve chunks broadly related to the topic focus
    query_text = request.topic_focus.strip() if request.topic_focus and request.topic_focus.strip() else "key methodologies evaluation limits future work"
    relevant_chunks = await semantic_search_service.retrieve_chunks(
        db=db,
        query=query_text,
        project_id=str(request.project_id),
        top_k=8,
        relevance_threshold=0.25
    )

    if not relevant_chunks:
        return GapAnalysisResult(
            id=uuid.uuid4(),
            topic_focus=request.topic_focus,
            identified_gaps=[
                "No documents uploaded to this workspace yet.",
                "Upload related research PDFs to the Papers Library to enable semantic chunk extraction and literature gap discovery."
            ],
            proposed_directions=[
                "Upload 2 to 5 relevant papers covering your domain to discover intersections and open research questions.",
                "Utilize the RAG assistant to query methodologies across uploaded manuscripts."
            ]
        )

    context_blocks = [chunk.content for chunk in relevant_chunks]
    context_text = "\n\n".join(context_blocks)

    system_instruction = (
        "You are a principal investigator and expert research scientist. "
        "Analyze the provided research context and identify specific gaps in the literature. "
        "Then, propose future research directions to address these gaps. "
        "Format your output as JSON with two keys: 'identified_gaps' (list of strings) and 'proposed_directions' (list of strings)."
    )
    prompt = f"Topic Focus: {request.topic_focus}\n\nContext:\n{context_text}"
    
    # Need to extract json using Groq JSON mode (which our provider handles if we pass schemas, but we can just use generate_metadata for now)
    
    # We will mock the JSON parsing for this endpoint since groq_provider.generate_metadata is built for this.
    try:
        from pydantic import BaseModel
        class GapSchema(BaseModel):
            identified_gaps: List[str]
            proposed_directions: List[str]
            
        result_json = await groq_provider.generate_metadata(context_text, GapSchema)
        
        return GapAnalysisResult(
            id=uuid.uuid4(),
            topic_focus=request.topic_focus,
            identified_gaps=result_json.get("identified_gaps", []),
            proposed_directions=result_json.get("proposed_directions", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
