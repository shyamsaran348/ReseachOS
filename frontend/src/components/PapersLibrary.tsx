import React, { useState } from 'react';
import { Paper } from '../types';
import { apiRequest } from '../api/client';
import { 
  UploadCloud, 
  RefreshCw, 
  Trash2, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

interface PapersLibraryProps {
  projectId: string;
  papers: Paper[];
  onRefresh: () => void;
  onOpenUploadModal: () => void;
}

export const PapersLibrary: React.FC<PapersLibraryProps> = ({
  projectId,
  papers,
  onRefresh,
  onOpenUploadModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const handleReprocess = async (paperId: string) => {
    setReprocessingId(paperId);
    try {
      await apiRequest(`/projects/${projectId}/papers/${paperId}/reprocess`, {
        method: 'POST',
      });
      onRefresh();
    } catch (err: any) {
      alert(`Reprocess failed: ${err.message}`);
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDelete = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    try {
      await apiRequest(`/projects/${projectId}/papers/${paperId}`, {
        method: 'DELETE',
      });
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredPapers = papers.filter((p) =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.abstract || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (paper: Paper) => {
    switch (paper.status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-ready-bg text-status-ready-text border border-status-ready-border">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready</span>
          </span>
        );
      case 'EXTRACTING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-pending-bg text-status-pending-text border border-status-pending-border animate-pulse">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Extracting</span>
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-text-secondary border border-border-subtle">
            <Clock className="w-3 h-3" />
            <span>Queued</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-failed-bg text-status-failed-text border border-status-failed-border">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Papers Library</h1>
            <span className="bg-surface-container-high px-2 py-0.5 rounded-md text-xs font-medium text-text-secondary">
              {papers.length} Papers Total
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Research Information Extraction (RIE) pipeline actively parsing PDFs into pgvector embeddings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh list"
            className="p-2 bg-surface-card hover:bg-surface-container-low border border-border-subtle rounded-lg text-text-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-surface-card p-3 rounded-xl border border-border-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search papers by title or abstract keywords..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
          />
        </div>
      </div>

      {/* Papers Table */}
      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-border-subtle text-xs uppercase tracking-wider text-text-secondary font-semibold">
              <tr>
                <th className="px-5 py-3.5">Paper / Manuscript</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Year</th>
                <th className="px-5 py-3.5">Uploaded</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-5 py-4 max-w-md">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/5 text-primary shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary truncate" title={paper.title}>
                          {paper.title || 'Untitled Manuscript'}
                        </div>
                        {paper.abstract && (
                          <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
                            {paper.abstract}
                          </p>
                        )}
                        {paper.error_message && (
                          <p className="text-xs text-status-failed-text mt-1">
                            Error: {paper.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getStatusBadge(paper)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-text-secondary text-xs">
                    {paper.publication_year || '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-text-muted text-xs">
                    {new Date(paper.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {paper.status === 'FAILED' && (
                        <button
                          onClick={() => handleReprocess(paper.id)}
                          disabled={reprocessingId === paper.id}
                          title="Reprocess Extraction"
                          className="p-1.5 rounded-md text-primary-accent hover:bg-primary/10 transition-colors"
                        >
                          <RotateCcw className={`w-4 h-4 ${reprocessingId === paper.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(paper.id)}
                        title="Delete Paper"
                        className="p-1.5 rounded-md text-text-muted hover:text-status-failed-text hover:bg-status-failed-bg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPapers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UploadCloud className="w-8 h-8 text-text-muted/60" />
                      <span className="font-medium text-sm text-text-secondary">No papers found</span>
                      <p className="text-xs text-text-muted max-w-sm">
                        Upload a research paper in PDF format to initiate automatic metadata extraction and vector chunking.
                      </p>
                      <button
                        onClick={onOpenUploadModal}
                        className="mt-2 text-xs font-semibold text-primary-accent hover:underline"
                      >
                        Upload your first PDF
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
