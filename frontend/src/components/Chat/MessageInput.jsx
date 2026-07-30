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

  // Emit typing socket event with debounce
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!socket || !selectedChat) return;

    socket.emit('typing', selectedChat._id);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', selectedChat._id);
    }, 2000);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const messageContent = text.trim();
    if (!messageContent && !attachmentPreview) return;

    setSending(true);
    try {
      if (attachmentPreview) {
        // Send image preview URL directly as message
        await sendMessage(attachmentPreview);
        setAttachmentPreview(null);
      } else {
        await sendMessage(messageContent);
        setText('');
      }
      setShowEmoji(false);

      if (socket && selectedChat) {
        socket.emit('stop-typing', selectedChat._id);
      }
    } catch (err) {
      console.error(err);
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
    <div className="p-3 bg-devs-surface border-t border-devs-border relative z-20 flex-shrink-0 select-none">
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-16 left-4 z-50 shadow-card-dark rounded-2xl overflow-hidden border border-devs-border">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Attachment Preview Drawer */}
      {attachmentPreview && (
        <div className="mb-2 p-2 rounded-xl glass-card flex items-center justify-between border border-devs-blue/40">
          <div className="flex items-center gap-3">
            <img src={attachmentPreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-devs-border" />
            <span className="text-xs font-semibold text-white">Image Ready to Send</span>
          </div>
          <button
            onClick={() => setAttachmentPreview(null)}
            className="p-1 rounded-full text-devs-textMuted hover:text-white hover:bg-devs-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Mode UI */}
      {isRecording ? (
        <div className="flex items-center justify-between px-4 py-2 bg-devs-card rounded-xl border border-red-500/30 text-white animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-400">
              Recording... {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md flex items-center gap-1.5 text-xs font-bold"
          >
            <Square className="w-4 h-4" />
            <span>Send Voice Note</span>
          </button>
        </div>
      ) : (
        /* Normal Message Input Form */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 rounded-xl transition-colors ${
              showEmoji ? 'text-devs-blue bg-devs-blue/15' : 'text-devs-textSecondary hover:text-white hover:bg-devs-hover'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-devs-textSecondary hover:text-white hover:bg-devs-hover transition-colors"
          >
            <Paperclip className="w-5 h-5" />
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
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none"
          />

          {/* Send or Voice Record Button */}
          {text.trim() || attachmentPreview ? (
            <button
              type="submit"
              disabled={sending}
              className="p-3 rounded-xl devs-gradient-btn text-white transition-all shadow-glow-blue disabled:opacity-50 flex items-center justify-center"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-3 rounded-xl bg-devs-card hover:bg-devs-hover border border-devs-border text-devs-cyan hover:text-white transition-all"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};
