import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../api/chatApi';
import { userApi } from '../../api/userApi';
import { X, ShieldCheck, UserPlus, UserMinus, Edit2, Check, Users as GroupIcon, Mail, Info } from 'lucide-react';

export const ChatDetailsSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedChat, setSelectedChat, setChats } = useChat();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !selectedChat) return null;

  const isGroup = selectedChat.isGroupChat;
  const isAdmin = isGroup && selectedChat.groupAdmin?._id === user?._id;

  const getTargetUser = () => {
    if (isGroup) return null;
    return selectedChat.users?.find((u) => u._id !== user?._id) || selectedChat.users?.[0];
  };

  const targetUser = getTargetUser();

  // Rename Group Handler
  const handleRenameGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const updatedChat = await chatApi.renameGroup(selectedChat._id, newGroupName);
      setSelectedChat(updatedChat);
      setChats((prev) => prev.map((c) => (c._id === updatedChat._id ? updatedChat : c)));
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Member Handler
  const handleRemoveMember = async (userId) => {
    try {
      const updatedChat = await chatApi.removeFromGroup(selectedChat._id, userId);
      setSelectedChat(updatedChat);
      setChats((prev) => prev.map((c) => (c._id === updatedChat._id ? updatedChat : c)));
    } catch (err) {
      console.error(err);
    }
  };

  // Add Member Search & Action
  const handleSearchUser = async (query) => {
    setSearchUserQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await userApi.searchUsers(query);
      // Filter out existing members
      const existingIds = new Set(selectedChat.users.map((u) => u._id));
      setSearchResults(results.filter((u) => !existingIds.has(u._id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const updatedChat = await chatApi.addToGroup(selectedChat._id, userId);
      setSelectedChat(updatedChat);
      setChats((prev) => prev.map((c) => (c._id === updatedChat._id ? updatedChat : c)));
      setShowAddMember(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200" 
      />

      <div className="fixed md:static inset-y-0 right-0 z-40 w-full sm:w-80 md:w-96 h-full bg-devs-surface/95 border-l border-devs-border/80 flex flex-col flex-shrink-0 select-none animate-in slide-in-from-right duration-200 shadow-card-dark md:shadow-none">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-devs-border/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-devs-indigo" />
            <span>{isGroup ? 'Group Information' : 'Contact Details'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-devs-textMuted hover:text-white hover:bg-devs-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Avatar & Main Info */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-xl text-devs-indigo shadow-subtle mb-3">
            {isGroup ? (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white">
                <GroupIcon className="w-10 h-10" />
              </div>
            ) : targetUser?.pic ? (
              <img src={targetUser.pic} alt={targetUser.name} className="w-full h-full object-cover" />
            ) : (
              targetUser?.name?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Title / Rename */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5 w-full mt-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
              />
              <button
                onClick={handleRenameGroup}
                className="p-1.5 rounded-xl bg-devs-blue text-white hover:bg-devs-blueHover"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-base font-bold text-white">{isGroup ? selectedChat.chatName : targetUser?.name}</h2>
              {isGroup && isAdmin && (
                <button
                  onClick={() => {
                    setNewGroupName(selectedChat.chatName);
                    setIsEditingName(true);
                  }}
                  className="text-devs-textMuted hover:text-devs-indigo p-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-devs-textMuted mt-0.5">
            {isGroup ? `${selectedChat.users?.length} members` : targetUser?.email}
          </p>
        </div>

        {/* Group Members Section */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-semibold text-devs-textSecondary uppercase tracking-wider">
                Members ({selectedChat.users?.length})
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-xs text-devs-indigo hover:text-devs-violet font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Add Member Search Input */}
            {showAddMember && (
              <div className="mb-3 space-y-2">
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => handleSearchUser(e.target.value)}
                  placeholder="Search user to add..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {searchResults.map((userItem) => (
                    <div
                      key={userItem._id}
                      onClick={() => handleAddMember(userItem._id)}
                      className="flex items-center justify-between p-2 rounded-xl glass-card hover:border-devs-indigo/40 cursor-pointer text-xs"
                    >
                      <span className="text-white font-medium">{userItem.name}</span>
                      <UserPlus className="w-3.5 h-3.5 text-devs-indigo" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {selectedChat.users?.map((member) => {
                const isMemberAdmin = selectedChat.groupAdmin?._id === member._id;
                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-2 rounded-xl glass-card border border-devs-border/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-xs text-devs-indigo flex-shrink-0">
                        {member.pic ? (
                          <img src={member.pic} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-white truncate flex items-center gap-1">
                          {member.name}
                          {member._id === user?._id && <span className="text-[10px] text-devs-textMuted">(You)</span>}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isMemberAdmin && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {isAdmin && member._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-1 rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          title="Remove Member"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
