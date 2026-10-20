import React, { useState, useEffect, useRef } from 'react';
import { userApi } from '../../api/userApi';
import { useChat } from '../../context/ChatContext';
import { Search, X, UserPlus, Loader2, MessageSquare } from 'lucide-react';

export const UserSearchModal = ({ isOpen, onClose }) => {
  const { accessChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingUserId, setSelectingUserId] = useState(null);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);
  const debounceTimeoutRef = useRef(null);

  const fetchUsers = async (query = '') => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const results = await userApi.searchUsers(query);
      if (request !== requestRef.current) return;
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      if (request === requestRef.current) setError(err.message || 'Failed to fetch users');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setError(null);
      setSelectingUserId(null);
      fetchUsers('');
    }
    return () => {
      ++requestRef.current;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQueryChange = (e) => {
    const query = e.target.value;
    ++requestRef.current;
    setSearchResults([]);
    setLoading(true);
    setSearchQuery(query);
    setError(null);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchUsers(query);
    }, 250);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    fetchUsers(searchQuery);
  };

  const handleSelectUser = async (userId) => {
    if (selectingUserId) return;
    setSelectingUserId(userId);
    setError(null);
    try {
      await accessChat(userId);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not start conversation. Please try again.');
    } finally {
      setSelectingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75  flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-devs-surface border-t sm:border border-devs-border/80 rounded-t-3xl sm:rounded-3xl shadow-card-dark p-5 sm:p-6 overflow-hidden relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-devs-border/80 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-devs-indigo" />
            <h3 className="text-sm font-bold text-white">Start New Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleFormSubmit} className="mb-3.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleQueryChange}
              placeholder="Search people by name or email..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs"
              autoFocus
            />
            {loading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-devs-indigo animate-spin" />
              </div>
            )}
          </div>
        </form>

        {/* Search Results */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {error && (
            <div className="p-2.5 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium text-center">
              {error}
            </div>
          )}

          {!loading && searchResults.length === 0 && (
            <p className="text-center text-xs text-devs-textMuted py-8">
              {searchQuery.trim() ? 'No users found matching your search' : 'No users available'}
            </p>
          )}

          {searchResults.map((userItem) => {
            const isSelecting = selectingUserId === userItem._id;
            return (
              <div
                key={userItem._id}
                onClick={() => handleSelectUser(userItem._id)}
                className={`flex items-center justify-between p-2.5 rounded-xl glass-card hover:border-devs-indigo/50 cursor-pointer transition-all group ${
                  isSelecting ? 'opacity-70 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-devs-indigo text-xs shadow-subtle flex-shrink-0">
                    {userItem.pic ? (
                      <img src={userItem.pic} alt={userItem.name} className="w-full h-full object-cover" />
                    ) : (
                      (userItem.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white group-hover:text-devs-indigo transition-colors truncate">
                      {userItem.name}
                    </h4>
                    <p className="text-[10px] text-devs-textMuted truncate">{userItem.email}</p>
                  </div>
                </div>
                {isSelecting ? (
                  <Loader2 className="w-4 h-4 text-devs-indigo animate-spin" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-devs-textMuted group-hover:text-devs-indigo transition-colors flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

