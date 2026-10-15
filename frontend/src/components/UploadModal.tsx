import React, { useState, useRef } from 'react';
import { apiRequest } from '../api/client';
import { UploadCloud, X, File, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are currently supported.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are currently supported.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await apiRequest(`/projects/${projectId}/papers`, {
        method: 'POST',
        body: formData,
      });
      setSelectedFile(null);
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface-card border border-border-subtle rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <h3 className="text-base font-bold text-text-primary">Upload Research Paper (PDF)</h3>
          <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-status-failed-bg border border-status-failed-border text-status-failed-text rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border-strong hover:border-primary-accent rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-primary/5 text-primary-accent flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-primary">
              Click to select or drag & drop a PDF
            </p>
            <p className="text-xs text-text-muted mt-1">
              Supports academic manuscripts, pre-prints, and clinical reports up to 50MB.
            </p>

            {selectedFile && (
              <div className="mt-4 flex items-center gap-2 p-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-text-primary font-medium">
                <File className="w-4 h-4 text-primary-accent" />
                <span className="truncate max-w-[280px]">{selectedFile.name}</span>
                <span className="text-text-muted">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-container-low rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="px-4 py-2 text-xs font-medium bg-primary text-white hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{uploading ? 'Uploading & Queuing...' : 'Queue for Extraction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
