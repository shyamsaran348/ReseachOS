import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { GapAnalysisResponse, GroundedGap, Paper } from '../types';
import { 
  Sparkles, 
  Search, 
  Compass, 
  Lightbulb, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  HelpCircle,
  FileSearch,
  CheckCircle2
} from 'lucide-react';

interface GapAnalysisProps {
  projectId: string;
  papers: Paper[];
}

export const GapAnalysis: React.FC<GapAnalysisProps> = ({ projectId, papers }) => {
  const [topicFocus, setTopicFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<GapAnalysisResponse>(
        `/projects/${projectId}/gap-analysis`,
        {
          method: 'POST',
          body: JSON.stringify({
            project_id: projectId,
            topic_focus: topicFocus ? topicFocus.trim() : '',
          }),
        }
      );
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Gap analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Research Gap & Novelty Explorer</h1>
          <p className="text-sm text-text-secondary mt-1">
            Detect unexplored intersections, unvalidated hypotheses, and actionable research directions grounded in paper limitations.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-status-failed-bg border border-status-failed-border text-status-failed-text rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRunAnalysis} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
            <input
              type="text"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="Optional focus topic (e.g. Model quantization or memory bounds on consumer GPUs)..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading || papers.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exploring Gaps & Frontiers...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Gaps</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results View */}
      {result ? (
        <div className="space-y-6">
          {/* Detailed Evidence-Grounded Gap Cards */}
          {result.grounded_gaps && result.grounded_gaps.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-primary-accent" />
                Evidence-Grounded Literature Gaps
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.grounded_gaps.map((gap, i) => (
                  <div key={i} className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary-accent uppercase tracking-wider mb-1">
                        <span>Frontier {i + 1}</span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary leading-snug">{gap.gap_title}</h3>
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{gap.gap_description}</p>

                      {gap.supporting_evidence && gap.supporting_evidence.length > 0 && (
                        <div className="mt-3 p-2.5 bg-surface-container-low rounded-lg border border-border-subtle text-[11px] text-text-secondary italic">
                          <span className="font-semibold text-text-primary not-italic block mb-0.5">Reported Evidence:</span>
                          "{gap.supporting_evidence[0]}"
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border-subtle/80">
                      <span className="text-[11px] font-semibold text-status-ready-text uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Proposed Experiment:
                      </span>
                      <p className="text-xs text-text-primary mt-1 font-medium leading-relaxed">
                        {gap.recommended_experiment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High-Level Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-2xs">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-primary-accent" />
                Identified Literature Gaps
              </h3>
              <ul className="space-y-2.5">
                {result.identified_gaps.map((gap, i) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-failed-text mt-1.5 shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-2xs">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-status-ready-text" />
                Proposed Future Directions
              </h3>
              <ul className="space-y-2.5">
                {result.proposed_directions.map((dir, i) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-status-ready-text mt-0.5 shrink-0" />
                    <span>{dir}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-text-muted flex flex-col items-center justify-center">
          <Compass className="w-10 h-10 stroke-1 mb-2 text-text-muted/60" />
          <p className="font-medium text-text-primary mb-1">No Gap Analysis Performed Yet</p>
          <p className="max-w-sm">
            Enter an optional focus topic above or click "Analyze Gaps" to detect unexplored research frontiers across your uploaded manuscripts.
          </p>
        </div>
      )}
    </div>
  );
};
