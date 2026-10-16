import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { GapAnalysisResponse, Paper } from '../types';
import { 
  Sparkles, 
  Search, 
  Compass, 
  Lightbulb, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  HelpCircle
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
            Detect unexplored intersections, unvalidated hypotheses, and actionable research directions across your library.
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
              placeholder="Optional focus topic (e.g. Model interpretability or few-shot adaptation)..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-primary hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Gaps...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-primary-accent" />
                <span>Explore Research Gaps</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Two-Column Results Display */}
      {result ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identified Gaps */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle">
              <div className="p-2 rounded-lg bg-status-failed-bg text-status-failed-text">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-text-primary">Identified Literature Gaps</h3>
                <span className="text-xs text-text-muted">Unexplored or conflicting methodological areas</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {result.identified_gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-container-low border border-border-subtle hover:border-primary-accent/40 transition-colors flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-status-failed-bg text-status-failed-text text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-text-primary font-medium">
                    {gap}
                  </p>
                </div>
              ))}
              {result.identified_gaps.length === 0 && (
                <p className="text-xs text-text-muted italic py-6 text-center">No explicit gaps found for this scope.</p>
              )}
            </div>
          </div>

          {/* Proposed Future Directions */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle">
              <div className="p-2 rounded-lg bg-status-ready-bg text-status-ready-text">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-text-primary">Proposed Research Directions</h3>
                <span className="text-xs text-text-muted">High-impact novel experiments & methodologies</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {result.proposed_directions.map((direction, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-container-low border border-border-subtle hover:border-status-ready-border transition-colors flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-status-ready-bg text-status-ready-text text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                  <p className="text-xs leading-relaxed text-text-primary font-medium">
                    {direction}
                  </p>
                </div>
              ))}
              {result.proposed_directions.length === 0 && (
                <p className="text-xs text-text-muted italic py-6 text-center">No explicit future directions proposed.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center text-text-muted shadow-sm">
          <Sparkles className="w-10 h-10 mx-auto text-primary-accent/40 mb-3" />
          <h3 className="font-bold text-sm text-text-primary">Ready to Discover Research Gaps</h3>
          <p className="text-xs text-text-muted max-w-md mx-auto mt-1">
            Click "Explore Research Gaps" to analyze your uploaded papers and generate a two-column synthesis of literature limitations and next-generation ideas.
          </p>
        </div>
      )}
    </div>
  );
};
