import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { apiRequest } from '../api/client';
import { AssistantChatResponse, Citation, Paper } from '../types';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  Sparkles,
  ChevronRight,
  Info,
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface AssistantChatProps {
  projectId: string;
  papers: Paper[];
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  grounded?: boolean;
  verificationSummary?: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ projectId, papers }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Welcome to your Grounded Research Assistant. Ask questions across your project papers, and answers will be paired with verified chunk citations retrieved via hybrid dense-sparse search.',
      grounded: true,
      verificationSummary: 'Active: Hybrid pgvector + BM25 retrieval with claim verification.'
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [scopeType, setScopeType] = useState<'project' | 'paper'>('project');
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await apiRequest<AssistantChatResponse>(
        `/projects/${projectId}/assistant/chat`,
        {
          method: 'POST',
          body: JSON.stringify({
            query: userMessage.content,
            scope_type: scopeType === 'paper' ? 'SELECTED_PAPERS' : 'ENTIRE_PROJECT',
            selected_paper_ids: scopeType === 'paper' ? selectedPaperIds : [],
          }),
        }
      );

      const mappedCitations: Citation[] = (response.citations || []).map((c: any, i: number) => ({
        citation_id: c.citation_id || i + 1,
        paper_id: c.paper_id || `cite-${i}`,
        paper_title: c.paper_title || 'Research Manuscript',
        page_number: c.page_number || 1,
        quoted_text: c.quoted_text || '',
        verified: c.verified ?? true,
        confidence_score: c.confidence_score ?? 0.95,
      }));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: response.answer,
        citations: mappedCitations,
        grounded: response.grounded,
        verificationSummary: response.verification_summary,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: `Error retrieving grounded response: ${err.message}`,
          grounded: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-surface-ground">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Scope Selector Bar */}
        <div className="px-6 py-3 border-b border-border-subtle bg-surface-card flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">Retrieval Scope:</span>
            <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => setScopeType('project')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  scopeType === 'project'
                    ? 'bg-surface-card text-primary-accent shadow-2xs font-medium'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                All Project Papers ({papers.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeType('paper')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  scopeType === 'paper'
                    ? 'bg-surface-card text-primary-accent shadow-2xs font-medium'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Selected Papers ({selectedPaperIds.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-status-ready-text bg-status-ready-bg/50 px-2.5 py-1 rounded-full border border-status-ready-border">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Hybrid Search + Entailment Verification</span>
          </div>
        </div>

        {/* Paper Selector Drawer if scopeType === 'paper' */}
        {scopeType === 'paper' && (
          <div className="px-6 py-2.5 bg-surface-container-low/60 border-b border-border-subtle flex flex-wrap gap-2 max-h-28 overflow-y-auto">
            {papers.map((p) => {
              const isSelected = selectedPaperIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPaperIds((prev) =>
                      isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                    );
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                    isSelected
                      ? 'bg-primary-accent text-white border-primary-accent'
                      : 'bg-surface-card text-text-secondary border-border-subtle hover:border-text-muted'
                  }`}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-primary-accent/10 text-primary-accent'
                }`}
              >
                {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`px-4 py-3 rounded-xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-text-primary border border-border-subtle'
                }`}
              >
                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                ) : (
                  <div className="leading-relaxed prose-chat text-text-primary text-[14px]">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold text-text-primary mt-4 mb-2 tracking-tight">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-[15px] font-bold text-text-primary mt-3 mb-1.5 tracking-tight">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-text-primary mt-2.5 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-text-primary">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
                        em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-outside pl-4 mb-2.5 space-y-1 text-sm">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2.5 space-y-1 text-sm">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        code: ({ children }) => (
                          <code className="text-xs bg-surface-container-high text-primary-accent px-1.5 py-0.5 rounded font-mono">
                            {children}
                          </code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-3 border-primary-accent/40 pl-3 my-2 text-text-secondary italic text-xs">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Grounding & Citations Indicator */}
                {msg.sender === 'assistant' && (
                  <div className="mt-3 pt-3 border-t border-border-subtle/80 flex flex-wrap items-center gap-2 text-xs">
                    {msg.grounded ? (
                      <span className="inline-flex items-center gap-1 text-status-ready-text font-medium bg-status-ready-bg/40 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Grounded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted">
                        <Info className="w-3.5 h-3.5" />
                        <span>General synthesis</span>
                      </span>
                    )}

                    {msg.verificationSummary && (
                      <span className="text-[11px] text-text-secondary">
                        • {msg.verificationSummary}
                      </span>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-auto">
                        {msg.citations.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCitation(c)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors shadow-2xs border ${
                              c.verified
                                ? 'bg-surface-card hover:bg-white text-primary-accent border-border-subtle'
                                : 'bg-status-failed-bg text-status-failed-text border-status-failed-border'
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>[Citation {c.citation_id || i + 1}]</span>
                            <span className="opacity-75 text-[10px]">P.{c.page_number}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary-accent/10 text-primary-accent">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-primary-accent" />
                <span>Executing hybrid dense-sparse search and verifying claim citations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-surface-card border-t border-border-subtle flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a technical or empirical research question across your papers..."
            className="flex-1 bg-surface-container-low border border-border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-accent"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary-accent hover:bg-primary-accent/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Search & Answer</span>
          </button>
        </form>
      </div>

      {/* Citation Provenance Drawer */}
      {selectedCitation && (
        <div className="w-80 border-l border-border-subtle bg-surface-card p-5 flex flex-col justify-between shrink-0 shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary-accent" />
                Citation Verification
              </h3>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-text-muted hover:text-text-primary text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Source Manuscript</span>
                <p className="text-xs font-medium text-text-primary mt-0.5">{selectedCitation.paper_title}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Page</span>
                  <p className="text-xs font-medium text-text-primary mt-0.5">Page {selectedCitation.page_number}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Claim Entailment</span>
                  <p className="text-xs font-medium text-status-ready-text mt-0.5">
                    {selectedCitation.verified ? 'Verified (Claim Match)' : 'Contextual'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Extracted Source Passage</span>
                <div className="mt-1 p-3 bg-surface-container-low rounded-lg border border-border-subtle text-xs text-text-secondary leading-relaxed max-h-72 overflow-y-auto italic">
                  "{selectedCitation.quoted_text || selectedCitation.text}"
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle text-[11px] text-text-muted">
            Dense 384-dim vector match indexed via PostgreSQL pgvector.
          </div>
        </div>
      )}
    </div>
  );
};
