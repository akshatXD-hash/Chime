import React, { useState, useMemo } from 'react';
import { useChat, areIdsEqual } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Search, Users, MessageSquarePlus, RefreshCw, Users as GroupIcon, AlertCircle, X, MessageSquare } from 'lucide-react';

export const ChatList = ({ onOpenSearchModal, onOpenGroupModal }) => {
  const { user } = useAuth();
  const {
    chats,
    selectedChat,
    setSelectedChat,
    loadingChats,
    loadChats,
    fetchError,
    unreadMap,
  } = useChat();
  const { onlineUsers } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'groups'

  const currentUserId = user?._id || user?.id;

  // Helper to format chat display name and avatar with complete null safety
  const getSenderDetails = useMemo(() => {
    return (chat) => {
      if (!chat) {
        return { id: null, name: 'Unknown', pic: null, isGroup: false, membersCount: 0 };
      }

      if (chat.isGroupChat) {
        return {
          id: chat._id,
          name: chat.chatName || 'Unnamed Group',
          pic: null,
          isGroup: true,
          membersCount: Array.isArray(chat.users) ? chat.users.length : 0,
        };
      }

      const usersList = Array.isArray(chat.users) ? chat.users.filter(Boolean) : [];
      const otherUser =
        usersList.find((u) => !areIdsEqual(u._id || u, currentUserId)) ||
        usersList[0] ||
        {};

      return {
        id: otherUser._id || otherUser.id || null,
        name: otherUser.name || otherUser.email || 'Unknown User',
        pic: otherUser.pic || null,
        email: otherUser.email || '',
        isGroup: false,
      };
    };
  }, [currentUserId]);

  const filteredChats = useMemo(() => {
    return (Array.isArray(chats) ? chats : []).filter((chat) => {
      if (!chat) return false;
      const details = getSenderDetails(chat);
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || details.name.toLowerCase().includes(query) || (details.email && details.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterTab === 'unread') {
        return (unreadMap[chat._id] || 0) > 0;
      }
      if (filterTab === 'groups') {
        return Boolean(chat.isGroupChat);
      }
      return true;
    });
  }, [chats, searchQuery, filterTab, unreadMap, getSenderDetails]);

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-[340px] h-full bg-devs-surface/90 border-r border-devs-border/80 flex flex-col z-10 flex-shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-devs-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Messages
          </h2>
          {chats.length > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-devs-indigo/15 text-devs-indigo border border-devs-indigo/30">
              {chats.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadChats}
            disabled={loadingChats}
            title="Refresh conversations"
            className="p-2 rounded-xl text-devs-textSecondary hover:text-white hover:bg-devs-hover transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingChats ? 'animate-spin text-devs-indigo' : ''}`} />
          </button>
          <button
            onClick={onOpenGroupModal}
            title="Create Group Chat"
            className="p-2 rounded-xl text-devs-textSecondary hover:text-white hover:bg-devs-hover transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSearchModal}
            title="New Conversation"
            className="p-2 rounded-xl bg-devs-blue text-white hover:bg-devs-blueHover transition-colors shadow-subtle ml-1"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Network / Fetch Error Notice Banner with Retry */}
      {fetchError && (
        <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{fetchError}</span>
          </div>
          <button
            onClick={loadChats}
            className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-3 border-b border-devs-border/60">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-9 py-2 rounded-xl glass-input text-xs"
          />
          {searchQuery && (
            <button
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-devs-textMuted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'groups', label: 'Groups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                filterTab === tab.id
                  ? 'bg-devs-blue/20 border border-devs-blue/40 text-devs-indigo font-semibold shadow-xs'
                  : 'text-devs-textSecondary hover:text-white hover:bg-devs-hover/60 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-devs-border/30">
        {/* Loading skeleton when first loading without cached data */}
        {loadingChats && chats.length === 0 && (
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                <div className="w-11 h-11 rounded-2xl bg-devs-card/80 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-devs-card/80 rounded w-2/3" />
                  <div className="h-2.5 bg-devs-card/50 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Search / Filter State */}
        {!loadingChats && chats.length > 0 && filteredChats.length === 0 && (
          <div className="p-8 text-center text-xs text-devs-textMuted flex flex-col items-center gap-2">
            <Search className="w-7 h-7 text-devs-textMuted/40" />
            <p>{searchQuery ? `No conversations matching “${searchQuery}”` : filterTab === 'unread' ? 'You’re all caught up.' : 'No group conversations yet.'}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className="mt-1 text-devs-indigo hover:underline text-xs font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Truly Empty State (0 chats total) */}
        {!loadingChats && chats.length === 0 && (
          <div className="p-8 text-center text-xs text-devs-textMuted flex flex-col items-center gap-3 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-devs-card border border-devs-border flex items-center justify-center text-devs-indigo shadow-subtle">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">No conversations yet</h3>
              <p className="text-devs-textMuted text-[11px] max-w-xs">
                Start chatting with your team or search for users to begin a conversation.
              </p>
            </div>
            <button
              onClick={onOpenSearchModal}
              className="mt-1 px-4 py-2 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white text-xs font-semibold transition-colors shadow-subtle flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Start New Chat</span>
            </button>
          </div>
        )}

        {/* Render Chat Rows */}
        {filteredChats.map((chat) => {
          const details = getSenderDetails(chat);
          const isSelected = selectedChat && areIdsEqual(selectedChat._id, chat._id);
          const unreadCount = unreadMap[chat._id] || 0;
          const latestMsg = chat.latestMessage;

          const isUserOnline =
            !details.isGroup &&
            details.id &&
            onlineUsers.some((uid) => areIdsEqual(uid, details.id));

          return (
            <button
              type="button"
              aria-pressed={Boolean(isSelected)}
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full text-left px-4 py-4 border-l-2 border-transparent flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-devs-active !border-devs-indigo'
                  : 'hover:bg-devs-hover/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-semibold text-devs-indigo text-base shadow-subtle">
                    {details.isGroup ? (
                      <div className="w-full h-full bg-devs-blue flex items-center justify-center text-white">
                        <GroupIcon className="w-5 h-5" />
                      </div>
                    ) : details.pic ? (
                      <img src={details.pic} alt={details.name} className="w-full h-full object-cover" />
                    ) : (
                      (details.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  {!details.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-devs-surface ${
                        isUserOnline ? 'bg-emerald-500' : 'bg-devs-textMuted/40'
                      }`}
                      title={isUserOnline ? 'Online' : 'Offline'}
                    />
                  )}
                </div>

                {/* Info & Last message */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{details.name}</span>
                      {details.isGroup && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-devs-indigo/15 text-devs-indigo font-normal flex-shrink-0">
                          Group
                        </span>
                      )}
                    </h3>
                    {(latestMsg?.createdAt || chat.updatedAt) && (
                      <span className="text-[10px] text-devs-textMuted flex-shrink-0 ml-2">
                        {formatTimestamp(latestMsg?.createdAt || chat.updatedAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-devs-textSecondary truncate">
                      {latestMsg
                        ? typeof latestMsg === 'string'
                          ? latestMsg
                          : `${latestMsg.sender?.name ? latestMsg.sender.name.split(' ')[0] + ': ' : ''}${latestMsg.content?.startsWith('data:image/') || /\.(png|jpe?g|gif|webp)($|\?)/i.test(latestMsg.content || '') ? 'Image' : latestMsg.content || ''}`
                        : details.isGroup
                        ? `${details.membersCount} members`
                        : 'No messages yet'}
                    </p>

                    {unreadCount > 0 && (
                      <span className="ml-2 w-4 h-4 rounded-full bg-devs-blue text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

