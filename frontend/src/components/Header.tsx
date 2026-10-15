import React, { useState } from 'react';
import { Project } from '../types';
import { apiRequest } from '../api/client';
import { 
  FolderPlus, 
  ChevronDown, 
  Plus, 
  Activity, 
  LogOut, 
  Settings as SettingsIcon,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
  onProjectDeleted: (projectId: string) => void;
  userName: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onProjectCreated,
  onProjectDeleted,
  userName,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectObj, setNewProjectObj] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setSubmitting(true);
    try {
      const created = await apiRequest<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          research_objective: newProjectObj,
        }),
      });
      onProjectCreated(created);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectObj('');
      setCreateModalOpen(false);
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to archive this project?')) return;
    try {
      await apiRequest(`/projects/${projectId}`, { method: 'DELETE' });
      onProjectDeleted(projectId);
    } catch (err: any) {
      alert(`Failed to archive project: ${err.message}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-card border-b border-border-subtle z-30 flex items-center justify-between px-6">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
            R
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">ResearchOS</span>
        </div>

        <div className="h-5 w-px bg-border-subtle hidden md:block" />

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-lg border border-border-subtle text-left transition-colors text-sm"
          >
            <span className="text-primary-accent font-medium">Project:</span>
            <span className="font-medium text-text-primary max-w-[200px] truncate">
              {activeProject ? activeProject.name : 'Select or Create Project'}
            </span>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-surface-card border border-border-subtle rounded-xl shadow-lg p-2 z-50">
              <div className="text-xs font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
                My Projects
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                      activeProject?.id === p.id
                        ? 'bg-primary/10 text-primary-accent font-medium'
                        : 'hover:bg-surface-container-low text-text-primary'
                    }`}
                  >
                    <span className="truncate flex-1">{p.name}</span>
                    <button
                      onClick={(e) => handleDeleteProject(p.id, e)}
                      title="Archive Project"
                      className="text-text-muted hover:text-status-failed-text p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="text-xs text-text-muted px-2 py-3 text-center">
                    No active projects found.
                  </div>
                )}
              </div>
              <div className="border-t border-border-subtle pt-2 mt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-primary-accent hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Profile Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary">
            {userName ? userName.slice(0, 2).toUpperCase() : 'DR'}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold text-text-primary">{userName || 'Researcher'}</span>
            <span className="text-[11px] text-text-muted">Verified Scholar</span>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-text-secondary hover:text-status-failed-text hover:bg-status-failed-bg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-card border border-border-subtle rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-text-primary mb-2">Create Research Project</h3>
            <p className="text-xs text-text-secondary mb-4">
              Organize related literature, queries, and analytical syntheses under a single workspace.
            </p>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Neural-Symbolic Synthesis in LLMs"
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Focusing on hybrid reasoning architectures..."
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Research Objective</label>
                <input
                  type="text"
                  value={newProjectObj}
                  onChange={(e) => setNewProjectObj(e.target.value)}
                  placeholder="Discover state-of-the-art gap benchmarks"
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-primary text-white hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
