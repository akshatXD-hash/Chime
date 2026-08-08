import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Info, ArrowLeft, Users as GroupIcon } from 'lucide-react';

export const ChatHeader = ({ onToggleDetails, onBackMobile }) => {
  const { user } = useAuth();
  const { selectedChat, typingMap } = useChat();

  if (!selectedChat) return null;

  const isGroup = selectedChat.isGroupChat;
  const isTyping = typingMap[selectedChat._id];

  const getTargetUser = () => {
    if (isGroup) return null;
    return selectedChat.users?.find((u) => u._id !== user?._id) || selectedChat.users?.[0];
  };

  const targetUser = getTargetUser();
  const title = isGroup ? selectedChat.chatName : targetUser?.name || 'Conversation';
  const avatarPic = isGroup ? null : targetUser?.pic;

  return (
    <div className="h-16 px-4 bg-devs-surface/95 border-b border-devs-border/80 flex items-center justify-between z-10 select-none flex-shrink-0">
      {/* Left: Back Button (Mobile) & Contact Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBackMobile}
          className="md:hidden p-2 -ml-1 rounded-xl text-devs-textSecondary hover:text-white active:bg-devs-hover transition-colors flex items-center justify-center"
          title="Back to Chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div
          onClick={onToggleDetails}
          className="relative w-10 h-10 rounded-2xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-semibold text-devs-indigo cursor-pointer flex-shrink-0 shadow-subtle hover:border-devs-blue/50 transition-colors"
        >
          {isGroup ? (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white">
              <GroupIcon className="w-5 h-5" />
            </div>
          ) : avatarPic ? (
            <img src={avatarPic} alt={title} className="w-full h-full object-cover" />
          ) : (
            title.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div onClick={onToggleDetails} className="min-w-0 cursor-pointer">
          <h2 className="text-xs font-semibold text-white truncate flex items-center gap-2">
            <span>{title}</span>
            {isGroup && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-devs-indigo/15 text-devs-indigo font-medium">
                {selectedChat.users?.length || 0} members
              </span>
            )}
          </h2>

          <div className="text-[11px] truncate mt-0.5">
            {isTyping ? (
              <span className="text-devs-cyan font-medium flex items-center gap-1">
                <span>typing</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-devs-cyan typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-devs-cyan typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-devs-cyan typing-dot" />
                </span>
              </span>
            ) : isGroup ? (
              <span className="text-devs-textMuted">
                {selectedChat.users?.map((u) => u.name.split(' ')[0]).join(', ')}
              </span>
            ) : (
              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-devs-textSecondary">
        <button
          onClick={onToggleDetails}
          title="Conversation Details"
          className="p-2 rounded-xl hover:bg-devs-hover hover:text-white transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
