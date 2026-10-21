import { useEffect, useRef } from 'react';
import { areIdsEqual } from '../utils/chatUtils';

export function useReadReceipts({ messages, chatId, userId, rootRef, markRead, paused }) {
  const latest = useRef(messages);
  latest.current = messages;
  useEffect(() => {
    if (!chatId || paused) return;
    let active = true;
    let pending = false;
    let retryAt = 0;
    const flush = async () => {
      const root = rootRef.current;
      if (!active || pending || !root || Date.now() < retryAt || document.visibilityState !== 'visible' ||
          !document.hasFocus() || document.querySelector('[aria-modal="true"]')) return;
      const unread = new Set(latest.current.filter((message) => !message.isOptimistic &&
        !areIdsEqual(message.sender, userId) && !(message.readBy || []).some((id) => areIdsEqual(id, userId))
      ).map((message) => String(message._id)));
      const bounds = root.getBoundingClientRect();
      const ids = [...root.querySelectorAll('[data-message-id]')].filter((node) => {
        if (!unread.has(node.dataset.messageId)) return false;
        const rect = node.getBoundingClientRect();
        return Math.min(rect.bottom, bounds.bottom, window.innerHeight) - Math.max(rect.top, bounds.top, 0) >= 12;
      }).slice(0, 100).map((node) => node.dataset.messageId);
      if (!ids.length) return;
      pending = true;
      try { await markRead(chatId, ids); }
      catch { retryAt = Date.now() + 5000; }
      finally { pending = false; }
    };
    const timer = setInterval(flush, 700);
    window.addEventListener('focus', flush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', flush);
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [chatId, userId, rootRef, markRead, paused]);
}
