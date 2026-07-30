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
    <div className="w-80 h-full bg-devs-surface border-l border-devs-border flex flex-col z-20 flex-shrink-0 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-devs-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-devs-blue" />
          <span>{isGroup ? 'Group Information' : 'Contact Details'}</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Avatar & Main Info */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-3xl bg-devs-card border-2 border-devs-border overflow-hidden flex items-center justify-center font-bold text-2xl text-devs-blue shadow-glow-blue mb-4">
            {isGroup ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
                <GroupIcon className="w-12 h-12" />
              </div>
            ) : targetUser?.pic ? (
              <img src={targetUser.pic} alt={targetUser.name} className="w-full h-full object-cover" />
            ) : (
              targetUser?.name?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Title / Rename */}
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full mt-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
              />
              <button
                onClick={handleRenameGroup}
                className="p-2 rounded-lg bg-devs-blue text-white hover:bg-devs-blueHover"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{isGroup ? selectedChat.chatName : targetUser?.name}</h2>
              {isGroup && isAdmin && (
                <button
                  onClick={() => {
                    setNewGroupName(selectedChat.chatName);
                    setIsEditingName(true);
                  }}
                  className="text-devs-textMuted hover:text-devs-blue"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-devs-textMuted mt-1">
            {isGroup ? `${selectedChat.users?.length} members` : targetUser?.email}
          </p>
        </div>

        {/* Group Members Section */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-devs-textSecondary uppercase tracking-wider">
                Group Members ({selectedChat.users?.length})
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-xs text-devs-blue hover:text-devs-cyan font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
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
                      className="flex items-center justify-between p-2 rounded-lg glass-card hover:border-devs-blue/50 cursor-pointer text-xs"
                    >
                      <span className="text-white font-medium">{userItem.name}</span>
                      <UserPlus className="w-3.5 h-3.5 text-devs-blue" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedChat.users?.map((member) => {
                const isMemberAdmin = selectedChat.groupAdmin?._id === member._id;
                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-2.5 rounded-xl glass-card border border-devs-border/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-xs text-devs-blue">
                        {member.pic ? (
                          <img src={member.pic} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-white flex items-center gap-1">
                          {member.name}
                          {member._id === user?._id && <span className="text-[10px] text-devs-textMuted">(You)</span>}
                        </h5>
                        <p className="text-[10px] text-devs-textMuted">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isMemberAdmin && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {isAdmin && member._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-1 rounded-md text-red-400 hover:bg-red-500/20 hover:text-red-300"
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
  );
};
