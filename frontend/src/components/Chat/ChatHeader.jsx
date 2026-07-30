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
  const title = isGroup ? selectedChat.chatName : targetUser?.name || 'Chat';
  const avatarPic = isGroup ? null : targetUser?.pic;

  return (
    <div className="h-16 px-4 bg-devs-surface border-b border-devs-border flex items-center justify-between z-10 select-none flex-shrink-0">
      {/* Left: Back Button (Mobile) & Contact Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBackMobile}
          className="md:hidden p-1.5 rounded-lg text-devs-textSecondary hover:text-white hover:bg-devs-hover"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div
          onClick={onToggleDetails}
          className="relative w-10 h-10 rounded-xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-devs-blue cursor-pointer flex-shrink-0"
        >
          {isGroup ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
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
          <h2 className="text-sm font-bold text-white truncate flex items-center gap-2">
            {title}
            {isGroup && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-devs-blue/20 text-devs-cyan font-normal">
                {selectedChat.users?.length || 0} members
              </span>
            )}
          </h2>

          <p className="text-xs truncate">
            {isTyping ? (
              <span className="text-devs-cyan font-medium animate-pulse">typing...</span>
            ) : isGroup ? (
              <span className="text-devs-textMuted">
                {selectedChat.users?.map((u) => u.name.split(' ')[0]).join(', ')}
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Online</span>
            )}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-devs-textSecondary">
        <button
          onClick={onToggleDetails}
          title="Chat Information"
          className="p-2.5 rounded-xl hover:bg-devs-hover hover:text-white transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
