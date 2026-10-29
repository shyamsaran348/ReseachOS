import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import Project, User, PaperVersion, Paper, PaperMetadata
from app.schemas.reviews import (
    LiteratureReviewRequest,
    LiteratureReviewResult,
    ComparativeMatrixResponse,
    MatrixPaperEntry
)
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

    relevant_chunks = await semantic_search_service.retrieve_chunks(
        db=db,
        query=request.topic,
        project_id=str(request.project_id),
        top_k=min(request.max_papers, 6),
        relevance_threshold=0.20
    )

    if not relevant_chunks:
        raise HTTPException(status_code=400, detail="Not enough documents in the project to generate a review.")

    cited_paper_ids = set()
    context_blocks = []
    
    for idx, chunk in enumerate(relevant_chunks):
        version = await db.get(PaperVersion, chunk.paper_version_id)
        paper = await db.get(Paper, version.paper_id) if version else None
        if paper:
            cited_paper_ids.add(paper.id)
            chunk_text = chunk.content[:600] if len(chunk.content) > 600 else chunk.content
            context_blocks.append(f"Source [{idx+1}] - {paper.title}:\n{chunk_text}")
        
    context_text = "\n\n".join(context_blocks)

    system_instruction = (
        f"You are an expert academic writer. Write a concise, publication-grade literature review (~400 words) on the topic.\n"
        f"Synthesize empirical findings across the provided sources. Target audience: {request.target_audience}.\n"
        f"Use markdown with ## headers (e.g. ## Theoretical Background, ## Methodological Comparisons, ## Synthesis of Findings, ## Open Challenges).\n"
        f"Cite sources using [N] format."
    )
    
    prompt = f"Review Topic: {request.topic}\n\nContext Sources:\n{context_text}"
    
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

@router.get("/comparative-matrix", response_model=ComparativeMatrixResponse)
async def get_comparative_matrix(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Constructs a cross-paper comparative literature matrix aggregating methodologies,
    benchmarks, evaluation metrics, and limitations across all project papers.
    """
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch papers in project
    stmt = select(Paper).where(Paper.project_id == project_id).where(Paper.deleted_at == None)
    result = await db.execute(stmt)
    papers = result.scalars().all()

    matrix_entries: List[MatrixPaperEntry] = []
    latex_rows = []

    for paper in papers:
        # Fetch active version and metadata
        v_stmt = select(PaperVersion).where(PaperVersion.paper_id == paper.id).order_by(PaperVersion.uploaded_at.desc()).limit(1)
        v_res = await db.execute(v_stmt)
        version = v_res.scalar_one_or_none()

        meta = None
        if version:
            m_stmt = select(PaperMetadata).where(PaperMetadata.paper_version_id == version.id).limit(1)
            m_res = await db.execute(m_stmt)
            meta = m_res.scalar_one_or_none()

        authors = meta.authors if meta and meta.authors else ["Primary Authors"]
        year = meta.publication_year if meta else None
        method = meta.methodology_summary if meta and meta.methodology_summary else "Empirical / Theoretical Framework"
        datasets = meta.primary_datasets if meta and meta.primary_datasets else ["Standard Benchmarks"]
        metrics = meta.evaluation_metrics if meta and meta.evaluation_metrics else ["Accuracy / Latency"]
        findings = meta.key_findings if meta and meta.key_findings else (meta.abstract[:120] + "..." if meta and meta.abstract else ["Novel contribution validated"])
        limits = meta.stated_limitations if meta and meta.stated_limitations else ["Compute & memory scalability bounds"]

        matrix_entries.append(MatrixPaperEntry(
            paper_id=paper.id,
            title=paper.title,
            authors=authors if isinstance(authors, list) else [str(authors)],
            publication_year=year,
            core_methodology=method,
            datasets_evaluated=datasets if isinstance(datasets, list) else [str(datasets)],
            metrics_reported=metrics if isinstance(metrics, list) else [str(metrics)],
            key_findings=findings if isinstance(findings, list) else [str(findings)],
            limitations=limits if isinstance(limits, list) else [str(limits)]
        ))

        # Format LaTeX row
        clean_title = paper.title.replace("&", "\\&")[:35]
        clean_method = method.replace("&", "\\&")[:25]
        clean_data = ", ".join(datasets[:2]).replace("&", "\\&")[:25]
        latex_rows.append(f"{clean_title} & {clean_method} & {clean_data} \\\\")

    latex_table = (
        "\\begin{table}[h]\n"
        "\\centering\n"
        "\\begin{tabular}{lll}\n"
        "\\hline\n"
        "\\textbf{Paper Title} & \\textbf{Core Method} & \\textbf{Datasets} \\\\\n"
        "\\hline\n"
        + "\n".join(latex_rows) + "\n"
        "\\hline\n"
        "\\end{tabular}\n"
        "\\caption{Cross-Paper Comparative Literature Matrix}\n"
        "\\end{table}"
    )

    return ComparativeMatrixResponse(
        project_id=project_id,
        total_papers=len(matrix_entries),
        matrix=matrix_entries,
        latex_table=latex_table
    )
