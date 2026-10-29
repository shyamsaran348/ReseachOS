import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { apiRequest } from '../api/client';
import { LiteratureReviewResponse, ComparativeMatrixResponse, Paper } from '../types';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  Loader2, 
  BookOpen,
  Table as TableIcon,
  AlertCircle
} from 'lucide-react';

interface LiteratureReviewProps {
  projectId: string;
  papers: Paper[];
}

export const LiteratureReview: React.FC<LiteratureReviewProps> = ({ projectId, papers }) => {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'matrix'>('synthesis');
  const [topic, setTopic] = useState('Comparative synthesis of methodologies');
  const [targetAudience, setTargetAudience] = useState<'general' | 'expert' | 'practitioner'>('expert');
  const [maxPapers, setMaxPapers] = useState(5);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<LiteratureReviewResponse | null>(null);
  const [matrixData, setMatrixData] = useState<ComparativeMatrixResponse | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<LiteratureReviewResponse>(
        `/projects/${projectId}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({
            project_id: projectId,
            topic,
            target_audience: targetAudience,
            max_papers: Number(maxPapers),
          }),
        }
      );
      setReview(response);
    } catch (err: any) {
      setError(err.message || 'Literature review generation failed');
    } finally {
      setLoading(false);
    }
  };

  const loadComparativeMatrix = async () => {
    setActiveTab('matrix');
    if (matrixData) return;
    setMatrixLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ComparativeMatrixResponse>(
        `/projects/${projectId}/reviews/comparative-matrix`
      );
      setMatrixData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to construct comparative literature matrix');
    } finally {
      setMatrixLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!review?.markdown_content) return;
    navigator.clipboard.writeText(review.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!review?.markdown_content) return;
    const blob = new Blob([review.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Literature_Review_${topic.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  const downloadLatex = () => {
    if (!matrixData?.latex_table) return;
    const blob = new Blob([matrixData.latex_table], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comparative_Matrix_${projectId.slice(0, 8)}.tex`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Publication Literature Review & Matrix</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Cross-document synthesis and structured comparative benchmarking across {papers.length} project papers.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-border-subtle text-xs">
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'synthesis'
                ? 'bg-surface-card text-primary-accent shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Synthesis Review</span>
          </button>
          <button
            onClick={loadComparativeMatrix}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-surface-card text-primary-accent shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Comparative Matrix</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-status-failed-bg border border-status-failed-border text-status-failed-text text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'synthesis' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-1 bg-surface-card p-5 rounded-xl border border-border-subtle shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary-accent" />
              Synthesis Configuration
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Research Topic Focus
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Memory-efficient attention architectures"
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Audience Depth
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                >
                  <option value="expert">Academic Researcher (Dense, cited)</option>
                  <option value="practitioner">Practitioner / Applied ML</option>
                  <option value="general">Executive Summary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Max Paper Breadth: {maxPapers}
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={maxPapers}
                  onChange={(e) => setMaxPapers(Number(e.target.value))}
                  className="w-full accent-primary-accent cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading || papers.length === 0}
                className="w-full bg-primary-accent hover:bg-primary-accent/90 text-white py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Literature...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Review</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Review Markdown Display */}
          <div className="lg:col-span-2 bg-surface-card p-6 rounded-xl border border-border-subtle shadow-2xs min-h-[420px] flex flex-col justify-between">
            {review ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <BookOpen className="w-4 h-4 text-primary-accent" />
                    <span>Synthesized across {review.cited_paper_ids.length} manuscripts</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-xs text-text-secondary transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-status-ready-text" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={downloadMarkdown}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-xs text-text-secondary transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export .md</span>
                    </button>
                  </div>
                </div>

                <div className="prose-chat text-text-primary text-[14px] leading-relaxed max-h-[600px] overflow-y-auto pr-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {review.markdown_content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-xs text-center p-8">
                <FileText className="w-10 h-10 stroke-1 mb-2 text-text-muted/60" />
                <p className="font-medium text-text-primary mb-1">No Literature Review Generated Yet</p>
                <p className="max-w-xs">
                  Set your research topic on the left and click "Generate Review" to assemble a structured cross-paper synthesis.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Comparative Matrix Tab */
        <div className="bg-surface-card p-6 rounded-xl border border-border-subtle shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Cross-Paper Comparative Literature Matrix</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Side-by-side empirical alignment across methods, datasets, evaluation metrics, and bottlenecks.
              </p>
            </div>
            {matrixData && (
              <button
                onClick={downloadLatex}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-xs font-medium text-text-secondary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export LaTeX Table</span>
              </button>
            )}
          </div>

          {matrixLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-xs text-text-secondary gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-accent" />
              <span>Extracting and assembling comparative matrix across paper metadata...</span>
            </div>
          ) : matrixData && matrixData.matrix.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border-subtle rounded-lg">
                <thead className="bg-surface-container-low text-text-primary border-b border-border-subtle">
                  <tr>
                    <th className="p-3 font-semibold w-1/4">Paper Title & Authors</th>
                    <th className="p-3 font-semibold w-1/4">Core Methodology</th>
                    <th className="p-3 font-semibold w-1/6">Datasets Evaluated</th>
                    <th className="p-3 font-semibold w-1/6">Metrics Reported</th>
                    <th className="p-3 font-semibold w-1/6">Acknowledged Limitations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {matrixData.matrix.map((row) => (
                    <tr key={row.paper_id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-3 align-top font-medium text-text-primary">
                        <div>{row.title}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {row.authors.slice(0, 3).join(', ')} {row.publication_year ? `(${row.publication_year})` : ''}
                        </div>
                      </td>
                      <td className="p-3 align-top text-text-secondary leading-relaxed">
                        {row.core_methodology}
                      </td>
                      <td className="p-3 align-top text-text-secondary">
                        <div className="flex flex-wrap gap-1">
                          {row.datasets_evaluated.slice(0, 3).map((d, i) => (
                            <span key={i} className="bg-surface-container-low px-1.5 py-0.5 rounded text-[10px] border border-border-subtle font-mono">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 align-top text-text-secondary">
                        <div className="flex flex-wrap gap-1">
                          {row.metrics_reported.slice(0, 3).map((m, i) => (
                            <span key={i} className="bg-status-ready-bg text-status-ready-text px-1.5 py-0.5 rounded text-[10px] border border-status-ready-border font-mono">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 align-top text-status-failed-text text-[11px] leading-relaxed">
                        {row.limitations.slice(0, 2).join('; ') || 'Scalability bounds'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-text-muted">
              No paper metadata found. Upload academic PDFs to automatically populate this matrix.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
