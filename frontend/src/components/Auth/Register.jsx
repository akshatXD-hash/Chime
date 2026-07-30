import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User as UserIcon, Camera, Eye, EyeOff, MessageSquare, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

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
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
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
    <div className="min-h-screen w-full bg-devs-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-devs-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-devs-indigo/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-card-dark relative z-10 border border-devs-border my-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-devs-blue via-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-blue mb-3">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Join <span className="devs-gradient-text">Chime</span>
          </h1>
          <p className="text-sm text-devs-textSecondary">
            Create your account to start chatting with your network
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-devs-card border-2 border-devs-border overflow-hidden flex items-center justify-center shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-devs-textMuted" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-devs-blue hover:bg-devs-blueHover text-white cursor-pointer shadow-glow-blue transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-devs-textMuted mt-2">Upload Profile Photo (Optional)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-devs-textMuted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Harkirat Singh"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-devs-textMuted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="harkirat@100xdevs.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-devs-textMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-11 pr-11 py-3 rounded-xl glass-input text-sm"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-devs-textMuted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl devs-gradient-btn text-white font-semibold text-sm flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-devs-border text-center">
          <p className="text-sm text-devs-textSecondary">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-devs-blue hover:text-devs-cyan font-semibold transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
