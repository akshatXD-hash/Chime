import React, { useRef, useEffect, useState } from 'react';
import { useChat, areIdsEqual } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';
import { MessageCircle, X } from 'lucide-react';

export const MessageList = () => {
  const { user } = useAuth();
  const { messages, loadingMessages, selectedChat, typingMap } = useChat();
  const messagesEndRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const currentUserId = user?._id || user?.id;
  const isTyping = selectedChat?._id ? typingMap[selectedChat._id] : false;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isTyping]);

  // Group messages by date
  const getDateLabel = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-devs-bg relative selection:bg-devs-blue selection:text-white">
      {/* Background Radial Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F2942_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />

      {loadingMessages && messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs text-devs-textMuted">
          Loading conversation messages...
        </div>
      )}

      {!loadingMessages && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-devs-textMuted space-y-2 select-none">
          <div className="w-12 h-12 rounded-2xl bg-devs-card border border-devs-border flex items-center justify-center text-devs-indigo shadow-subtle mb-1">
            <MessageCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">No messages here yet</p>
          <p className="text-xs text-devs-textMuted max-w-xs text-center leading-relaxed">
            Send a message to kick off the conversation! All messages are delivered in real time.
          </p>
        </div>
      )}

      {/* Render Messages grouped by date */}
      {messages.map((message, index) => {
        const senderId = message.sender?._id || message.sender?.id || message.sender;
        const isOutgoing = areIdsEqual(senderId, currentUserId);

        // Check if date divider is needed
        const currentDateLabel = getDateLabel(message.createdAt);
        const prevMessage = messages[index - 1];
        const prevDateLabel = prevMessage ? getDateLabel(prevMessage.createdAt) : null;
        const showDateDivider = currentDateLabel && currentDateLabel !== prevDateLabel;

        return (
          <React.Fragment key={message._id || index}>
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-0.5 rounded-full bg-devs-card/90 border border-devs-border/60 text-[10px] font-medium text-devs-textSecondary shadow-subtle">
                  {currentDateLabel}
                </span>
              </div>
            )}

            <MessageBubble
              message={message}
              isOutgoing={isOutgoing}
              showSenderName={Boolean(selectedChat?.isGroupChat)}
              onImageClick={(url) => setLightboxImage(url)}
            />
          </React.Fragment>
        );
      })}

      {/* Modern Typing Indicator */}
      {isTyping && (
        <div className="flex items-center gap-2 mb-2 ml-1">
          <div className="px-3.5 py-2.5 rounded-2xl bg-devs-card border border-devs-border/70 flex items-center gap-1 shadow-subtle rounded-tl-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-devs-cyan typing-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-devs-cyan typing-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-devs-cyan typing-dot" />
          </div>
          <span className="text-[10px] text-devs-cyan font-medium tracking-wide">typing</span>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-devs-card text-white hover:bg-devs-hover border border-devs-border"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-card-dark"
          />
        </div>
      )}
    </div>
  );
};

