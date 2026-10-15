import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import Project, User, Paper
from app.schemas.papers import ProjectResponse, CreateProjectRequest
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Project)
        .where(Project.owner_id == current_user.id, Project.archived_at == None)
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()

    # Compute paper counts efficiently in one query
    paper_counts_result = await db.execute(
        select(Paper.project_id, func.count(Paper.id).label("count"))
        .where(Paper.project_id.in_([p.id for p in projects]), Paper.deleted_at == None)
        .group_by(Paper.project_id)
    )
    paper_counts = {row.project_id: row.count for row in paper_counts_result}

    # Build response manually to inject computed field
    response = []
    for proj in projects:
        response.append(ProjectResponse(
            id=proj.id,
            name=proj.name,
            description=proj.description,
            research_objective=proj.research_objective,
            created_at=proj.created_at,
            paper_count=paper_counts.get(proj.id, 0)
        ))
    return response


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.name or not request.name.strip():
        raise HTTPException(status_code=400, detail="Project name cannot be empty.")

    project = Project(
        name=request.name.strip(),
        description=request.description,
        research_objective=request.research_objective,
        owner_id=current_user.id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        research_objective=project.research_objective,
        created_at=project.created_at,
        paper_count=0
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id or project.archived_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")

    paper_count = await db.scalar(
        select(func.count(Paper.id))
        .where(Paper.project_id == project_id, Paper.deleted_at == None)
    )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        research_objective=project.research_objective,
        created_at=project.created_at,
        paper_count=paper_count or 0
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    request: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    if request.name:
        project.name = request.name.strip()
    if request.description is not None:
        project.description = request.description
    if request.research_objective is not None:
        project.research_objective = request.research_objective

    await db.commit()
    await db.refresh(project)

    paper_count = await db.scalar(
        select(func.count(Paper.id))
        .where(Paper.project_id == project_id, Paper.deleted_at == None)
    )
    return ProjectResponse(
        id=project.id, name=project.name, description=project.description,
        research_objective=project.research_objective,
        created_at=project.created_at, paper_count=paper_count or 0
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    project.archived_at = datetime.utcnow()
    await db.commit()
