import fitz  # PyMuPDF
import re
import io
import shutil
import logging
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel
from PIL import Image

try:
    import pytesseract
    # Check if tesseract binary exists in known paths
    tesseract_cmd = shutil.which("tesseract") or "/opt/homebrew/bin/tesseract" or "/usr/local/bin/tesseract" or "/usr/bin/tesseract"
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False

logger = logging.getLogger("researchos.rie.extraction")

SECTION_PATTERN = re.compile(
    r"(?:^|\n)\s*(?:(?:[0-9IVXLCDM]+\.?\s+)?(?:Abstract|Introduction|Related\s+Work|Background|Methodology|Methods|Architecture|Model|System\s+Design|Experiments?|Experimental\s+Setup|Results?|Discussion|Ablation\s+Study|Limitations?|Future\s+Work|Conclusions?|References))[:\.\s]",
    re.IGNORECASE
)

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
    ocr_applied: bool = False

class PDFExtractionService:
    """
    Parses raw PDF bytes/files using PyMuPDF, preserving page boundaries and generating
    hierarchical, section-aware chunks with automated OCR fallback for scanned pages.
    """
    def __init__(self, target_chunk_tokens: int = 512, overlap_tokens: int = 64):
        self.target_chunk_tokens = target_chunk_tokens
        self.overlap_tokens = overlap_tokens

    def extract_and_chunk(self, file_path_or_bytes: Any) -> PDFExtractionResult:
        """
        Extracts text from PDF and splits into section-aware chunks with page provenance and OCR fallback.
        """
        if isinstance(file_path_or_bytes, bytes):
            doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")
        else:
            doc = fitz.open(file_path_or_bytes)

        total_pages = doc.page_count
        pages_text: List[Tuple[int, str]] = []
        full_text_accum = []
        ocr_applied = False

        for page_num in range(total_pages):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()

            # If page text is very sparse (< 30 words), attempt OCR fallback on page pixmap
            if (not text or len(text.split()) < 30) and HAS_PYTESSERACT:
                logger.info(f"[OCR] Page {page_num + 1} has insufficient direct text. Running OCR fallback...")
                try:
                    pix = page.get_pixmap(dpi=200)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_text = pytesseract.image_to_string(img).strip()
                    if len(ocr_text) > len(text):
                        text = ocr_text
                        ocr_applied = True
                        logger.info(f"[OCR] Page {page_num + 1} extracted {len(ocr_text)} characters via OCR.")
                except Exception as ocr_err:
                    logger.warning(f"[OCR] Failed to OCR page {page_num + 1}: {ocr_err}")

            if text:
                pages_text.append((page_num + 1, text))
                full_text_accum.append(f"--- Page {page_num + 1} ---\n{text}")

        full_text = "\n\n".join(full_text_accum)

        # Check overall readability
        if not pages_text or len(full_text.strip()) < 100:
            logger.warning("PDF appears to contain no readable text even after OCR inspection.")
            return PDFExtractionResult(
                full_text="",
                total_pages=total_pages,
                chunks=[],
                has_readable_text=False,
                requires_ocr=True,
                ocr_applied=ocr_applied
            )

        # Generate section-aware chunks
        chunks = self._chunk_pages_section_aware(pages_text)

        return PDFExtractionResult(
            full_text=full_text,
            total_pages=total_pages,
            chunks=chunks,
            has_readable_text=True,
            requires_ocr=False,
            ocr_applied=ocr_applied
        )

    def _chunk_pages_section_aware(self, pages_text: List[Tuple[int, str]]) -> List[ExtractedChunk]:
        """
        Chunks text while tracking and preserving academic section headers.
        """
        chunks: List[ExtractedChunk] = []
        current_words: List[Tuple[int, str, str]] = [] # (page_num, word, current_section)
        chunk_index = 0
        current_section = "Introduction"

        for page_num, text in pages_text:
            lines = text.split("\n")
            for line in lines:
                clean_line = line.strip()
                # Check if this line is an academic section title
                match = SECTION_PATTERN.search(clean_line)
                if match and len(clean_line) < 80:
                    current_section = clean_line.replace("\x00", "")

                words = clean_line.split()
                for w in words:
                    current_words.append((page_num, w, current_section))

        total_words = len(current_words)
        step = self.target_chunk_tokens - self.overlap_tokens
        if step <= 0:
            step = 256

        idx = 0
        while idx < total_words:
            slice_words = current_words[idx : idx + self.target_chunk_tokens]
            if not slice_words:
                break

            chunk_text = " ".join([w[1] for w in slice_words]).replace("\x00", "")
            start_page = slice_words[0][0]
            end_page = slice_words[-1][0]
            token_count = len(slice_words)
            section_title = slice_words[0][2]

            # Prepend section breadcrumb if not present
            prefixed_content = f"[{section_title} | Pages {start_page}-{end_page}]\n{chunk_text}"

            chunks.append(
                ExtractedChunk(
                    chunk_index=chunk_index,
                    page_start=start_page,
                    page_end=end_page,
                    section_title=section_title[:100],
                    content=prefixed_content,
                    token_count=token_count
                )
            )
            chunk_index += 1
            idx += step

        return chunks

pdf_extraction_service = PDFExtractionService()
