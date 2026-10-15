import React from 'react';
import { 
  BookOpen, 
  BrainCircuit, 
  FileText, 
  Sparkles, 
  BarChart3, 
  UploadCloud
} from 'lucide-react';

export type TabType = 'papers' | 'assistant' | 'review' | 'gap' | 'analytics';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  paperCount: number;
  onOpenUploadModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  paperCount,
  onOpenUploadModal,
}) => {
  const navItems = [
    {
      id: 'papers' as TabType,
      label: 'Papers Library',
      icon: BookOpen,
      badge: paperCount.toString(),
      badgeColor: 'bg-surface-container-high text-text-secondary',
    },
    {
      id: 'assistant' as TabType,
      label: 'Research Assistant',
      icon: BrainCircuit,
      badge: 'RAG',
      badgeColor: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
    },
    {
      id: 'review' as TabType,
      label: 'Literature Review',
      icon: FileText,
      badge: 'Synthesis',
      badgeColor: 'bg-surface-container-high text-text-secondary',
    },
    {
      id: 'gap' as TabType,
      label: 'Gap Analysis',
      icon: Sparkles,
      badge: 'Novelty',
      badgeColor: 'bg-surface-container-high text-text-secondary',
    },
    {
      id: 'analytics' as TabType,
      label: 'Project Analytics',
      icon: BarChart3,
      badge: 'pgvector',
      badgeColor: 'bg-primary-fixed text-primary font-mono',
    },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-card border-r border-border-subtle z-20 flex flex-col justify-between overflow-y-auto">
      <div className="p-4">
        <div className="px-3 py-1 mb-2">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Workspace Navigation
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive
                    ? 'bg-primary text-white font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-container-low hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-text-muted'}`} />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action Area */}
      <div className="p-4 border-t border-border-subtle bg-surface-container-low/40">
        <button
          onClick={onOpenUploadModal}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-3 rounded-lg shadow-sm transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload PDF Paper</span>
        </button>
      </div>
    </aside>
  );
};
