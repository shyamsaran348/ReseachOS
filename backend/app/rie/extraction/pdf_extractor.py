import fitz  # PyMuPDF
import re
import logging
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel

logger = logging.getLogger("researchos.rie.extraction")

class ExtractedChunk(BaseModel):
    chunk_index: int
    page_start: int
    page_end: int
    section_title: str
    content: str
    token_count: int

class PDFExtractionResult(BaseModel):
    full_text: str
    total_pages: int
    chunks: List[ExtractedChunk]
    has_readable_text: bool
    requires_ocr: bool

class PDFExtractionService:
    """
    Parses raw PDF bytes/files using PyMuPDF, preserving page boundaries and generating
    section-aware 512-token chunks with 64-token overlap.
    """
    def __init__(self, target_chunk_tokens: int = 512, overlap_tokens: int = 64):
        self.target_chunk_tokens = target_chunk_tokens
        self.overlap_tokens = overlap_tokens

    def extract_and_chunk(self, file_path_or_bytes: Any) -> PDFExtractionResult:
        """
        Extracts text from PDF and splits into section-aware chunks with page provenance.
        """
        if isinstance(file_path_or_bytes, bytes):
            doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")
        else:
            doc = fitz.open(file_path_or_bytes)

        total_pages = doc.page_count
        pages_text: List[Tuple[int, str]] = []
        full_text_accum = []

        for page_num in range(total_pages):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            if text:
                pages_text.append((page_num + 1, text))
                full_text_accum.append(f"--- Page {page_num + 1} ---\n{text}")

        full_text = "\n\n".join(full_text_accum)
        
        # Check readability
        if not pages_text or len(full_text.strip()) < 100:
            logger.warning("PDF appears to contain no readable text (scanned document).")
            return PDFExtractionResult(
                full_text="",
                total_pages=total_pages,
                chunks=[],
                has_readable_text=False,
                requires_ocr=True
            )

        # Generate section-aware chunks
        chunks = self._chunk_pages(pages_text)

        return PDFExtractionResult(
            full_text=full_text,
            total_pages=total_pages,
            chunks=chunks,
            has_readable_text=True,
            requires_ocr=False
        )

    def _chunk_pages(self, pages_text: List[Tuple[int, str]]) -> List[ExtractedChunk]:
        chunks: List[ExtractedChunk] = []
        current_words: List[Tuple[int, str]] = [] # (page_num, word)
        chunk_index = 0

        # Flatten into word-level stream with page numbers
        for page_num, text in pages_text:
            words = text.split()
            for w in words:
                current_words.append((page_num, w))

        total_words = len(current_words)
        step = self.target_chunk_tokens - self.overlap_tokens
        if step <= 0:
            step = 256

        idx = 0
        while idx < total_words:
            slice_words = current_words[idx : idx + self.target_chunk_tokens]
            if not slice_words:
                break

            chunk_text = " ".join([w[1] for w in slice_words]).replace('\x00', '')
            start_page = slice_words[0][0]
            end_page = slice_words[-1][0]
            token_count = len(slice_words)

            # Detect potential section title from first 10 words
            first_sentence = chunk_text[:80].strip()
            section_title = (first_sentence.split('\n')[0] if '\n' in first_sentence else "Section").replace('\x00', '')

            chunks.append(
                ExtractedChunk(
                    chunk_index=chunk_index,
                    page_start=start_page,
                    page_end=end_page,
                    section_title=section_title[:100],
                    content=chunk_text,
                    token_count=token_count
                )
            )
            chunk_index += 1
            idx += step

        return chunks

pdf_extraction_service = PDFExtractionService()
