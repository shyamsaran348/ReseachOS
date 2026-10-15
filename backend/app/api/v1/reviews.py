import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import Project, User, PaperVersion, Paper
from app.schemas.reviews import LiteratureReviewRequest, LiteratureReviewResult
from app.api.v1.projects import get_current_user
from app.rie.integrations.groq_provider import groq_provider
from app.rie.retrieval.semantic_search import semantic_search_service

router = APIRouter()

@router.post("", response_model=LiteratureReviewResult)
async def generate_literature_review(
    request: LiteratureReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, request.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    # Retrieve broad context
    relevant_chunks = await semantic_search_service.retrieve_chunks(
        db=db,
        query=request.topic,
        project_id=str(request.project_id),
        top_k=8,
        relevance_threshold=0.25
    )

    if not relevant_chunks:
        raise HTTPException(status_code=400, detail="Not enough documents in the project to generate a review.")

    # Build Context Map
    cited_paper_ids = set()
    context_blocks = []
    
    for idx, chunk in enumerate(relevant_chunks):
        version = await db.get(PaperVersion, chunk.paper_version_id)
        paper = await db.get(Paper, version.paper_id)
        cited_paper_ids.add(paper.id)
        context_blocks.append(f"Source [{idx+1}] - {paper.title}:\n{chunk.content}")
        
    context_text = "\n\n".join(context_blocks)

    system_instruction = (
        f"You are an expert academic writer. Write a comprehensive literature review on the provided topic. "
        f"Synthesize the findings from the provided context. Target audience: {request.target_audience}. "
        f"Use markdown formatting, including headers and bullet points where appropriate. "
        f"Cite sources inline using [N] format matching the provided sources."
    )
    
    prompt = f"Topic: {request.topic}\n\nSources:\n{context_text}"
    
    try:
        review_markdown = await groq_provider.generate_completion(prompt, system_instruction)
        
        return LiteratureReviewResult(
            id=uuid.uuid4(),
            topic=request.topic,
            markdown_content=review_markdown,
            cited_paper_ids=list(cited_paper_ids)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
