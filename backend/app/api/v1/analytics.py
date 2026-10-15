import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models import Project, User, Paper, PaperChunk, PaperVersion, PaperMetadata
from app.schemas.analytics import ProjectAnalyticsResponse
from app.api.v1.projects import get_current_user

router = APIRouter()

@router.get("", response_model=ProjectAnalyticsResponse)
async def get_project_analytics(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    # Count papers
    papers_count = await db.scalar(
        select(func.count(Paper.id)).where(Paper.project_id == project_id, Paper.deleted_at == None)
    )

    # Count chunks
    stmt = (
        select(func.count(PaperChunk.id))
        .join(PaperVersion, PaperChunk.paper_version_id == PaperVersion.id)
        .join(Paper, PaperVersion.paper_id == Paper.id)
        .where(Paper.project_id == project_id, Paper.deleted_at == None)
    )
    chunks_count = await db.scalar(stmt)

    # Compute extracted entities count (methodologies, metrics, datasets, keywords)
    stmt_meta = (
        select(PaperMetadata)
        .join(PaperVersion, PaperMetadata.paper_version_id == PaperVersion.id)
        .join(Paper, PaperVersion.paper_id == Paper.id)
        .where(Paper.project_id == project_id, Paper.deleted_at == None)
    )
    meta_res = await db.execute(stmt_meta)
    meta_records = meta_res.scalars().all()

    unique_entities = set()
    for meta in meta_records:
        for item in (meta.keywords or []):
            if item:
                unique_entities.add(f"kw:{item.strip().lower()}")
        for item in (meta.evaluation_metrics or []):
            if item:
                unique_entities.add(f"metric:{item.strip().lower()}")
        for item in (meta.primary_datasets or []):
            if item:
                unique_entities.add(f"dataset:{item.strip().lower()}")
        for item in (meta.key_findings or []):
            if item:
                unique_entities.add(f"finding:{item.strip()[:40].lower()}")

    entities_count = len(unique_entities)

    return ProjectAnalyticsResponse(
        project_id=project_id,
        total_papers=papers_count or 0,
        total_chunks=chunks_count or 0,
        extracted_entities_count=entities_count
    )
