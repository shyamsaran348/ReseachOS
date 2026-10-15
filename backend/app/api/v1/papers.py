import uuid
import os
import hashlib
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db.session import get_db
from app.db.models import Paper, PaperVersion, PaperMetadata, Project, User, PaperProcessingStatus
from app.schemas.papers import PaperResponse, PaperMetadataResponse
from app.rie.pipeline import rie_orchestrator
from app.api.v1.auth import get_current_user

router = APIRouter()
logger = logging.getLogger("researchos.api.papers")

os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def upload_paper(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate project ownership
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # 3. Read and validate file size BEFORE touching the DB
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 4. Compute hash for deduplication
    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # 5. Check for duplicate within this project
    dup_result = await db.execute(
        select(PaperVersion)
        .join(Paper, PaperVersion.paper_id == Paper.id)
        .where(Paper.project_id == project_id)
        .where(PaperVersion.sha256 == file_hash)
        .where(Paper.deleted_at == None)
        .limit(1)
    )
    existing_version = dup_result.scalar_one_or_none()
    if existing_version:
        existing_paper = await db.get(Paper, existing_version.paper_id)
        raise HTTPException(
            status_code=409,
            detail=f"This PDF already exists in the project as '{existing_paper.title}'."
        )

    # 6. Save file to disk (use UUID filename to prevent collisions)
    file_id = uuid.uuid4()
    file_path = os.path.join(settings.LOCAL_STORAGE_PATH, f"{file_id}.pdf")
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except OSError as e:
        logger.error(f"Failed to write file to disk: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

    # 7. Create DB records inside a try/except — clean up file on failure
    try:
        paper = Paper(
            project_id=project_id,
            title=os.path.splitext(file.filename)[0],  # Filename without extension as initial title
            created_by=current_user.id,
            status=PaperProcessingStatus.QUEUED
        )
        db.add(paper)
        await db.flush()

        paper_version = PaperVersion(
            paper_id=paper.id,
            file_key=file_path,
            file_name=file.filename,
            sha256=file_hash,
            file_size_bytes=len(file_bytes)
        )
        db.add(paper_version)
        await db.commit()

        paper_id = paper.id
        paper_version_id = paper_version.id

    except Exception as e:
        # Clean up the file since the DB record was never created
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"DB error during paper upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create paper record.")

    logger.info(f"[Upload] Paper {paper_id} queued. Starting RIE for version {paper_version_id}")

    # 8. Enqueue background pipeline — passes only IDs, NOT the request session
    background_tasks.add_task(rie_orchestrator.process_paper_version, paper_version_id)

    return {
        "message": "Paper uploaded and processing started.",
        "paper_id": str(paper_id),
        "paper_version_id": str(paper_version_id),
        "status": "QUEUED"
    }


@router.get("", response_model=List[PaperResponse])
async def list_papers(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await db.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Paper)
        .where(Paper.project_id == project_id, Paper.deleted_at == None)
        .order_by(Paper.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    project_id: uuid.UUID,
    paper_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id, Paper.project_id == project_id, Paper.deleted_at == None)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    project = await db.get(Project, paper.project_id)
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return paper


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    project_id: uuid.UUID,
    paper_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id, Paper.project_id == project_id, Paper.deleted_at == None)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    project = await db.get(Project, paper.project_id)
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    from datetime import datetime
    paper.deleted_at = datetime.utcnow()
    await db.commit()


@router.post("/{paper_id}/reprocess", status_code=status.HTTP_202_ACCEPTED)
async def reprocess_paper(
    project_id: uuid.UUID,
    paper_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually re-trigger the RIE pipeline for a FAILED paper."""
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id, Paper.project_id == project_id, Paper.deleted_at == None)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    project = await db.get(Project, paper.project_id)
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if paper.status not in (PaperProcessingStatus.FAILED, PaperProcessingStatus.REQUIRES_OCR):
        raise HTTPException(
            status_code=400,
            detail=f"Only FAILED or REQUIRES_OCR papers can be reprocessed. Current status: {paper.status}"
        )

    # Get the latest version
    ver_result = await db.execute(
        select(PaperVersion)
        .where(PaperVersion.paper_id == paper_id)
        .order_by(PaperVersion.version_number.desc())
        .limit(1)
    )
    version = ver_result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="No version found for this paper.")

    paper.status = PaperProcessingStatus.QUEUED
    await db.commit()

    background_tasks.add_task(rie_orchestrator.process_paper_version, version.id)

    return {"message": "Reprocessing started.", "paper_id": str(paper_id)}
