import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiRequest } from '../api/client';
import { LiteratureReviewResponse, Paper } from '../types';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  Loader2, 
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface LiteratureReviewProps {
  projectId: string;
  papers: Paper[];
}

export const LiteratureReview: React.FC<LiteratureReviewProps> = ({ projectId, papers }) => {
  const [topic, setTopic] = useState('Comparative synthesis of methodologies');
  const [targetAudience, setTargetAudience] = useState<'general' | 'expert' | 'practitioner'>('expert');
  const [maxPapers, setMaxPapers] = useState(5);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<LiteratureReviewResponse | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Literature Review Synthesizer</h1>
          <p className="text-sm text-text-secondary mt-1">
            Automated cross-document literature synthesis generating publication-grade state-of-the-art reports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Synthesis Configuration Sidebar */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle font-semibold text-sm text-text-primary">
            <Sliders className="w-4 h-4 text-primary-accent" />
            <span>Synthesis Parameters</span>
          </div>

          {error && (
            <div className="p-3 bg-status-failed-bg border border-status-failed-border text-status-failed-text rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Research Topic / Angle *
              </label>
              <textarea
                rows={3}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Robustness and generalization metrics in foundation models"
                className="w-full px-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
              >
                <option value="expert">Academic Researchers & Peer Reviewers</option>
                <option value="practitioner">Applied Engineers & Practitioners</option>
                <option value="general">Executive & General Science Audience</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium text-text-secondary mb-1">
                <span>Maximum Papers to Synthesize</span>
                <span className="font-bold text-text-primary">{maxPapers}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(papers.length, 10)}
                value={maxPapers}
                onChange={(e) => setMaxPapers(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Literature...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-primary-accent" />
                  <span>Generate Synthesis</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Review Document */}
        <div className="lg:col-span-2 bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-accent" />
              <h3 className="font-semibold text-sm text-text-primary">Generated Literature Review</h3>
            </div>

            {review && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-text-secondary rounded-lg text-xs font-medium transition-colors border border-border-subtle"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-status-ready-text" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-text-secondary rounded-lg text-xs font-medium transition-colors border border-border-subtle"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-accent" />
              <p className="text-sm font-medium text-text-secondary">Extracting cross-document perspectives & thematic clusters...</p>
              <p className="text-xs text-text-muted">Synthesizing comprehensive review via Groq LLM</p>
            </div>
          ) : review ? (
          <div className="prose-review text-text-primary leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-text-primary mt-6 mb-3 pb-2 border-b border-border-subtle">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-text-primary mt-5 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-text-primary mt-4 mb-1.5">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-text-primary leading-7 mb-3">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-text-primary">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-text-secondary">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-sm text-text-primary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-sm text-text-primary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-6">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className="text-xs bg-surface-container-high text-primary-accent px-1.5 py-0.5 rounded font-mono">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary-accent/40 pl-4 my-3 text-text-secondary italic text-sm">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-border-subtle my-4" />,
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary-accent underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {review.markdown_content}
              </ReactMarkdown>

              {review.cited_paper_ids && review.cited_paper_ids.length > 0 && (
                <div className="mt-8 pt-4 border-t border-border-subtle">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Included Paper Citations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {review.cited_paper_ids.map((id) => (
                      <span key={id} className="text-[11px] bg-surface-container-high px-2 py-1 rounded text-text-secondary font-mono">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted py-16">
              <FileText className="w-10 h-10 text-text-muted/50 mb-3" />
              <p className="text-sm font-medium text-text-secondary">No literature review generated yet</p>
              <p className="text-xs text-text-muted max-w-sm mt-1">
                Select your research angle and click "Generate Synthesis" to produce an editorial-grade review across your project papers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
