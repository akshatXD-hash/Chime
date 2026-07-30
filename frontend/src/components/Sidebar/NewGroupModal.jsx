import React, { useState } from 'react';
import { userApi } from '../../api/userApi';
import { useChat } from '../../context/ChatContext';
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

  if (!isOpen) return null;

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await userApi.searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (userItem) => {
    if (selectedUsers.some((u) => u._id === userItem._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== userItem._id));
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

    setCreating(true);
    setError(null);
    try {
      const userIds = selectedUsers.map((u) => u._id);
      await createGroupChat(groupName, userIds);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-devs-border shadow-card-dark p-6 overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-devs-border mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-devs-blue" />
            <h3 className="text-lg font-bold text-white">Create Group Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Group Subject
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. 100xDevs Cohort 3"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
                Selected Members ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                {selectedUsers.map((u) => (
                  <span
                    key={u._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-devs-blue/20 border border-devs-blue/40 text-xs text-devs-cyan font-medium"
                  >
                    {u.name}
                    <button
                      onClick={() => toggleSelectUser(u)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search Members Input */}
          <div>
            <label className="block text-xs font-semibold text-devs-textSecondary uppercase tracking-wider mb-1.5">
              Add Members
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users to add..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
              {loading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-blue animate-spin" />
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {searchResults.map((userItem) => {
              const isSelected = selectedUsers.some((u) => u._id === userItem._id);
              return (
                <div
                  key={userItem._id}
                  onClick={() => toggleSelectUser(userItem)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-devs-blue/15 border-devs-blue'
                      : 'glass-card border-transparent hover:border-devs-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-xs text-devs-blue">
                      {userItem.pic ? (
                        <img src={userItem.pic} alt={userItem.name} className="w-full h-full object-cover" />
                      ) : (
                        userItem.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{userItem.name}</h4>
                      <p className="text-[10px] text-devs-textMuted">{userItem.email}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-devs-blue" />}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length < 1}
            className="w-full py-3 rounded-xl devs-gradient-btn text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
