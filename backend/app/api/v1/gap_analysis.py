import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Project, User, Paper, PaperVersion, PaperMetadata
from app.schemas.gap_analysis import GapAnalysisRequest, GapAnalysisResult, EvidenceGroundedGap
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

    # 1. Retrieve limitations and future work from database metadata
    stmt = (
        select(PaperMetadata)
        .join(PaperVersion, PaperMetadata.paper_version_id == PaperVersion.id)
        .join(Paper, PaperVersion.paper_id == Paper.id)
        .where(Paper.project_id == request.project_id)
        .where(Paper.deleted_at == None)
    )
    meta_res = await db.execute(stmt)
    metadata_list = meta_res.scalars().all()

    meta_evidence = []
    for m in metadata_list:
        if m.limitations:
            meta_evidence.append(f"Reported Limitations: {m.limitations}")
        if m.future_work:
            meta_evidence.append(f"Suggested Future Work: {m.future_work}")

    # 2. Retrieve semantic chunks broadly related to topic focus
    query_text = request.topic_focus.strip() if request.topic_focus and request.topic_focus.strip() else "limitations future work bottlenecks unaddressed challenges"
    relevant_chunks = await semantic_search_service.retrieve_chunks(
        db=db,
        query=query_text,
        project_id=str(request.project_id),
        top_k=6,
        relevance_threshold=0.20
    )

    if not relevant_chunks and not meta_evidence:
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
            ],
            grounded_gaps=[]
        )

    context_blocks = [chunk.content[:500] for chunk in relevant_chunks[:4]]
    if meta_evidence:
        context_blocks.extend(meta_evidence[:3])
    context_text = "\n\n".join(context_blocks)

    topic_str = request.topic_focus.strip() if request.topic_focus and request.topic_focus.strip() else "Cross-cutting research opportunities across project papers"

    system_instruction = (
        "You are a principal investigator and expert scientific reviewer. "
        "Analyze the provided academic literature context. Identify 3 specific gaps that remain unaddressed in the literature. "
        "For each gap, cite the supporting limitation evidence and propose a concrete hypothesis or experiment. "
        "Also supply a high-level list of identified_gaps and proposed_directions."
    )
    prompt = f"Target Topic / Perspective: {topic_str}\n\nEvidence Context:\n{context_text}"

    try:
        from pydantic import BaseModel
        class GroundedGapSchema(BaseModel):
            gap_title: str
            gap_description: str
            supporting_evidence: List[str]
            recommended_experiment: str

        class GapResultSchema(BaseModel):
            identified_gaps: List[str]
            proposed_directions: List[str]
            grounded_gaps: List[GroundedGapSchema]

        result = await groq_provider.generate_structured(
            prompt=prompt,
            schema_class=GapResultSchema,
            system_instruction=system_instruction
        )
        result_json = result.model_dump()

        grounded_items = [
            EvidenceGroundedGap(
                gap_title=g.get("gap_title", "Unexplored Frontier"),
                gap_description=g.get("gap_description", ""),
                supporting_evidence=g.get("supporting_evidence", []),
                recommended_experiment=g.get("recommended_experiment", "")
            )
            for g in result_json.get("grounded_gaps", [])
        ]

        return GapAnalysisResult(
            id=uuid.uuid4(),
            topic_focus=request.topic_focus or "",
            identified_gaps=result_json.get("identified_gaps", []),
            proposed_directions=result_json.get("proposed_directions", []),
            grounded_gaps=grounded_items
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
