import logging
from typing import List
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger("researchos.rie.embeddings")

class LocalEmbeddingProvider:
    """
    100% Free local CPU/GPU embedding provider using SentenceTransformers.
    Generates dense 384-dimensional vector embeddings without external API costs or limits.
    """
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        logger.info(f"Loading local embedding model: {self.model_name}...")
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info("Local embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load local embedding model {self.model_name}: {str(e)}")
            self.model = None

    def embed_text(self, text: str) -> List[float]:
        """
        Generates embedding vector for a single string.
        """
        if not self.model:
            raise RuntimeError("Embedding model is not initialized.")
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embedding vectors for a batch of strings.
        """
        if not self.model:
            raise RuntimeError("Embedding model is not initialized.")
        embeddings = self.model.encode(texts, convert_to_numpy=True, batch_size=32)
        return [emb.tolist() for emb in embeddings]

embedding_provider = LocalEmbeddingProvider()
