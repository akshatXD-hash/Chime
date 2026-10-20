import React, { memo } from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

export const MessageBubble = memo(({ message, isOutgoing, isRead, showSenderName, onImageClick }) => {

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };


  const isImageUrl = message.content?.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || message.content?.startsWith('data:image/');
  const isAudioUrl = message.content?.match(/\.(mp3|wav|ogg|m4a)($|\?)/i) || message.content?.startsWith('data:audio/');

  return (
    <div data-message-id={message._id} className={`flex flex-col mb-2.5 max-w-[88%] sm:max-w-[78%] md:max-w-[65%] ${isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      {/* Sender Name for Group Chats */}
      {!isOutgoing && showSenderName && message.sender?.name && (
        <span className="text-[10px] font-semibold text-devs-indigo mb-1 ml-2 tracking-wide">
          {message.sender.name}
        </span>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative px-3.5 py-2 rounded-2xl text-sm min-w-0 [overflow-wrap:anywhere] ${
          isOutgoing
            ? 'bubble-outgoing rounded-tr-xs'
            : 'bubble-incoming rounded-tl-xs'
        }`}
      >
        {/* Image Attachment */}
        {isImageUrl ? (
          <div className="mb-1 rounded-xl overflow-hidden cursor-pointer max-w-xs border border-white/10 shadow-subtle">
            <img
              src={message.content}
              alt="Image attachment"
              loading="lazy"
              decoding="async"
              onClick={() => onImageClick && onImageClick(message.content)}
              className="w-full h-auto object-cover hover:scale-102 transition-transform duration-200"
            />
          </div>
        ) : isAudioUrl ? (
          <audio controls preload="none" src={message.content} aria-label="Audio message" className="max-w-full w-64" />
        ) : (
          /* Text Content */
          <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
        )}

        {/* Timestamp & Read Status Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] ${
            isOutgoing ? 'text-indigo-100/80' : 'text-devs-textMuted'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            <span title={message.isOptimistic ? 'Sending' : isRead ? 'Read' : 'Sent'}>
              {message.isOptimistic ? <Clock aria-label="Sending" className="w-3.5 h-3.5" /> : isRead
                ? <CheckCheck aria-label="Read" className="w-3.5 h-3.5 text-sky-400" />
                : <Check aria-label="Sent" className="w-3.5 h-3.5 text-slate-300" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
