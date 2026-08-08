import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Smile, Paperclip, Send, Mic, Square, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { authApi } from '../../api/authApi';

export const MessageInput = () => {
  const { sendMessage, selectedChat } = useChat();
  const { socket } = useSocket();

  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [sending, setSending] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const timerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const isTypingEmittedRef = useRef(false);

  // Emit typing socket event with debounce
  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!socket || !selectedChat) return;

    if (value.trim() && !isTypingEmittedRef.current) {
      socket.emit('typing', selectedChat._id);
      isTypingEmittedRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedChat) {
        socket.emit('stop-typing', selectedChat._id);
      }
      isTypingEmittedRef.current = false;
    }, 1200);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const messageContent = text.trim();
    const attachment = attachmentPreview;
    if (!messageContent && !attachment) return;

    // Reset input fields immediately so user input box clears upfront
    setText('');
    setAttachmentPreview(null);
    setShowEmoji(false);

    if (socket && selectedChat) {
      socket.emit('stop-typing', selectedChat._id);
    }
    isTypingEmittedRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);
    try {
      if (attachment) {
        await sendMessage(attachment);
      }
      if (messageContent) {
        await sendMessage(messageContent);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Image Upload Handler
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use Cloudinary upload avatar endpoint or FileReader fallback
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await authApi.uploadAvatar(formData);
      setAttachmentPreview(res.url);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Note Recorder Controls
  const startRecording = () => {
    setIsRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Simulated voice note send
    const simulatedAudioUrl = 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg';
    sendMessage(simulatedAudioUrl);
  };

  return (
    <div className="p-3 bg-devs-surface/95 border-t border-devs-border/80 relative z-20 flex-shrink-0 select-none">
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-16 left-3 z-50 shadow-card-dark rounded-2xl overflow-hidden border border-devs-border">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            width={310}
            height={360}
          />
        </div>
      )}

      {/* Attachment Preview Drawer */}
      {attachmentPreview && (
        <div className="mb-2 p-2 rounded-xl glass-card flex items-center justify-between border border-devs-indigo/30">
          <div className="flex items-center gap-2.5">
            <img src={attachmentPreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-devs-border" />
            <span className="text-xs font-medium text-white">Attachment ready</span>
          </div>
          <button
            onClick={() => setAttachmentPreview(null)}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Mode UI */}
      {isRecording ? (
        <div className="flex items-center justify-between px-4 py-2 bg-devs-card rounded-xl border border-red-500/30 text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-medium text-red-400">
              Recording {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Send Voice</span>
          </button>
        </div>
      ) : (
        /* Normal Message Input Form */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2 rounded-xl transition-colors ${
              showEmoji ? 'text-devs-indigo bg-devs-indigo/15' : 'text-devs-textSecondary hover:text-white hover:bg-devs-hover'
            }`}
            title="Emoji Picker"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-devs-textSecondary hover:text-white hover:bg-devs-hover transition-colors"
            title="Attach File"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Main Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Write a message..."
            className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs focus:outline-none"
          />

          {/* Send or Voice Record Button */}
          {text.trim() || attachmentPreview ? (
            <button
              type="submit"
              disabled={sending}
              className="p-2.5 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white transition-all disabled:opacity-50 flex items-center justify-center shadow-subtle"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2.5 rounded-xl bg-devs-card hover:bg-devs-hover border border-devs-border text-devs-textSecondary hover:text-white transition-colors"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};
