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
  Loader2
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
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ projectId, papers }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Welcome to your Grounded Research Assistant. Ask questions across your project papers, and every answer will be paired with verified chunk citations retrieved via pgvector.',
      grounded: true,
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
      const response = await apiRequest<any>(
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

      // Map backend AssistantCitation to Citation interface
      const mappedCitations: Citation[] = (response.citations || []).map((c: any, i: number) => ({
        paper_id: c.paper_id || `cite-${i}`,
        paper_title: c.paper_title || 'Research Manuscript',
        chunk_index: c.page_number || 1,
        text: c.quoted_text || '',
        score: c.score || undefined,
      }));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: response.answer,
        citations: mappedCitations,
        grounded: response.grounded,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Main Chat Feed */}
      <div className="lg:col-span-2 flex flex-col bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        {/* Chat Control Bar */}
        <div className="px-5 py-3 border-b border-border-subtle bg-surface-container-low/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-accent" />
            <span className="font-semibold text-sm text-text-primary">Research Assistant</span>
            <span className="text-xs bg-status-ready-bg border border-status-ready-border text-status-ready-text px-2 py-0.5 rounded-full font-medium">
              pgvector RAG
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as any)}
              className="text-xs bg-surface-card border border-border-subtle rounded-md px-2 py-1 text-text-secondary focus:outline-none"
            >
              <option value="project">Entire Project Literature</option>
              <option value="paper">Selected Papers Only</option>
            </select>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-4 text-sm ${
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
                      <span className="inline-flex items-center gap-1 text-status-ready-text font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Grounded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted">
                        <Info className="w-3.5 h-3.5" />
                        <span>General synthesis</span>
                      </span>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-auto">
                        {msg.citations.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCitation(c)}
                            className="inline-flex items-center gap-1 bg-surface-card hover:bg-white text-primary-accent border border-border-subtle px-2 py-0.5 rounded text-[11px] font-medium transition-colors shadow-2xs"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Cite [{i + 1}]</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-text-muted text-xs italic p-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-accent" />
              <span>Querying vector store and synthesizing grounded response...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-border-subtle bg-surface-card flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about methodology, findings, or metrics across your papers..."
            className="flex-1 bg-surface-container-low border border-border-subtle rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-text-primary"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-4 py-2 bg-primary hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Citations & Source Chunks Panel */}
      <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm p-5 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <BookOpen className="w-4 h-4 text-primary-accent" />
          <h3 className="font-semibold text-sm text-text-primary">Ground Truth Citations</h3>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          {selectedCitation ? (
            <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-primary-accent">
                <span>{selectedCitation.paper_title || 'Source Paper'}</span>
                {selectedCitation.score && (
                  <span className="text-text-muted">Similarity: {(selectedCitation.score * 100).toFixed(1)}%</span>
                )}
              </div>
              <div className="text-[11px] text-text-muted font-mono">
                Chunk #{selectedCitation.chunk_index}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed bg-surface-card p-3 rounded-lg border border-border-subtle font-serif">
                "{selectedCitation.text}"
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted text-xs">
              <Layers className="w-8 h-8 mx-auto text-text-muted/60 mb-2" />
              <p>Click on any <span className="font-medium text-text-secondary">Cite [n]</span> badge in the conversation to inspect verified text extracts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
