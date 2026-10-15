import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { ProjectAnalytics } from '../types';
import { 
  BarChart3, 
  Database, 
  Layers, 
  FileCheck2, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Cpu,
  Loader2
} from 'lucide-react';

interface ProjectAnalyticsProps {
  projectId: string;
}

export const ProjectAnalyticsDashboard: React.FC<ProjectAnalyticsProps> = ({ projectId }) => {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ProjectAnalytics>(`/projects/${projectId}/analytics`);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Project Analytics & Vector Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time diagnostics across pgvector chunk indices, RIE extraction states, and semantic entity graphs.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-card hover:bg-surface-container-low border border-border-subtle rounded-lg text-xs font-medium text-text-secondary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary-accent mb-2" />
          <span className="text-xs">Computing vector statistics...</span>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Manuscripts
                </span>
                <div className="p-2 rounded-lg bg-primary/5 text-primary">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-primary mt-3">
                {analytics.total_papers || 0}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Papers registered within this workspace
              </p>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  pgvector Chunks
                </span>
                <div className="p-2 rounded-lg bg-status-ready-bg text-status-ready-text">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-primary mt-3">
                {analytics.total_chunks || 0}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Embedded semantic text chunks ready for retrieval
              </p>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Extracted Entities
                </span>
                <div className="p-2 rounded-lg bg-primary-fixed text-primary">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-primary mt-3">
                {analytics.extracted_entities_count || 0}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Discovered methodologies, metrics, and models
              </p>
            </div>
          </div>

          {/* Pipeline Health Details */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-text-primary mb-4">Pipeline Health & Processing Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-status-ready-bg/50 border border-status-ready-border flex items-center gap-3">
                <FileCheck2 className="w-5 h-5 text-status-ready-text" />
                <div>
                  <div className="text-lg font-bold text-status-ready-text">
                    {analytics.ready_papers ?? analytics.total_papers}
                  </div>
                  <div className="text-xs text-text-secondary">Fully Indexed (Ready)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-status-pending-bg/50 border border-status-pending-border flex items-center gap-3">
                <Clock className="w-5 h-5 text-status-pending-text" />
                <div>
                  <div className="text-lg font-bold text-status-pending-text">
                    {analytics.processing_papers ?? 0}
                  </div>
                  <div className="text-xs text-text-secondary">Extracting / Queued</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-status-failed-bg/50 border border-status-failed-border flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-status-failed-text" />
                <div>
                  <div className="text-lg font-bold text-status-failed-text">
                    {analytics.failed_papers ?? 0}
                  </div>
                  <div className="text-xs text-text-secondary">Requires Reprocess</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted text-xs">
          Analytics temporarily unavailable.
        </div>
      )}
    </div>
  );
};
