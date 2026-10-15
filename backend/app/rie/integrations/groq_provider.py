import asyncio
import logging
from groq import AsyncGroq, RateLimitError, APIStatusError
from app.config import settings
from typing import Type, TypeVar
from pydantic import BaseModel
import json

logger = logging.getLogger("researchos.rie.groq")
T = TypeVar("T", bound=BaseModel)

MAX_CHARS = 16000  # ~4k tokens to strictly stay within Groq free-tier 7,000 ITPM
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2.0  # seconds


class GroqLLMProvider:
    """
    LLM Provider powered by Groq API (Free Tier).
    Delivers sub-second structured JSON responses using Llama-3.3-70B.
    Includes exponential backoff retry on 429/503 errors.
    """

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model_name = settings.GROQ_MODEL
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY is not configured in settings!")

    def _truncate(self, text: str) -> str:
        """Safely truncate to stay within token limits."""
        if len(text) > MAX_CHARS:
            logger.warning(f"Input truncated from {len(text)} to {MAX_CHARS} chars to avoid token overflow.")
            return text[:MAX_CHARS] + "\n\n[...truncated for token limit...]"
        return text

    async def _call_with_retry(self, **kwargs) -> any:
        """Execute a Groq API call with exponential backoff on rate limit errors."""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return await self.client.chat.completions.create(**kwargs)
            except RateLimitError as e:
                wait = RETRY_BASE_DELAY ** attempt
                logger.warning(f"Groq rate limit hit (attempt {attempt}/{MAX_RETRIES}). Waiting {wait}s...")
                if attempt == MAX_RETRIES:
                    raise
                await asyncio.sleep(wait)
            except APIStatusError as e:
                if e.status_code in (503, 529) and attempt < MAX_RETRIES:
                    wait = RETRY_BASE_DELAY ** attempt
                    logger.warning(f"Groq overloaded ({e.status_code}) attempt {attempt}/{MAX_RETRIES}. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    raise

    async def generate_structured(self, prompt: str, schema_class: Type[T], system_instruction: str = None) -> T:
        """
        Requests structured JSON completion from Groq and validates against a Pydantic schema.
        """
        if not self.client:
            raise ValueError("GROQ_API_KEY is required.")

        prompt = self._truncate(prompt)
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})

        schema_hint = json.dumps(schema_class.model_json_schema().get("properties", {}))
        json_prompt = (
            f"{prompt}\n\n"
            f"IMPORTANT: Respond ONLY with a valid raw JSON object strictly conforming to these properties: {schema_hint}. "
            f"Do not include markdown fences ```json or any conversational text."
        )
        messages.append({"role": "user", "content": json_prompt})

        try:
            response = await self._call_with_retry(
                model=self.model_name,
                messages=messages,
                temperature=0.1,
                response_format={"type": "json_object"},
                max_tokens=600  # Groq free-tier OTPM limit = 1000
            )
            raw_json_str = response.choices[0].message.content.strip()
            parsed_dict = json.loads(raw_json_str)
            return schema_class.model_validate(parsed_dict)
        except json.JSONDecodeError as e:
            logger.error(f"Groq returned invalid JSON: {e}", exc_info=True)
            raise ValueError(f"LLM returned invalid JSON: {e}")

    async def generate_completion(self, prompt: str, system_instruction: str = None) -> str:
        """
        Generates standard text completion for assistant answers, reviews, and gap analysis.
        """
        if not self.client:
            raise ValueError("GROQ_API_KEY is required.")

        prompt = self._truncate(prompt)
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        response = await self._call_with_retry(
            model=self.model_name,
            messages=messages,
            temperature=0.3,
            max_tokens=800  # Groq free-tier OTPM limit = 1000
        )
        return response.choices[0].message.content.strip()

    async def generate_metadata(self, text: str, schema_class: Type[T]) -> dict:
        """Alias used by gap_analysis — delegates to generate_structured."""
        result = await self.generate_structured(
            prompt=f"Analyze the following research text:\n\n{text}",
            schema_class=schema_class
        )
        return result.model_dump()


groq_provider = GroqLLMProvider()
