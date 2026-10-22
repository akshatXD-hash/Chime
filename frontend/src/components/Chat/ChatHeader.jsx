import { Avatar } from '../Common/Avatar';
import React from 'react';
import { useChat, areIdsEqual } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Info, ArrowLeft, Users as GroupIcon, Phone, Video } from 'lucide-react';

export const ChatHeader = ({ onToggleDetails, onBackMobile, onStartCall }) => {
  const { user } = useAuth();
  const { selectedChat, typingMap } = useChat();
  const { onlineUsers } = useSocket();

  if (!selectedChat) return null;

  const currentUserId = user?._id || user?.id;
  const isGroup = Boolean(selectedChat.isGroupChat);
  const isTyping = selectedChat._id ? typingMap[selectedChat._id] : false;

  const getTargetUser = () => {
    if (isGroup) return null;
    const usersList = Array.isArray(selectedChat.users) ? selectedChat.users.filter(Boolean) : [];
    return usersList.find((u) => !areIdsEqual(u._id || u, currentUserId)) || usersList[0] || {};
  };

  const targetUser = getTargetUser();
  const title = isGroup
    ? selectedChat.chatName || 'Group Chat'
    : targetUser?.name || targetUser?.email || 'Conversation';
  const avatarPic = isGroup ? null : targetUser?.pic;

  const isTargetOnline =
    !isGroup &&
    targetUser?._id &&
    onlineUsers.some((uid) => areIdsEqual(uid, targetUser._id));

  const membersCount = Array.isArray(selectedChat.users) ? selectedChat.users.length : 0;

  return (
    <div className="h-16 px-2 sm:px-4 gap-1 bg-devs-surface/95 border-b border-devs-border/80 flex items-center justify-between z-10 select-none flex-shrink-0">
      {/* Left: Back Button (Mobile) & Contact Info */}
      <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onBackMobile}
          className="touch-target md:hidden p-2 rounded-xl text-devs-textSecondary hover:text-white active:bg-devs-hover transition-colors flex items-center justify-center"
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
            <div className="w-full h-full bg-devs-blue flex items-center justify-center text-white">
              <GroupIcon className="w-5 h-5" />
            </div>
          ) : (
            <Avatar src={avatarPic} name={title} />
          )}
        </div>

        {/* Info */}
        <div onClick={onToggleDetails} className="min-w-0 flex-1 cursor-pointer">
          <h2 className="text-sm font-semibold text-white truncate flex items-center gap-2">
            <span className="truncate">{title}</span>
            {isGroup && (
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded bg-devs-indigo/15 text-devs-indigo font-medium flex-shrink-0">
                {membersCount} members
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
                {Array.isArray(selectedChat.users)
                  ? selectedChat.users
                      .filter(Boolean)
                      .map((u) => (u.name ? u.name.split(' ')[0] : 'User'))
                      .join(', ')
                  : 'Group'}
              </span>
            ) : isTargetOnline ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            ) : (
              <span className="text-devs-textMuted font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-devs-textMuted/60" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1 text-devs-textSecondary">
        {onStartCall && !isGroup && (
          <>
            <button
              onClick={() => onStartCall('audio')}
              title="Start Voice Call"
              className="touch-target p-2 rounded-xl hover:bg-devs-hover hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartCall('video')}
              title="Start Video Call"
              className="touch-target p-2 rounded-xl hover:bg-devs-hover hover:text-white transition-colors"
            >
              <Video className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={onToggleDetails}
          title="Conversation Details"
          className="touch-target p-2 rounded-xl hover:bg-devs-hover hover:text-white transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


