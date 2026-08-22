import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User as UserIcon, Camera, Eye, EyeOff, MessageCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('image', avatarFile);
        await signup(formData);
      } else {
        await signup({ name, email, password });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-devs-bg flex items-center justify-center p-4 relative selection:bg-devs-blue selection:text-white">
      {/* Subtle radial geometric grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F2942_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <div className="w-full max-w-md bg-devs-surface/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-card-dark relative z-10 border border-devs-border/80 my-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-devs-blue/10 border border-devs-blue/30 flex items-center justify-center text-devs-indigo mb-3">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Join <span className="devs-gradient-text">Chime</span>
          </h1>
          <p className="text-xs text-devs-textSecondary">
            Create an account to start chatting with your network
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-1">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center shadow-subtle">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-devs-textMuted" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 rounded-xl bg-devs-blue text-white cursor-pointer hover:bg-devs-blueHover transition-transform hover:scale-105 shadow-sm">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[11px] text-devs-textMuted mt-1.5 font-medium">Upload photo (optional)</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1">
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
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs"
                required
                minLength={6}
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
            className="w-full py-3 px-4 rounded-xl devs-gradient-btn text-white font-semibold text-xs flex items-center justify-center gap-2 group disabled:opacity-50 mt-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-devs-border/60 text-center">
          <p className="text-xs text-devs-textSecondary">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-devs-indigo hover:text-devs-violet font-semibold transition-colors ml-0.5"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
