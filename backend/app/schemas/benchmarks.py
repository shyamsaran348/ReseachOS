import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class ComparabilityTier(str, Enum):
    DIRECTLY_COMPARABLE = "DIRECTLY_COMPARABLE"       # Same dataset, metric, and split
    CONDITIONALLY_COMPARABLE = "CONDITIONALLY_COMPARABLE" # Same dataset/metric, differing split/protocol
    NOT_COMPARABLE = "NOT_COMPARABLE"                 # Differing conditions or non-standard metric

class BenchmarkMetricRecord(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    paper_id: uuid.UUID
    paper_title: str
    model_name: str
    architecture_family: str = "Transformer / Neural Net"
    dataset_name: str
    metric_name: str                                  # Accuracy, F1-Score, BLEU, Perplexity, Latency (ms), Speedup
    metric_value: float                               # Normalized numerical score (e.g. 88.4, 2.4, 0.92)
    unit: str = "%"
    evaluation_split: str = "test"                    # test, validation, zero-shot, 5-shot
    source_page: int = 1
    experimental_protocol: Optional[str] = "Standard greedy decoding, FP16"
    reported_baseline: Optional[str] = None

class BenchmarkPairComparison(BaseModel):
    model_a: str
    model_b: str
    dataset_name: str
    metric_name: str
    score_a: float
    score_b: float
    delta_percentage: float
    tier: ComparabilityTier
    discrepancy_rationale: str

class BenchmarkGroup(BaseModel):
    dataset_name: str
    metric_name: str
    records: List[BenchmarkMetricRecord]
    comparability_summary: str
    comparisons: List[BenchmarkPairComparison] = []

class BenchmarkOverviewResponse(BaseModel):
    project_id: uuid.UUID
    total_benchmarks_extracted: int
    datasets: List[str]
    metrics: List[str]
    groups: List[BenchmarkGroup]
    latex_benchmark_table: str

