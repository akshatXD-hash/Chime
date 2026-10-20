import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, MessageCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const Login = ({ onSwitchToRegister }) => {
  const { login, authNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-devs-bg flex items-center justify-center p-4 relative selection:bg-devs-blue selection:text-white">
      {/* Subtle radial geometric grid background */}

      <div className="w-full max-w-md bg-devs-surface/90  p-6 sm:p-8 rounded-3xl shadow-card-dark relative z-10 border border-devs-border/80">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-devs-blue/10 border border-devs-blue/30 flex items-center justify-center text-devs-blue mb-4">
            <MessageCircle className="w-6 h-6 text-devs-indigo" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Welcome back to <span className="devs-gradient-text">Chime</span>
          </h1>
          <p className="text-xs text-devs-textSecondary max-w-xs">
            Sign in to access your conversations and team messages
          </p>
        </div>

        {authNotice && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{authNotice}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-devs-textMuted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl devs-gradient-btn text-white font-semibold text-xs flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-devs-border/60 text-center">
          <p className="text-xs text-devs-textSecondary">
            Don't have an account yet?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-devs-indigo hover:text-devs-violet font-semibold transition-colors ml-0.5"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
