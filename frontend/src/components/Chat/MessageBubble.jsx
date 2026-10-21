import { Avatar } from '../Common/Avatar';
import React, { memo } from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

export const MessageBubble = memo(({ message, isOutgoing, isRead, isDelivered, startsRun, senderName, showSenderName, onImageClick }) => {

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
    <div data-message-id={message._id} data-direction={isOutgoing ? 'outgoing' : 'incoming'} className={`message-row flex w-full min-w-0 flex-col ${startsRun ? 'mt-6' : 'mt-2'} ${isOutgoing ? 'items-end' : 'items-start'}`}>
      {showSenderName && (
        <div className="mb-1.5 flex items-center gap-2 text-xs text-devs-textSecondary">
          {!isOutgoing && <span className="h-6 w-6 overflow-hidden rounded-full"><Avatar src={message.sender?.pic} name={senderName} /></span>}
          <span className="font-semibold">{isOutgoing ? 'You' : senderName}</span>
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl text-sm min-w-0 [overflow-wrap:anywhere] ${
          isOutgoing
            ? 'bubble-outgoing rounded-br-md'
            : 'bubble-incoming rounded-bl-md'
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
          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>
        )}

        {/* Timestamp & Read Status Ticks */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[11px] ${
            isOutgoing ? 'text-indigo-100/80' : 'text-devs-textMuted'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            <span title={message.isOptimistic ? 'Sending' : isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}>
              {message.isOptimistic ? <Clock aria-label="Sending" className="w-4 h-4" /> : isRead
                ? <CheckCheck aria-label="Read" className="w-4 h-4 text-sky-400" />
                : isDelivered ? <CheckCheck aria-label="Delivered" className="w-4 h-4 text-slate-300" />
                : <Check aria-label="Sent" className="w-4 h-4 text-slate-300" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
