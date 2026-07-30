import React, { useState } from 'react';
import { Check, CheckCheck, Play, Pause, FileText, Image as ImageIcon } from 'lucide-react';

export const MessageBubble = ({ message, isOutgoing, showSenderName, onImageClick }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if content is audio or image URL format
  const isImageUrl = message.content?.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || message.content?.startsWith('data:image/');
  const isAudioUrl = message.content?.match(/\.(mp3|wav|ogg|m4a)($|\?)/i) || message.content?.startsWith('data:audio/');

  return (
    <div className={`flex flex-col mb-3 max-w-[85%] md:max-w-[70%] ${isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      {/* Sender Name for Group Chats */}
      {!isOutgoing && showSenderName && message.sender?.name && (
        <span className="text-[11px] font-semibold text-devs-cyan mb-1 ml-3">
          {message.sender.name}
        </span>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words transition-all ${
          isOutgoing
            ? 'bubble-outgoing rounded-br-none'
            : 'bubble-incoming rounded-bl-none'
        }`}
      >
        {/* Image Attachment */}
        {isImageUrl ? (
          <div className="mb-1 rounded-xl overflow-hidden cursor-pointer max-w-xs border border-white/10">
            <img
              src={message.content}
              alt="Attachment"
              onClick={() => onImageClick && onImageClick(message.content)}
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        ) : isAudioUrl ? (
          /* Voice Message Player */
          <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-transform active:scale-95 ${
                isOutgoing ? 'bg-white/20 hover:bg-white/30' : 'bg-devs-blue hover:bg-devs-blueHover'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1 flex items-center gap-1">
              {[12, 18, 10, 22, 15, 24, 8, 19, 14, 25, 11].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className={`w-1 rounded-full ${
                    isPlayingAudio ? 'bg-devs-cyan animate-pulse' : isOutgoing ? 'bg-white/50' : 'bg-devs-textMuted'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] opacity-80 font-mono">0:14</span>
          </div>
        ) : (
          /* Text Content */
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}

        {/* Timestamp & Read Status Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
            isOutgoing ? 'text-blue-200' : 'text-devs-textMuted'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            <CheckCheck className="w-3.5 h-3.5 text-devs-cyan" />
          )}
        </div>
      </div>
    </div>
  );
};
