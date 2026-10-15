import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models import Project, User, Paper, PaperChunk, PaperVersion
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

    return ProjectAnalyticsResponse(
        project_id=project_id,
        total_papers=papers_count or 0,
        total_chunks=chunks_count or 0,
        extracted_entities_count=0  # placeholder
    )
