import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { Smile, Paperclip, Send, X, Loader2 } from 'lucide-react';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

export const MessageInput = () => {
  const { sendMessage, selectedChat, draftsRef } = useChat();
  const { socket } = useSocket();
  const chatId = selectedChat._id;
  const [text, setText] = useState(() => draftsRef.current.get(chatId)?.text || '');
  const [attachment, setAttachment] = useState(() => draftsRef.current.get(chatId)?.attachment || null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const typingRef = useRef(null);
  const busyRef = useRef(false);
  const readerRef = useRef(null);

  useEffect(() => {
    draftsRef.current.set(chatId, { text, attachment });
  }, [text, attachment, chatId, draftsRef]);

  useEffect(() => {
    return () => {
      clearTimeout(typingRef.current);
      socket?.emit('stop-typing', chatId);
      readerRef.current?.abort();
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight + 2, 144)}px`;
    inputRef.current.style.overflowY = inputRef.current.scrollHeight > 144 ? 'auto' : 'hidden';
  }, [text]);

  const changeText = (value) => {
    setText(value);
    if (!typingRef.current && value.trim()) socket?.emit('typing', chatId);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket?.emit('stop-typing', chatId);
      typingRef.current = null;
    }, 1200);
  };

  const handleSend = async (event) => {
    event?.preventDefault();
    if (busyRef.current || reading || (!text.trim() && !attachment)) return;
    busyRef.current = true;
    setSending(true);
    setError('');
    let pendingAttachment = attachment;
    let pendingText = text.trim();
    setText('');
    setAttachment(null);
    setShowEmoji(false);
    clearTimeout(typingRef.current);
    typingRef.current = null;
    socket?.emit('stop-typing', chatId);
    try {
      if (pendingAttachment) {
        await sendMessage(pendingAttachment);
        pendingAttachment = null;
      }
      if (pendingText) {
        await sendMessage(pendingText);
        pendingText = '';
      }
      draftsRef.current.delete(chatId);
    } catch (err) {
      draftsRef.current.set(chatId, { text: pendingText, attachment: pendingAttachment });
      setText(pendingText);
      setAttachment(pendingAttachment);
      setError(`Message not sent. ${err.message} Your draft is ready to try again.`);
    } finally {
      busyRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choose a PNG, JPEG, GIF or WebP image smaller than 2 MB.');
      return;
    }
    setReading(true);
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => { setAttachment(reader.result); setReading(false); };
    reader.onerror = () => { setError('Could not read this image. Please try another.'); setReading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="composer border-t border-devs-border bg-devs-surface px-4 py-3 relative flex-shrink-0">
      {error && <p role="alert" className="mb-3 text-sm text-amber-200">{error}</p>}
      {showEmoji && <div className="absolute bottom-full left-2 mb-2 z-50" onKeyDown={(e) => { if (e.key === 'Escape') setShowEmoji(false); }}>
        <Suspense fallback={<p className="p-4 bg-devs-card">Loading emoji…</p>}>
          <EmojiPicker theme="dark" width={300} height={350} onEmojiClick={(emoji) => changeText(text + emoji.emoji)} />
        </Suspense>
      </div>}
      {attachment && <div className="flex items-center gap-3 mb-3">
        <img src={attachment} alt="Image ready to send" className="w-16 h-16 rounded-lg object-cover" />
        <span className="text-sm text-devs-textSecondary">Image attached</span>
        <button aria-label="Remove image" onClick={() => setAttachment(null)}><X size={18} /></button>
      </div>}
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <button type="button" aria-label="Choose emoji" aria-expanded={showEmoji} disabled={sending} onClick={() => setShowEmoji(!showEmoji)} className="composer-tool"><Smile size={20} /></button>
        <button type="button" aria-label="Attach image" disabled={sending || reading} onClick={() => fileRef.current?.click()} className="composer-tool">{reading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}</button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleFile} className="hidden" />
        <textarea ref={inputRef} aria-label="Message" rows={1} value={text} disabled={sending} onChange={(e) => changeText(e.target.value)} onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); }
        }} placeholder="Write a message…" className="min-w-0 flex-1 resize-none rounded-xl glass-input px-3 py-2.5 text-sm leading-6 max-h-36" />
        <button type="submit" aria-label="Send message" disabled={sending || reading || (!text.trim() && !attachment)} className="h-11 w-11 flex items-center justify-center rounded-xl bg-devs-blue hover:bg-devs-blueHover disabled:opacity-40 text-white">
          {sending ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
        </button>
      </form>
    </div>
  );
};
