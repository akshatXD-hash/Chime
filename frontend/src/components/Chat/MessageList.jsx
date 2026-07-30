import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';
import { MessageSquare, X } from 'lucide-react';

export const MessageList = () => {
  const { user } = useAuth();
  const { messages, loadingMessages, selectedChat, typingMap } = useChat();
  const messagesEndRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const isTyping = selectedChat ? typingMap[selectedChat._id] : false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Group messages by date
  const getDateLabel = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
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
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-devs-bg relative selection:bg-devs-blue selection:text-white">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#202B42_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {loadingMessages && (
        <div className="flex items-center justify-center h-full text-xs text-devs-textMuted">
          Loading conversation messages...
        </div>
      )}

      {!loadingMessages && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-devs-textMuted space-y-2 select-none">
          <div className="w-12 h-12 rounded-2xl bg-devs-card border border-devs-border flex items-center justify-center text-devs-blue shadow-glow-blue mb-2">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">No messages here yet</p>
          <p className="text-xs text-devs-textMuted max-w-xs text-center">
            Say hi to start the conversation! Your messages are encrypted & real-time.
          </p>
        </div>
      )}

      {/* Render Messages grouped by date */}
      {messages.map((message, index) => {
        const isOutgoing = message.sender?._id === user?._id;

        // Check if date divider is needed
        const currentDateLabel = getDateLabel(message.createdAt);
        const prevMessage = messages[index - 1];
        const prevDateLabel = prevMessage ? getDateLabel(prevMessage.createdAt) : null;
        const showDateDivider = currentDateLabel !== prevDateLabel;

        return (
          <React.Fragment key={message._id || index}>
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 rounded-full bg-devs-card border border-devs-border text-[11px] font-semibold text-devs-textSecondary shadow-sm">
                  {currentDateLabel}
                </span>
              </div>
            )}

            <MessageBubble
              message={message}
              isOutgoing={isOutgoing}
              showSenderName={selectedChat?.isGroupChat}
              onImageClick={(url) => setLightboxImage(url)}
            />
          </React.Fragment>
        );
      })}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex items-center gap-2 text-devs-textMuted text-xs mb-2 ml-2 animate-fade-in">
          <div className="px-3 py-2 rounded-xl bg-devs-card border border-devs-border flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-devs-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-devs-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-devs-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] text-devs-cyan">typing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-devs-card text-white hover:bg-devs-hover"
          >
            <X className="w-6 h-6" />
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
