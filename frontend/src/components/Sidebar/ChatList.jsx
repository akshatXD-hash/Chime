import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Users, MessageSquarePlus, RefreshCw, Users as GroupIcon } from 'lucide-react';

export const ChatList = ({ onOpenSearchModal, onOpenGroupModal }) => {
  const { user } = useAuth();
  const { chats, selectedChat, setSelectedChat, loadingChats, loadChats, unreadMap } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'groups'

  // Helper to format chat display name and avatar
  const getSenderDetails = (chat) => {
    if (chat.isGroupChat) {
      return {
        name: chat.chatName,
        pic: null,
        isGroup: true,
        membersCount: chat.users?.length || 0,
      };
    }
    const otherUser = chat.users?.find((u) => u._id !== user?._id) || chat.users?.[0];
    return {
      name: otherUser?.name || 'Unknown User',
      pic: otherUser?.pic,
      email: otherUser?.email,
      isGroup: false,
    };
  };

  const filteredChats = chats.filter((chat) => {
    const details = getSenderDetails(chat);
    const matchesSearch = details.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'unread') {
      return (unreadMap[chat._id] || 0) > 0;
    }
    if (filterTab === 'groups') {
      return chat.isGroupChat;
    }
    return true;
  });

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-80 lg:w-96 h-full bg-devs-surface/90 border-r border-devs-border/80 flex flex-col z-10 flex-shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-devs-border/80 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Messages
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={loadChats}
            title="Refresh conversation list"
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

      {/* Search Input Bar */}
      <div className="p-3 border-b border-devs-border/60">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-devs-textMuted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
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
                  ? 'bg-devs-blue/20 border border-devs-blue/40 text-devs-indigo font-semibold'
                  : 'text-devs-textSecondary hover:text-white hover:bg-devs-hover/60 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-devs-border/30">
        {loadingChats && chats.length === 0 && (
          <div className="p-8 text-center text-xs text-devs-textMuted">Loading conversations...</div>
        )}

        {!loadingChats && filteredChats.length === 0 && (
          <div className="p-8 text-center text-xs text-devs-textMuted flex flex-col items-center gap-2">
            <GroupIcon className="w-8 h-8 text-devs-textMuted/40" />
            <p>No conversations found</p>
            <button
              onClick={onOpenSearchModal}
              className="mt-1 text-devs-indigo hover:underline text-xs font-semibold"
            >
              Start a new conversation
            </button>
          </div>
        )}

        {filteredChats.map((chat) => {
          const details = getSenderDetails(chat);
          const isSelected = selectedChat?._id === chat._id;
          const unreadCount = unreadMap[chat._id] || 0;
          const latestMsg = chat.latestMessage;

          return (
            <div
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-devs-active border-l-2 border-devs-indigo'
                  : 'hover:bg-devs-hover/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-semibold text-devs-indigo text-base shadow-subtle">
                    {details.isGroup ? (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white">
                        <GroupIcon className="w-5 h-5" />
                      </div>
                    ) : details.pic ? (
                      <img src={details.pic} alt={details.name} className="w-full h-full object-cover" />
                    ) : (
                      details.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                {/* Info & Last message */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      {details.name}
                      {details.isGroup && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-devs-indigo/15 text-devs-indigo font-normal">
                          Group
                        </span>
                      )}
                    </h3>
                    {latestMsg && (
                      <span className="text-[10px] text-devs-textMuted flex-shrink-0 ml-2">
                        {formatTimestamp(latestMsg.createdAt || chat.updatedAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[11px] text-devs-textSecondary truncate max-w-[180px]">
                      {latestMsg
                        ? `${latestMsg.sender?.name ? latestMsg.sender.name.split(' ')[0] + ': ' : ''}${latestMsg.content}`
                        : details.isGroup
                        ? `${details.membersCount} members`
                        : 'No messages yet'}
                    </p>

                    {unreadCount > 0 && (
                      <span className="ml-2 w-4 h-4 rounded-full bg-devs-blue text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
