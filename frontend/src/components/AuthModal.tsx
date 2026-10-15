import React, { useState } from 'react';
import { apiRequest, setAuthToken } from '../api/client';
import { AuthResponse } from '../types';
import { Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (authData: AuthResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('scholar_final@oxford.edu');
  const [password, setPassword] = useState('Demo@1234');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // OAuth2 Password form submission
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const res = await apiRequest<AuthResponse>('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        setAuthToken(res.access_token);
        onSuccess(res);
      } else {
        const res = await apiRequest<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            display_name: displayName,
          }),
        });
        setAuthToken(res.access_token);
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-card border border-border-subtle rounded-xl shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary-accent rounded-xl flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {isLogin ? 'Welcome back to ResearchOS' : 'Create Researcher Account'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isLogin
              ? 'Enter your credentials to access your workspace'
              : 'Start synthesizing literature and running grounded RAG queries'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-status-failed-bg border border-status-failed-border text-status-failed-text rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Full Name / Title</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. Jane Doe"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all text-text-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@university.edu"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all text-text-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLogin ? 'Sign In to Workspace' : 'Create Free Account'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary">
          {isLogin ? "Don't have an account yet?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-primary-accent hover:underline font-medium"
          >
            {isLogin ? 'Register now' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
