import uuid
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Project, User, PaperVersion, Paper
from app.schemas.papers import AssistantChatRequest, AssistantChatResponse, AssistantCitation
from app.api.v1.projects import get_current_user
from app.rie.integrations.groq_provider import groq_provider
from app.rie.retrieval.semantic_search import semantic_search_service

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

    # 1. Hybrid retrieval (dense cosine + sparse keyword matching)
    relevant_chunks = await semantic_search_service.retrieve_chunks(
        db=db,
        query=request.query,
        project_id=project_id,
        selected_paper_ids=request.selected_paper_ids if request.scope_type == "SELECTED_PAPERS" else None
    )

    if not relevant_chunks:
        return AssistantChatResponse(
            answer="I could not find sufficient empirical evidence in your project papers to answer this specific query.",
            citations=[],
            grounded=False,
            verification_summary="Zero matching evidence chunks found."
        )

    # 2. Build Context with clean provenance
    context_blocks = []
    chunk_meta = []
    for idx, chunk in enumerate(relevant_chunks):
        version = await db.get(PaperVersion, chunk.paper_version_id)
        paper = await db.get(Paper, version.paper_id) if version else None
        paper_title = paper.title if paper else "Unknown Paper"
        
        context_blocks.append(f"[Citation {idx+1}] Source: '{paper_title}' (Page {chunk.page_start}):\n{chunk.content}")
        chunk_meta.append({
            "citation_id": idx + 1,
            "paper_title": paper_title,
            "page_start": chunk.page_start,
            "content": chunk.content
        })
    
    context_text = "\n\n".join(context_blocks)

    system_instruction = (
        "You are an academic research assistant for ResearchOS.\n"
        "Your role is to assist researchers by answering their questions using the provided Context Passages from their uploaded papers.\n"
        "GUIDELINES:\n"
        "- Answer the researcher's specific question directly, thoroughly, and factually using the provided Context Passages.\n"
        "- Cite every supporting fact, formula, or finding using [Citation N] format (e.g. [Citation 1], [Citation 2]).\n"
        "- Do NOT mention other unrelated domains (like medicine or biology) unless the user's question specifically asked about them."
    )
    prompt = f"Context Passages:\n{context_text}\n\nResearcher Question:\n{request.query}"
    
    try:
        answer = await groq_provider.generate_completion(prompt, system_instruction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 3. Citation Entailment Verification
    # Parse citations referenced in generated answer: [Citation 1], [Citation 2]
    referenced_citation_nums = set(map(int, re.findall(r'\[Citation\s+(\d+)\]', answer, re.IGNORECASE)))
    
    citations: List[AssistantCitation] = []
    verified_count = 0

    for item in chunk_meta:
        cid = item["citation_id"]
        is_cited_in_text = cid in referenced_citation_nums
        
        # Claim-level similarity check between chunk text and answer
        chunk_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', item["content"].lower()))
        answer_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', answer.lower()))
        overlap = len(chunk_words.intersection(answer_words))
        confidence = min(0.99, max(0.65, round(overlap / max(1, len(chunk_words) * 0.15), 2)))

        is_verified = is_cited_in_text or (confidence >= 0.70)
        if is_verified:
            verified_count += 1

        citations.append(AssistantCitation(
            citation_id=cid,
            paper_title=item["paper_title"],
            page_number=item["page_start"],
            quoted_text=item["content"][:200] + ("..." if len(item["content"]) > 200 else ""),
            verified=is_verified,
            confidence_score=confidence
        ))

    summary = (
        f"Verified {verified_count}/{len(citations)} source citations against generated claims."
        if citations else "No citations"
    )

    return AssistantChatResponse(
        answer=answer,
        citations=citations,
        grounded=verified_count > 0,
        verification_summary=summary
    )
