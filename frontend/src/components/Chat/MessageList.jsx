import { useReadReceipts } from '../../hooks/useReadReceipts';
import React, { useRef, useEffect, useState } from 'react';
import { useChat, areIdsEqual } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { isMessageRead, isMessageDelivered } from '../../utils/messageReceipts';
import { MessageBubble } from './MessageBubble';
import { MessageCircle, X, ArrowDown } from 'lucide-react';

export const MessageList = () => {
  const { user } = useAuth();
  const { messages, loadingMessages, selectedChat, typingMap, messageError, retryMessages, markMessagesRead } = useChat();
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const nearBottomRef = useRef(true);
  const firstScrollRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const currentUserId = user?._id || user?.id;
  const isTyping = selectedChat?._id ? typingMap[selectedChat._id] : false;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    firstScrollRef.current = true;
    nearBottomRef.current = true;
    setShowJump(false);
    setLightboxImage(null);
  }, [selectedChat?._id]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const ownMessage = last?.isOptimistic;
    if (firstScrollRef.current || nearBottomRef.current || ownMessage) {
      scrollToBottom(!firstScrollRef.current);
      if (messages.length) firstScrollRef.current = false;
    } else {
      setShowJump(true);
    }
  }, [messages.length, isTyping, selectedChat?._id]);

  useEffect(() => {
    if (!lightboxImage) return;
    const close = (event) => { if (event.key === 'Escape') setLightboxImage(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [lightboxImage]);

  useReadReceipts({ messages, chatId: selectedChat?._id, userId: currentUserId,
    rootRef: scrollRef, markRead: markMessagesRead, paused: Boolean(lightboxImage) });

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
    <div ref={scrollRef} onScroll={() => {
      const node = scrollRef.current;
      nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100;
      if (nearBottomRef.current) setShowJump(false);
    }} onLoadCapture={() => { if (nearBottomRef.current) scrollToBottom(false); }} className="message-list flex-1 min-h-0 overflow-y-auto px-4 py-5 md:px-8 bg-devs-bg relative selection:bg-devs-blue selection:text-white" aria-label="Conversation messages" aria-busy={loadingMessages}>
      {loadingMessages && messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs text-devs-textMuted">
          Loading conversation messages...
        </div>
      )}

      {messageError && (<div role="alert" className="relative p-3 rounded-xl border border-amber-500/30 text-sm text-amber-200">{messageError}<button onClick={retryMessages} className="ml-3 underline">Retry</button></div>)}

      {!loadingMessages && !messageError && messages.length === 0 && (
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
        const startsRun = !prevMessage || showDateDivider || !areIdsEqual(prevMessage.sender, senderId) ||
          new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000;

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
              isDelivered={isMessageDelivered(message, selectedChat?.users)}
              isRead={isMessageRead(message, selectedChat?.users)}
              startsRun={startsRun}
              showSenderName={startsRun}
              senderName={message.sender?.name || selectedChat?.users?.find((member) => areIdsEqual(member, senderId))?.name || 'Unknown sender'}
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
      {showJump && <button onClick={() => { nearBottomRef.current = true; scrollToBottom(); setShowJump(false); }} className="sticky bottom-2 mx-auto flex items-center gap-2 rounded-full bg-devs-blue px-4 py-2 text-sm text-white shadow-lg"><ArrowDown size={16} />Latest messages</button>}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90  flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <button
            aria-label="Close image preview"
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

