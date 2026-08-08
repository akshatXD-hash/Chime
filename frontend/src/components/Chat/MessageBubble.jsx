import React, { useState } from 'react';
import { CheckCheck, Play, Pause } from 'lucide-react';

export const MessageBubble = ({ message, isOutgoing, showSenderName, onImageClick }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImageUrl = message.content?.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || message.content?.startsWith('data:image/');
  const isAudioUrl = message.content?.match(/\.(mp3|wav|ogg|m4a)($|\?)/i) || message.content?.startsWith('data:audio/');

  return (
    <div className={`flex flex-col mb-2.5 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      {/* Sender Name for Group Chats */}
      {!isOutgoing && showSenderName && message.sender?.name && (
        <span className="text-[10px] font-semibold text-devs-indigo mb-1 ml-2 tracking-wide">
          {message.sender.name}
        </span>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative px-3.5 py-2 rounded-2xl text-xs break-words transition-all ${
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
              alt="Attachment"
              onClick={() => onImageClick && onImageClick(message.content)}
              className="w-full h-auto object-cover hover:scale-102 transition-transform duration-200"
            />
          </div>
        ) : isAudioUrl ? (
          /* Voice Message Player */
          <div className="flex items-center gap-2.5 py-0.5 min-w-[190px]">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold transition-transform active:scale-95 shadow-sm ${
                isOutgoing ? 'bg-white/20 hover:bg-white/30' : 'bg-devs-blue hover:bg-devs-blueHover'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div className="flex-1 flex items-center gap-0.5 h-5">
              {[10, 16, 8, 20, 14, 22, 9, 18, 12, 24, 10].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className={`w-0.5 rounded-full transition-all ${
                    isPlayingAudio ? 'bg-devs-cyan animate-pulse' : isOutgoing ? 'bg-white/60' : 'bg-devs-textMuted'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] opacity-75 font-mono">0:14</span>
          </div>
        ) : (
          /* Text Content */
          <p className="whitespace-pre-wrap leading-relaxed text-xs">{message.content}</p>
        )}

        {/* Timestamp & Read Status Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${
            isOutgoing ? 'text-indigo-100/80' : 'text-devs-textMuted'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            <CheckCheck className="w-3 h-3 text-cyan-200" />
          )}
        </div>
      </div>
    </div>
  );
};
