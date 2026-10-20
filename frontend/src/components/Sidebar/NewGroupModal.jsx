import { useDialog } from '../../hooks/useDialog';
import React, { useState, useEffect, useRef } from 'react';
import { userApi } from '../../api/userApi';
import { useChat, areIdsEqual } from '../../context/ChatContext';
import { Users, X, Search, Check, Loader2 } from 'lucide-react';

export const NewGroupModal = ({ isOpen, onClose }) => {
  const { createGroupChat } = useChat();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError(null);
    }
    return () => {
      ++requestRef.current;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen]);

  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleSearch = (query) => {
    const request = ++requestRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(false);
    setSearchQuery(query);
    setError(null);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await userApi.searchUsers(query);
        if (request !== requestRef.current) return;
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        if (request === requestRef.current) setError(err.message || 'Could not search people');
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    }, 250);
  };

  const toggleSelectUser = (userItem) => {
    setError(null);
    if (selectedUsers.some((u) => areIdsEqual(u._id, userItem._id))) {
      setSelectedUsers(selectedUsers.filter((u) => !areIdsEqual(u._id, userItem._id)));
    } else {
      setSelectedUsers([...selectedUsers, userItem]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length < 1) {
      setError('Please add at least 1 member to the group');
      return;
    }

    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const userIds = selectedUsers.map((u) => u._id);
      await createGroupChat(groupName.trim(), userIds);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75  flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Create group" tabIndex={-1} className="max-h-[90dvh] overflow-y-auto w-full max-w-md bg-devs-surface border-t sm:border border-devs-border/80 rounded-t-3xl sm:rounded-3xl shadow-card-dark p-5 sm:p-6 overflow-hidden relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3.5 border-b border-devs-border/80 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-devs-indigo" />
            <h3 className="text-sm font-bold text-white">Create Group Chat</h3>
          </div>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          {/* Group Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Engineering Team"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1">
                Members ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                {selectedUsers.map((u) => (
                  <span
                    key={u._id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-devs-indigo/15 border border-devs-indigo/30 text-xs text-devs-indigo font-medium"
                  >
                    {u.name}
                    <button
                      onClick={() => toggleSelectUser(u)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search Members Input */}
          <div>
            <label className="block text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider mb-1">
              Add People
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users to add..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
              />
              {loading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-indigo animate-spin" />
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {searchResults.map((userItem) => {
              const isSelected = selectedUsers.some((u) => areIdsEqual(u._id, userItem._id));
              return (
                <div
                  key={userItem._id}
                  onClick={() => toggleSelectUser(userItem)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-devs-indigo/15 border-devs-indigo/40'
                      : 'glass-card border-transparent hover:border-devs-border'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-xs text-devs-indigo flex-shrink-0">
                      {userItem.pic ? (
                        <img src={userItem.pic} alt={userItem.name} className="w-full h-full object-cover" />
                      ) : (
                        (userItem.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{userItem.name}</h4>
                      <p className="text-[10px] text-devs-textMuted truncate">{userItem.email}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-devs-indigo flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length < 1}
            className="w-full py-2.5 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-1 shadow-subtle"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

