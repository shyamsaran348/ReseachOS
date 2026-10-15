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
        top_k=4,  # Reduced to stay within Groq free-tier ITPM + OTPM limits
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
        # Truncate each chunk to ~600 chars to keep total prompt tokens low
        chunk_text = chunk.content[:600] if len(chunk.content) > 600 else chunk.content
        context_blocks.append(f"Source [{idx+1}] - {paper.title}:\n{chunk_text}")
        
    context_text = "\n\n".join(context_blocks)

    system_instruction = (
        f"You are an expert academic writer. Write a concise but comprehensive literature review (~400 words) on the topic. "
        f"Synthesize findings from the provided sources. Target audience: {request.target_audience}. "
        f"Use markdown with ## headers. Cite inline as [N]. Be dense and informative — no filler."
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
