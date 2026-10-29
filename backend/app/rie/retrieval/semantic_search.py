import logging
import re
from typing import List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.db.models import PaperChunk, ChunkEmbedding, PaperVersion, Paper
from app.rie.embeddings.local_provider import embedding_provider

logger = logging.getLogger("researchos.rie.retrieval")

class SemanticSearchService:
    async def retrieve_chunks(
        self, 
        db: AsyncSession, 
        query: str, 
        project_id: str, 
        selected_paper_ids: List[str] = None,
        top_k: int = 5,
        relevance_threshold: float = 0.30
    ) -> List[PaperChunk]:
        """
        Hybrid retrieval combining pgvector dense cosine distance with keyword/lexical matching
        using Reciprocal Rank Fusion (RRF) to ensure exact acronyms and terms are not missed.
        """
        try:
            # 1. Dense Semantic Retrieval via pgvector
            query_embedding = embedding_provider.embed_text(query)
            similarity = 1 - ChunkEmbedding.embedding.cosine_distance(query_embedding)
            
            dense_stmt = (
                select(PaperChunk, similarity.label("similarity"))
                .join(ChunkEmbedding, PaperChunk.id == ChunkEmbedding.chunk_id)
                .join(PaperVersion, PaperChunk.paper_version_id == PaperVersion.id)
                .join(Paper, PaperVersion.paper_id == Paper.id)
                .where(Paper.project_id == project_id)
                .where(Paper.deleted_at == None)
            )
            
            if selected_paper_ids:
                dense_stmt = dense_stmt.where(Paper.id.in_(selected_paper_ids))
                
            dense_stmt = dense_stmt.order_by(ChunkEmbedding.embedding.cosine_distance(query_embedding)).limit(top_k * 2)
            
            dense_result = await db.execute(dense_stmt)
            dense_rows = dense_result.all()

            # 2. Sparse / Keyword Matching for exact terminology
            # Extract keywords (words with 3+ chars)
            keywords = [w.lower() for w in re.findall(r'\b[A-Za-z0-9_-]{3,}\b', query)]
            sparse_rows = []
            if keywords:
                # Build ILIKE filters
                keyword_filters = [PaperChunk.content.ilike(f"%{kw}%") for kw in keywords[:5]]
                sparse_stmt = (
                    select(PaperChunk)
                    .join(PaperVersion, PaperChunk.paper_version_id == PaperVersion.id)
                    .join(Paper, PaperVersion.paper_id == Paper.id)
                    .where(Paper.project_id == project_id)
                    .where(Paper.deleted_at == None)
                    .where(or_(*keyword_filters))
                )
                if selected_paper_ids:
                    sparse_stmt = sparse_stmt.where(Paper.id.in_(selected_paper_ids))
                sparse_stmt = sparse_stmt.limit(top_k * 2)
                sparse_res = await db.execute(sparse_stmt)
                sparse_rows = sparse_res.scalars().all()

            # 3. Reciprocal Rank Fusion (RRF)
            # RRF Score = 1 / (60 + rank_dense) + 1 / (60 + rank_sparse)
            rrf_scores: Dict[str, float] = {}
            chunk_lookup: Dict[str, PaperChunk] = {}

            for rank, row in enumerate(dense_rows):
                chunk: PaperChunk = row[0]
                sim_score = float(row[1])
                if sim_score >= relevance_threshold:
                    cid = str(chunk.id)
                    chunk_lookup[cid] = chunk
                    rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (60.0 + rank))

            for rank, chunk in enumerate(sparse_rows):
                cid = str(chunk.id)
                chunk_lookup[cid] = chunk
                rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (60.0 + rank))

            # Sort candidate chunks by RRF score
            sorted_chunk_ids = sorted(rrf_scores.keys(), key=lambda cid: rrf_scores[cid], reverse=True)
            relevant_chunks = [chunk_lookup[cid] for cid in sorted_chunk_ids[:top_k]]
            
            logger.info(f"[Retrieval] Hybrid RRF merged {len(dense_rows)} dense & {len(sparse_rows)} sparse chunks -> returned top {len(relevant_chunks)}")
            return relevant_chunks
            
        except Exception as e:
            logger.error(f"Hybrid retrieval failed: {str(e)}", exc_info=True)
            raise e

semantic_search_service = SemanticSearchService()
