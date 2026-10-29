export interface User {
  id: string;
  email: string;
  display_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  display_name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  research_objective?: string;
  created_at: string;
  updated_at: string;
  paper_count?: number;
}

export interface Paper {
  id: string;
  project_id: string;
  title: string;
  abstract?: string;
  authors?: string[];
  publication_year?: number;
  doi?: string;
  status: 'QUEUED' | 'EXTRACTING' | 'READY' | 'FAILED' | 'REQUIRES_OCR';
  error_message?: string;
  created_at: string;
  file_name?: string;
  file_size?: number;
}

export interface Citation {
  citation_id?: number;
  paper_id?: string;
  paper_title: string;
  page_number?: number;
  chunk_index?: number;
  quoted_text?: string;
  text?: string;
  verified?: boolean;
  confidence_score?: number;
  score?: number;
}

export interface AssistantChatResponse {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  verification_summary?: string;
}

export interface GroundedGap {
  gap_title: string;
  gap_description: string;
  supporting_evidence: string[];
  recommended_experiment: string;
}

export interface GapAnalysisResponse {
  id?: string;
  project_id?: string;
  topic_focus: string;
  identified_gaps: string[];
  proposed_directions: string[];
  grounded_gaps?: GroundedGap[];
}

export interface LiteratureReviewResponse {
  id?: string;
  project_id: string;
  topic: string;
  target_audience: string;
  markdown_content: string;
  cited_paper_ids: string[];
  created_at?: string;
}

export interface MatrixPaperEntry {
  paper_id: string;
  title: string;
  authors: string[];
  publication_year?: number;
  core_methodology: string;
  datasets_evaluated: string[];
  metrics_reported: string[];
  key_findings: string[];
  limitations: string[];
}

export interface ComparativeMatrixResponse {
  project_id: string;
  total_papers: number;
  matrix: MatrixPaperEntry[];
  latex_table: string;
}

export type ComparabilityTier = 'DIRECTLY_COMPARABLE' | 'CONDITIONALLY_COMPARABLE' | 'NOT_COMPARABLE';

export interface BenchmarkMetricRecord {
  id: string;
  paper_id: string;
  paper_title: string;
  model_name: string;
  architecture_family: string;
  dataset_name: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  evaluation_split: string;
  source_page: number;
  experimental_protocol?: string;
  reported_baseline?: string;
}

export interface BenchmarkPairComparison {
  model_a: string;
  model_b: string;
  dataset_name: string;
  metric_name: string;
  score_a: number;
  score_b: number;
  delta_percentage: number;
  tier: ComparabilityTier;
  discrepancy_rationale: string;
}

export interface BenchmarkGroup {
  dataset_name: string;
  metric_name: string;
  records: BenchmarkMetricRecord[];
  comparability_summary: string;
  comparisons: BenchmarkPairComparison[];
}

export interface BenchmarkOverviewResponse {
  project_id: string;
  total_benchmarks_extracted: number;
  datasets: string[];
  metrics: string[];
  groups: BenchmarkGroup[];
  latex_benchmark_table: string;
}

export interface ProjectAnalytics {
  total_papers: number;
  total_chunks: number;
  extracted_entities_count: number;
  ready_papers: number;
  processing_papers: number;
  failed_papers: number;
}
