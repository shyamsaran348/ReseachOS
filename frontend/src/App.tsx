import React, { useEffect, useState, useRef } from 'react';
import { getAuthToken, removeAuthToken, apiRequest } from './api/client';
import { Project, Paper, AuthResponse } from './types';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { PapersLibrary } from './components/PapersLibrary';
import { AssistantChat } from './components/AssistantChat';
import { LiteratureReview } from './components/LiteratureReview';
import { GapAnalysis } from './components/GapAnalysis';
import { ProjectAnalyticsDashboard } from './components/ProjectAnalyticsDashboard';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [userName, setUserName] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('papers');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Listen for unauthorized events to automatically prompt login
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Fetch current user & projects when token exists
  const loadUserAndProjects = async () => {
    if (!token) {
      setInitialLoading(false);
      return;
    }
    try {
      // 1. Fetch current user
      const user = await apiRequest('/auth/me');
      setUserName(user.display_name || user.email);

      // 2. Fetch projects
      const projectList = await apiRequest<Project[]>('/projects');
      setProjects(projectList);

      if (projectList.length > 0) {
        // Keep active or select first
        setActiveProject((prev) => (prev ? projectList.find((p) => p.id === prev.id) || projectList[0] : projectList[0]));
      } else {
        // Auto-create a default starter project if none exists
        const defaultProj = await apiRequest<Project>('/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Primary Research Workspace',
            description: 'Default project for literature review and synthesis',
            research_objective: 'Synthesize research and discover literature gaps',
          }),
        });
        setProjects([defaultProj]);
        setActiveProject(defaultProj);
      }
    } catch (err) {
      console.error('Error loading initial data', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndProjects();
  }, [token]);

  // Fetch papers for active project
  const fetchPapers = async () => {
    if (!activeProject) {
      setPapers([]);
      return;
    }
    try {
      const data = await apiRequest<Paper[]>(`/projects/${activeProject.id}/papers`);
      setPapers(data);
    } catch (err) {
      console.error('Failed to load papers', err);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [activeProject]);

  // Real-time polling every 3 seconds if any paper is in QUEUED or EXTRACTING state
  useEffect(() => {
    if (!activeProject) return;

    const hasPending = papers.some((p) => p.status === 'QUEUED' || p.status === 'EXTRACTING');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchPapers();
    }, 3000);

    return () => clearInterval(interval);
  }, [papers, activeProject]);

  const handleLoginSuccess = (authData: AuthResponse) => {
    setToken(authData.access_token);
    setUserName(authData.display_name);
  };

  const handleLogout = () => {
    removeAuthToken();
    setToken(null);
    setProjects([]);
    setActiveProject(null);
    setPapers([]);
  };

  const handleProjectCreated = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProject?.id === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId);
      setActiveProject(remaining[0] || null);
    }
  };

  if (!token) {
    return <AuthModal onSuccess={handleLoginSuccess} />;
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary-accent mb-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col antialiased selection:bg-primary/20">
      {/* Top Fixed Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        onProjectCreated={handleProjectCreated}
        onProjectDeleted={handleProjectDeleted}
        userName={userName}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 pt-16">
        {/* Fixed Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          paperCount={papers.length}
          onOpenUploadModal={() => setIsUploadOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-8 min-h-[calc(100vh-64px)] overflow-y-auto">
          {activeProject ? (
            <>
              {activeTab === 'papers' && (
                <PapersLibrary
                  projectId={activeProject.id}
                  papers={papers}
                  onRefresh={fetchPapers}
                  onOpenUploadModal={() => setIsUploadOpen(true)}
                />
              )}

              {activeTab === 'assistant' && (
                <AssistantChat projectId={activeProject.id} papers={papers} />
              )}

              {activeTab === 'review' && (
                <LiteratureReview projectId={activeProject.id} papers={papers} />
              )}

              {activeTab === 'gap' && (
                <GapAnalysis projectId={activeProject.id} papers={papers} />
              )}

              {activeTab === 'analytics' && (
                <ProjectAnalyticsDashboard projectId={activeProject.id} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-24 text-text-muted">
              <p className="text-sm">Please select or create a project to get started.</p>
            </div>
          )}
        </main>
      </div>

      {/* Global PDF Upload Modal */}
      {activeProject && (
        <UploadModal
          projectId={activeProject.id}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={fetchPapers}
        />
      )}
    </div>
  );
}
