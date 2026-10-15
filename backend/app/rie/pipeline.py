import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Paper, PaperVersion, PaperMetadata, PaperChunk, ChunkEmbedding, PaperProcessingStatus
from app.db.session import AsyncSessionLocal
from app.rie.extraction.pdf_extractor import pdf_extraction_service
from app.rie.integrations.groq_provider import groq_provider
from app.rie.embeddings.local_provider import embedding_provider
from app.schemas.rie import ExtractedPaperMetadata

logger = logging.getLogger("researchos.rie.pipeline")


class RIEPipelineOrchestrator:
    """
    Coordinates end-to-end document processing:
    PDF Extraction → Groq Metadata Extraction → Local Embedding → pgvector Indexing.

    IMPORTANT: This always creates its own DB session, never reuses the request session.
    FastAPI background tasks run after the response is sent, so the request session is already closed.
    """

    async def process_paper_version(self, paper_version_id: uuid.UUID) -> bool:
        """
        Main entry point for background processing. Creates its own DB session.
        """
        logger.info(f"[RIE] Starting pipeline for PaperVersion: {paper_version_id}")

        # Step 1: Mark as EXTRACTING in its own short transaction
        async with AsyncSessionLocal() as db:
            try:
                version = await db.get(PaperVersion, paper_version_id)
                if not version:
                    logger.error(f"[RIE] PaperVersion {paper_version_id} not found.")
                    return False

                paper = await db.get(Paper, version.paper_id)
                if not paper:
                    logger.error(f"[RIE] Paper {version.paper_id} not found.")
                    return False

                paper.status = PaperProcessingStatus.EXTRACTING
                await db.commit()
                file_key = version.file_key
                paper_id = paper.id
                original_title = paper.title
            except Exception as e:
                logger.error(f"[RIE] Failed to fetch records: {e}", exc_info=True)
                return False

        # Step 2: Extract text (CPU-bound, outside DB transaction)
        try:
            extraction_result = pdf_extraction_service.extract_and_chunk(file_key)
        except Exception as e:
            logger.error(f"[RIE] PDF extraction failed: {e}", exc_info=True)
            await self._mark_failed(paper_version_id, paper_id, str(e))
            return False

        if not extraction_result.has_readable_text or extraction_result.requires_ocr:
            logger.warning(f"[RIE] PaperVersion {paper_version_id} requires OCR or has no text.")
            await self._mark_failed(paper_version_id, paper_id, "PDF requires OCR or has no readable text.")
            return False

        # Step 3: Groq metadata extraction (network I/O, outside DB transaction)
        system_prompt = (
            "You are an expert scientific paper metadata extraction engine. "
            "Extract precise structured research metadata from the provided paper text."
        )
        extraction_prompt = (
            f"Analyze the following research paper text and extract metadata:\n\n"
            f"{extraction_result.full_text}"
        )
        try:
            extracted_metadata = await groq_provider.generate_structured(
                prompt=extraction_prompt,
                schema_class=ExtractedPaperMetadata,
                system_instruction=system_prompt
            )
        except Exception as e:
            logger.warning(f"[RIE] Groq metadata extraction failed: {e}. Using fallback metadata.")
            extracted_metadata = ExtractedPaperMetadata(
                title=original_title,
                authors=[],
                abstract=extraction_result.full_text[:500] if extraction_result.full_text else None
            )

        # Step 4: Compute embeddings (CPU-bound, outside DB transaction)
        chunk_contents = [c.content for c in extraction_result.chunks]
        try:
            embeddings_list = embedding_provider.embed_batch(chunk_contents) if chunk_contents else []
        except Exception as e:
            logger.error(f"[RIE] Embedding generation failed: {e}", exc_info=True)
            await self._mark_failed(paper_version_id, paper_id, f"Embedding failed: {e}")
            return False

        # Step 5: Persist everything in a single transaction
        async with AsyncSessionLocal() as db:
            try:
                version = await db.get(PaperVersion, paper_version_id)
                paper = await db.get(Paper, paper_id)

                # Save chunks
                db_chunks = []
                for chunk in extraction_result.chunks:
                    db_chunk = PaperChunk(
                        id=uuid.uuid4(),
                        paper_version_id=version.id,
                        chunk_index=chunk.chunk_index,
                        page_start=chunk.page_start,
                        page_end=chunk.page_end,
                        section_title=chunk.section_title,
                        content=chunk.content,
                        token_count=chunk.token_count
                    )
                    db.add(db_chunk)
                    db_chunks.append(db_chunk)

                await db.flush()

                # Save embeddings
                for chunk_obj, emb_vector in zip(db_chunks, embeddings_list):
                    db.add(ChunkEmbedding(
                        chunk_id=chunk_obj.id,
                        embedding=emb_vector,
                        model_name=embedding_provider.model_name
                    ))

                # Save metadata
                db.add(PaperMetadata(
                    paper_version_id=version.id,
                    authors=extracted_metadata.authors,
                    abstract=extracted_metadata.abstract,
                    publication_year=extracted_metadata.publication_year,
                    doi=extracted_metadata.doi,
                    venue=getattr(extracted_metadata, "venue", None),
                    keywords=extracted_metadata.keywords,
                    methodology_summary=extracted_metadata.methodology_summary,
                    primary_datasets=extracted_metadata.primary_datasets,
                    evaluation_metrics=extracted_metadata.evaluation_metrics,
                    key_findings=extracted_metadata.key_findings,
                    stated_limitations=extracted_metadata.stated_limitations,
                    suggested_future_work=extracted_metadata.suggested_future_work,
                    extraction_confidence=extracted_metadata.extraction_confidence
                ))

                # Update paper title if meaningfully extracted
                if extracted_metadata.title and len(extracted_metadata.title) > 3:
                    paper.title = extracted_metadata.title

                paper.status = PaperProcessingStatus.READY
                await db.commit()

                logger.info(f"[RIE] Pipeline completed successfully for PaperVersion: {paper_version_id}")
                return True

            except Exception as e:
                await db.rollback()
                logger.error(f"[RIE] DB persistence failed: {e}", exc_info=True)
                await self._mark_failed(paper_version_id, paper_id, str(e))
                return False

    async def _mark_failed(self, paper_version_id: uuid.UUID, paper_id: uuid.UUID, error_msg: str):
        """Marks a paper as FAILED in an isolated session."""
        async with AsyncSessionLocal() as db:
            try:
                paper = await db.get(Paper, paper_id)
                if paper:
                    paper.status = PaperProcessingStatus.FAILED
                    await db.commit()
                    logger.info(f"[RIE] Paper {paper_id} marked as FAILED: {error_msg}")
            except Exception as e:
                logger.error(f"[RIE] Could not mark paper as FAILED: {e}", exc_info=True)


rie_orchestrator = RIEPipelineOrchestrator()
