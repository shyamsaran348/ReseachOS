import logging
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
        relevance_threshold: float = 0.65
    ) -> List[PaperChunk]:
        """
        Retrieves the most semantically relevant paper chunks for a given query.
        Uses pgvector L2 distance or cosine similarity.
        """
        try:
            # 1. Generate query embedding locally (Free SentenceTransformers)
            query_embedding = embedding_provider.embed_text(query)
            
            # 2. Build the vector search query
            # pgvector cosine distance operator is <=>. Cosine similarity is 1 - <=>
            similarity = 1 - ChunkEmbedding.embedding.cosine_distance(query_embedding)
            
            stmt = (
                select(PaperChunk, similarity.label("similarity"))
                .join(ChunkEmbedding, PaperChunk.id == ChunkEmbedding.chunk_id)
                .join(PaperVersion, PaperChunk.paper_version_id == PaperVersion.id)
                .join(Paper, PaperVersion.paper_id == Paper.id)
                .where(Paper.project_id == project_id)
                .where(Paper.deleted_at == None)
            )
            
            if selected_paper_ids:
                stmt = stmt.where(Paper.id.in_(selected_paper_ids))
                
            stmt = stmt.order_by(ChunkEmbedding.embedding.cosine_distance(query_embedding)).limit(top_k)
            
            result = await db.execute(stmt)
            rows = result.all()
            
            relevant_chunks = []
            for row in rows:
                chunk: PaperChunk = row[0]
                sim_score = row[1]
                if sim_score >= relevance_threshold:
                    relevant_chunks.append(chunk)
                else:
                    logger.debug(f"Chunk {chunk.id} skipped (similarity {sim_score} < {relevance_threshold})")
                    
            return relevant_chunks
            
        except Exception as e:
            logger.error(f"Semantic search failed: {str(e)}", exc_info=True)
            raise e

semantic_search_service = SemanticSearchService()
