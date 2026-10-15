import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Project, User
from app.schemas.papers import AssistantChatRequest, AssistantChatResponse, AssistantCitation
from app.api.v1.projects import get_current_user
from app.rie.integrations.groq_provider import groq_provider

router = APIRouter()

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    project_id: uuid.UUID,
    request: AssistantChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.rie.retrieval.semantic_search import semantic_search_service
    from app.db.models import PaperVersion, Paper

    # 1. Retrieve chunks
    relevant_chunks = await semantic_search_service.retrieve_chunks(
        db=db,
        query=request.query,
        project_id=project_id,
        selected_paper_ids=request.selected_paper_ids if request.scope_type == "SELECTED_PAPERS" else None
    )

    if not relevant_chunks:
        return AssistantChatResponse(
            answer="I'm sorry, but I couldn't find sufficient evidence in your collection to answer this question.",
            citations=[],
            grounded=False
        )

    # 2. Build Context
    context_blocks = []
    for idx, chunk in enumerate(relevant_chunks):
        # We should ideally fetch paper title, but we can do it efficiently
        version = await db.get(PaperVersion, chunk.paper_version_id)
        paper = await db.get(Paper, version.paper_id)
        context_blocks.append(f"[Citation {idx+1}] Source: '{paper.title}' (Page {chunk.page_start}):\n{chunk.content}")
    
    context_text = "\n\n".join(context_blocks)

    system_instruction = (
        "You are an expert research assistant. Answer the user's question based strictly on the provided context. "
        "Do not hallucinate. Cite your sources using [Citation N] format."
    )
    prompt = f"Context:\n{context_text}\n\nQuestion: {request.query}"
    
    try:
        answer = await groq_provider.generate_completion(prompt, system_instruction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    citations = []
    for idx, chunk in enumerate(relevant_chunks):
        version = await db.get(PaperVersion, chunk.paper_version_id)
        paper = await db.get(Paper, version.paper_id)
        citations.append(AssistantCitation(
            paper_title=paper.title,
            page_number=chunk.page_start,
            quoted_text=chunk.content[:100] + "..."
        ))

    return AssistantChatResponse(
        answer=answer,
        citations=citations,
        grounded=True
    )
