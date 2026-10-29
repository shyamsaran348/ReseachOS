import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { BenchmarkOverviewResponse, BenchmarkGroup, BenchmarkMetricRecord, BenchmarkPairComparison, ComparabilityTier, Paper } from '../types';
import { 
  BarChart2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  Download, 
  BookOpen, 
  Sliders, 
  ExternalLink,
  Loader2,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface PerformanceBenchmarksProps {
  projectId: string;
  papers: Paper[];
}

export const PerformanceBenchmarks: React.FC<PerformanceBenchmarksProps> = ({ projectId, papers }) => {
  const [data, setData] = useState<BenchmarkOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<string>('ALL');
  const [selectedMetric, setSelectedMetric] = useState<string>('ALL');
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<BenchmarkMetricRecord | null>(null);

  useEffect(() => {
    loadBenchmarks();
  }, [projectId]);

  const loadBenchmarks = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<BenchmarkOverviewResponse>(`/projects/${projectId}/benchmarks/${projectId}`);
      setData(res);
      if (res.groups.length > 0) {
        setActiveGroupIndex(0);
      }
    } catch (err) {
      console.error('Failed to load benchmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadLatex = () => {
    if (!data?.latex_benchmark_table) return;
    const blob = new Blob([data.latex_benchmark_table], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Benchmark_Matrix_${projectId.slice(0, 8)}.tex`;
    a.click();
  };

  const filteredGroups = (data?.groups || []).filter((g) => {
    const matchDataset = selectedDataset === 'ALL' || g.dataset_name === selectedDataset;
    const matchMetric = selectedMetric === 'ALL' || g.metric_name === selectedMetric;
    return matchDataset && matchMetric;
  });

  const activeGroup: BenchmarkGroup | undefined = filteredGroups[activeGroupIndex] || filteredGroups[0];

  const getTierBadge = (tier: ComparabilityTier) => {
    switch (tier) {
      case 'DIRECTLY_COMPARABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-status-ready-bg text-status-ready-text border border-status-ready-border">
            <CheckCircle2 className="w-3 h-3" />
            <span>Directly Comparable</span>
          </span>
        );
      case 'CONDITIONALLY_COMPARABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-status-pending-bg text-status-pending-text border border-status-pending-border">
            <AlertTriangle className="w-3 h-3" />
            <span>Conditionally Comparable</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-status-failed-bg text-status-failed-text border border-status-failed-border">
            <XCircle className="w-3 h-3" />
            <span>Not Comparable</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-accent" />
            Cross-Paper Performance Benchmarking
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Systematic experimental evaluation across {papers.length} papers with automated comparability tier detection.
          </p>
        </div>

        {data && (
          <button
            onClick={downloadLatex}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-container-high border border-border-subtle text-xs font-medium text-text-secondary transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export LaTeX Table</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-xs text-text-secondary gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-accent" />
          <span>Extracting experimental benchmarks and evaluating comparability tiers...</span>
        </div>
      ) : !data || data.groups.length === 0 ? (
        <div className="py-20 text-center text-xs text-text-muted flex flex-col items-center justify-center">
          <BarChart2 className="w-10 h-10 stroke-1 mb-2 text-text-muted/60" />
          <p className="font-medium text-text-primary mb-1">No Benchmark Metrics Extracted Yet</p>
          <p className="max-w-sm">
            Upload experimental research papers to automatically extract architectures, datasets, metrics, and comparability matrices.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-surface-card p-4 rounded-xl border border-border-subtle shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-text-muted" />
                <span className="font-semibold text-text-secondary">Dataset Filter:</span>
                <select
                  value={selectedDataset}
                  onChange={(e) => {
                    setSelectedDataset(e.target.value);
                    setActiveGroupIndex(0);
                  }}
                  className="bg-surface-container-low border border-border-subtle rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
                >
                  <option value="ALL">All Datasets ({data.datasets.length})</option>
                  {data.datasets.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-text-secondary">Metric Filter:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => {
                    setSelectedMetric(e.target.value);
                    setActiveGroupIndex(0);
                  }}
                  className="bg-surface-container-low border border-border-subtle rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
                >
                  <option value="ALL">All Metrics ({data.metrics.length})</option>
                  {data.metrics.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-text-muted">
              Total Extracted Records: <span className="font-bold text-text-primary">{data.total_benchmarks_extracted}</span>
            </div>
          </div>

          {/* Main Visual Comparison & Group Selection */}
          {activeGroup && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Group Selector Tab Column */}
              <div className="lg:col-span-1 bg-surface-card p-4 rounded-xl border border-border-subtle shadow-2xs space-y-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Benchmark Clusters ({filteredGroups.length})
                </h3>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredGroups.map((group, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveGroupIndex(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeGroupIndex === idx
                          ? 'bg-primary-accent/10 border-primary-accent text-text-primary shadow-2xs'
                          : 'bg-surface-container-low border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="font-bold text-xs">{group.dataset_name}</div>
                      <div className="flex items-center justify-between text-[11px] mt-1 text-text-muted">
                        <span className="font-mono text-primary-accent">{group.metric_name}</span>
                        <span>{group.records.length} models</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Performance Comparison Chart */}
              <div className="lg:col-span-2 bg-surface-card p-6 rounded-xl border border-border-subtle shadow-2xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <div>
                      <h2 className="text-sm font-bold text-text-primary">
                        {activeGroup.dataset_name} — {activeGroup.metric_name}
                      </h2>
                      <p className="text-xs text-text-secondary mt-0.5">{activeGroup.comparability_summary}</p>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="mt-6 space-y-4">
                    {activeGroup.records.map((rec) => {
                      const maxScore = Math.max(...activeGroup.records.map((r) => r.metric_value), 100);
                      const barWidth = `${Math.min(100, Math.max(15, (rec.metric_value / maxScore) * 100))}%`;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => setSelectedRecord(rec)}
                          className="p-3 bg-surface-container-low rounded-lg border border-border-subtle hover:border-primary-accent/50 cursor-pointer transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-text-primary flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-primary-accent" />
                              {rec.model_name}
                            </span>
                            <span className="font-mono font-bold text-text-primary text-sm">
                              {rec.metric_value} {rec.unit}
                            </span>
                          </div>

                          {/* Progress Bar Container */}
                          <div className="w-full bg-surface-ground h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary-accent h-full rounded-full transition-all duration-500"
                              style={{ width: barWidth }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
                            <span>Protocol: {rec.evaluation_split}</span>
                            <span className="italic">{rec.paper_title} (Page {rec.source_page})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pairwise Comparability Rationale */}
                {activeGroup.comparisons.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border-subtle space-y-3">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Intelligent Comparability Diagnostics
                    </h4>
                    <div className="space-y-2">
                      {activeGroup.comparisons.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 bg-surface-container-low/60 rounded-lg border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-text-primary">
                              {c.model_a} vs {c.model_b} (Δ {c.delta_percentage}%)
                            </div>
                            <div className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                              {c.discrepancy_rationale}
                            </div>
                          </div>
                          <div className="shrink-0">{getTierBadge(c.tier)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Tabular View */}
          <div className="bg-surface-card p-6 rounded-xl border border-border-subtle shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Comprehensive Normalized Experimental Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border-subtle rounded-lg">
                <thead className="bg-surface-container-low text-text-primary border-b border-border-subtle">
                  <tr>
                    <th className="p-3 font-semibold">Model / Architecture</th>
                    <th className="p-3 font-semibold">Dataset</th>
                    <th className="p-3 font-semibold">Metric & Value</th>
                    <th className="p-3 font-semibold">Split & Protocol</th>
                    <th className="p-3 font-semibold">Source Paper Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(activeGroup?.records || []).map((rec) => (
                    <tr key={rec.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-3 align-top font-medium text-text-primary">
                        <div>{rec.model_name}</div>
                        <div className="text-[10px] text-text-muted">{rec.architecture_family}</div>
                      </td>
                      <td className="p-3 align-top font-mono text-text-secondary">{rec.dataset_name}</td>
                      <td className="p-3 align-top">
                        <span className="font-mono font-bold text-status-ready-text bg-status-ready-bg/60 px-2 py-0.5 rounded border border-status-ready-border text-xs">
                          {rec.metric_name}: {rec.metric_value}{rec.unit}
                        </span>
                      </td>
                      <td className="p-3 align-top text-text-secondary">
                        <div className="font-medium">{rec.evaluation_split}</div>
                        <div className="text-[10px] text-text-muted">{rec.experimental_protocol}</div>
                      </td>
                      <td className="p-3 align-top text-text-secondary">
                        <div className="font-medium text-text-primary">{rec.paper_title}</div>
                        <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-primary-accent" />
                          <span>Page {rec.source_page}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Provenance Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card border border-border-subtle rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-accent" />
                Benchmark Source Evidence
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-text-muted hover:text-text-primary text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Model & Score</span>
                <p className="font-bold text-text-primary text-base mt-0.5">
                  {selectedRecord.model_name}: {selectedRecord.metric_value}{selectedRecord.unit} ({selectedRecord.metric_name})
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Dataset & Protocol</span>
                <p className="text-text-secondary mt-0.5">
                  {selectedRecord.dataset_name} ({selectedRecord.evaluation_split}) — {selectedRecord.experimental_protocol}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Source Paper</span>
                <p className="font-medium text-text-primary mt-0.5">{selectedRecord.paper_title}</p>
                <p className="text-text-muted text-[11px]">Reported on Page {selectedRecord.source_page}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full bg-surface-container-low hover:bg-surface-container-high border border-border-subtle py-2 rounded-lg text-xs font-medium text-text-primary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

