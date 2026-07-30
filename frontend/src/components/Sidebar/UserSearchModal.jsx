import React, { useState } from 'react';
import { userApi } from '../../api/userApi';
import { useChat } from '../../context/ChatContext';
import { Search, X, UserPlus, Loader2, MessageSquare } from 'lucide-react';

export const UserSearchModal = ({ isOpen, onClose }) => {
  const { accessChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await userApi.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError(err.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId) => {
    setLoading(true);
    try {
      await accessChat(userId);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not start chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-devs-border shadow-card-dark p-6 overflow-hidden relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-devs-border mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-devs-blue" />
            <h3 className="text-lg font-bold text-white">Start New Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl glass-input text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg devs-gradient-btn text-white text-xs font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {error && <p className="text-xs text-red-400 p-2">{error}</p>}

          {searchResults.length === 0 && !loading && (
            <p className="text-center text-xs text-devs-textMuted py-8">
              Search users by email or name to begin messaging
            </p>
          )}

          {searchResults.map((userItem) => (
            <div
              key={userItem._id}
              onClick={() => handleSelectUser(userItem._id)}
              className="flex items-center justify-between p-3 rounded-xl glass-card hover:border-devs-blue/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-devs-blue">
                  {userItem.pic ? (
                    <img src={userItem.pic} alt={userItem.name} className="w-full h-full object-cover" />
                  ) : (
                    userItem.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-devs-blue transition-colors">
                    {userItem.name}
                  </h4>
                  <p className="text-xs text-devs-textMuted">{userItem.email}</p>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-devs-textMuted group-hover:text-devs-blue transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
