import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Table, Enum, BigInteger, JSON
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
import enum

Base = declarative_base()

class ProjectRole(str, enum.Enum):
    OWNER = "OWNER"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

class PaperProcessingStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    EXTRACTING = "EXTRACTING"
    REQUIRES_OCR = "REQUIRES_OCR"
    READY = "READY"
    FAILED = "FAILED"

class AssistantScope(str, enum.Enum):
    SELECTED_PAPERS = "SELECTED_PAPERS"
    ENTIRE_PROJECT = "ENTIRE_PROJECT"
    SINGLE_PAPER = "SINGLE_PAPER"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    projects_owned = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    research_objective = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="projects_owned")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    papers = relationship("Paper", back_populates="project", cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = "project_members"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(Enum(ProjectRole), default=ProjectRole.EDITOR, nullable=False)
    joined_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Paper(Base):
    __tablename__ = "papers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    status = Column(Enum(PaperProcessingStatus), default=PaperProcessingStatus.QUEUED, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="papers")
    versions = relationship("PaperVersion", back_populates="paper", cascade="all, delete-orphan")

class PaperVersion(Base):
    __tablename__ = "paper_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    file_key = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    file_size_bytes = Column(BigInteger, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    paper = relationship("Paper", back_populates="versions")
    metadata_record = relationship("PaperMetadata", back_populates="version", uselist=False, cascade="all, delete-orphan")
    chunks = relationship("PaperChunk", back_populates="version", cascade="all, delete-orphan")

class PaperMetadata(Base):
    __tablename__ = "paper_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_version_id = Column(UUID(as_uuid=True), ForeignKey("paper_versions.id", ondelete="CASCADE"), unique=True, nullable=False)
    authors = Column(JSONB, default=list, nullable=False)
    abstract = Column(Text, nullable=True)
    publication_year = Column(Integer, nullable=True)
    doi = Column(String(100), nullable=True)
    venue = Column(String(255), nullable=True)
    keywords = Column(JSONB, default=list, nullable=False)
    methodology_summary = Column(Text, nullable=True)
    primary_datasets = Column(JSONB, default=list, nullable=False)
    evaluation_metrics = Column(JSONB, default=list, nullable=False)
    key_findings = Column(JSONB, default=list, nullable=False)
    stated_limitations = Column(JSONB, default=list, nullable=False)
    suggested_future_work = Column(JSONB, default=list, nullable=False)
    extraction_confidence = Column(Float, default=1.0, nullable=False)
    user_reviewed = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    version = relationship("PaperVersion", back_populates="metadata_record")

class PaperChunk(Base):
    __tablename__ = "paper_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_version_id = Column(UUID(as_uuid=True), ForeignKey("paper_versions.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_start = Column(Integer, nullable=False)
    page_end = Column(Integer, nullable=False)
    section_title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False)

    version = relationship("PaperVersion", back_populates="chunks")
    embedding = relationship("ChunkEmbedding", back_populates="chunk", uselist=False, cascade="all, delete-orphan")

class ChunkEmbedding(Base):
    __tablename__ = "chunk_embeddings"

    chunk_id = Column(UUID(as_uuid=True), ForeignKey("paper_chunks.id", ondelete="CASCADE"), primary_key=True)
    embedding = Column(Vector(384), nullable=False) # 384 dimensions for all-MiniLM-L6-v2
    model_name = Column(String(100), default="all-MiniLM-L6-v2", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    chunk = relationship("PaperChunk", back_populates="embedding")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_version_id = Column(UUID(as_uuid=True), ForeignKey("paper_versions.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
