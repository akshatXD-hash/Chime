import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../api/chatApi';
import { messageApi } from '../api/messageApi';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { mergeMessage, applyReceipt } from '../utils/messageReceipts';
import { areIdsEqual } from '../utils/chatUtils';

const ChatContext = createContext(null);

export { areIdsEqual };

export const ChatProvider = ({ children }) => {

  const { user } = useAuth();
  const { socket, playNotificationSound } = useSocket();

  const userId = user?._id || user?.id;

  // Hydrate chats from localStorage cache for instant display without blank screen
  const [chats, setChats] = useState(() => {
    if (!userId) return [];
    try {
      const cached = localStorage.getItem(`chime_chats_${userId}`);
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const messageCacheRef = useRef(new Map());
  const draftsRef = useRef(new Map());
  const updateChatMessages = useCallback((chatId, update) => {
    const cache = messageCacheRef.current;
    const next = typeof update === 'function' ? update(cache.get(chatId) || []) : update;
    cache.delete(chatId);
    cache.set(chatId, next);
    if (cache.size > 30) cache.delete(cache.keys().next().value);
    if (areIdsEqual(selectedChatRef.current?._id, chatId)) setMessages(next);
  }, []);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [typingMap, setTypingMap] = useState({});
  const [unreadMap, setUnreadMap] = useState({});

  // Safety timeout refs for typing indicators
  const typingTimeoutMapRef = useRef({});
  const prevSelectedChatIdRef = useRef(null);
  const selectedChatRef = useRef(selectedChat);
  const chatsRequestRef = useRef(0);
  const processedMessageIdsRef = useRef(new Set());

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Persist chats cache whenever chats change
  useEffect(() => {
    if (userId && chats.length > 0) {
      try {
        localStorage.setItem(`chime_chats_${userId}`, JSON.stringify(chats));
      } catch (err) {
        console.warn('Failed to cache chats in localStorage:', err);
      }
    }
  }, [chats, userId]);

  // Persist / restore active selected chat
  useEffect(() => {
    if (!userId) return;
    if (selectedChat?._id) {
      try { localStorage.setItem(`chime_active_chat_${userId}`, String(selectedChat._id)); } catch { /* Storage can be disabled. */ }
    }
  }, [selectedChat?._id, userId]);

  // Fetch chats from server
  const loadChats = useCallback(async () => {
    if (!userId) return;
    const request = ++chatsRequestRef.current;
    setLoadingChats(true);
    setFetchError(null);
    try {
      const data = await chatApi.fetchChats();
      if (request !== chatsRequestRef.current) return;
      const chatList = Array.isArray(data) ? data : [];
      setChats(chatList);
      setFetchError(null);

      if (userId) {
        try {
          localStorage.setItem(`chime_chats_${userId}`, JSON.stringify(chatList));
        } catch {
          // ignore storage error
        }
      }

      // Check if we can restore the active chat if none currently selected
      if (!selectedChatRef.current && userId) {
        let savedChatId;
        try { savedChatId = localStorage.getItem(`chime_active_chat_${userId}`); } catch { /* Optional cache. */ }
        if (savedChatId) {
          const matchingChat = chatList.find((c) => areIdsEqual(c._id, savedChatId));
          if (matchingChat) {
            setSelectedChat(matchingChat);
          }
        }
      }
    } catch (err) {
      console.warn('Warning fetching chats from server:', err.message);
      if (request === chatsRequestRef.current) setFetchError(err.message || 'Unable to sync conversations');
      // Keep existing cached chats in state! Do not wipe state on error!
    } finally {
      if (request === chatsRequestRef.current) setLoadingChats(false);
    }
  }, [userId]);

  // On user change / mount: hydrate cache and trigger loadChats
  useEffect(() => {
    if (userId) {
      // 1. Immediately hydrate from cache
      try {
        const cached = localStorage.getItem(`chime_chats_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChats(parsed);
            const savedChatId = localStorage.getItem(`chime_active_chat_${userId}`);
            if (savedChatId) {
              const matched = parsed.find((c) => areIdsEqual(c._id, savedChatId));
              if (matched) {
                setSelectedChat(matched);
              }
            }
          }
        }
      } catch {
        // ignore cache parse error
      }
      // 2. Fetch fresh data from backend
      loadChats();
    } else {
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
      setFetchError(null);
    }
  }, [userId, loadChats]);

  // Rejoin rooms and catch up on messages missed while disconnected.
  useEffect(() => {
    if (!socket) return;
    const reconnect = () => {
      if (selectedChatRef.current?._id) socket.emit('join-chat', selectedChatRef.current._id);
      loadChats();
      setMessageRevision((n) => n + 1);
    };
    socket.on('connect', reconnect);
    window.addEventListener('online', reconnect);
    return () => {
      socket.off('connect', reconnect);
      window.removeEventListener('online', reconnect);
    };
  }, [socket, loadChats]);

  useEffect(() => {
    if (socket?.connected && selectedChat?._id) socket.emit('join-chat', selectedChat._id);
    return () => { if (selectedChat?._id) socket?.emit('leave-chat', selectedChat._id); };
  }, [selectedChat?._id, socket]);

  // Clear typing state when switching chats
  useEffect(() => {
    const prevId = prevSelectedChatIdRef.current;
    const newId = selectedChat?._id;

    if (prevId && prevId !== newId) {
      setTypingMap((prev) => ({ ...prev, [prevId]: false }));
      if (typingTimeoutMapRef.current[prevId]) {
        clearTimeout(typingTimeoutMapRef.current[prevId]);
        delete typingTimeoutMapRef.current[prevId];
      }
    }
    prevSelectedChatIdRef.current = newId;
  }, [selectedChat?._id]);

  const [messageError, setMessageError] = useState(null);
  const [messageRevision, setMessageRevision] = useState(0);
  const messageRequestRef = useRef(0);
  const retryMessages = useCallback(() => setMessageRevision((n) => n + 1), []);

  useEffect(() => {
    const request = ++messageRequestRef.current;
    const chatId = selectedChat?._id;
    setMessages(messageCacheRef.current.get(chatId) || []);
    setMessageError(null);
    if (!chatId) {
      setLoadingMessages(false);
      return;
    }
    let active = true;
    setLoadingMessages(true);
    messageApi.getMessages(chatId).then((data) => {
      if (!active || request !== messageRequestRef.current) return;
      updateChatMessages(chatId, (current) => {
        const merged = new Map((Array.isArray(data) ? data : []).map((m) => [m._id, m]));
        current.forEach((m) => merged.set(m._id, mergeMessage(m, merged.get(m._id) || m)));
        return [...merged.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      const incoming = (Array.isArray(data) ? data : []).filter((m) => !areIdsEqual(m.sender, userId) && !(m.deliveredTo || []).some((id) => areIdsEqual(id, userId)));
      for (let i = 0; i < incoming.length; i += 100) {
        messageApi.markDelivered(chatId, incoming.slice(i, i + 100).map((m) => m._id)).then(receiveReceipt).catch(() => {});
      }
      setUnreadMap((prev) => ({ ...prev, [chatId]: 0 }));
    }).catch((err) => {
      if (active) setMessageError(err.message || 'Could not load messages');
    }).finally(() => {
      if (active) setLoadingMessages(false);
    });
    return () => { active = false; };
  }, [selectedChat?._id, messageRevision, updateChatMessages]);

  const receiveReceipt = useCallback((receipt) => {
    if (!receipt?.chatId || !Array.isArray(receipt.messageIds) || !receipt.userId) return;
    updateChatMessages(receipt.chatId, (current) => current.map((message) => applyReceipt(message, receipt)));
    setChats((current) => current.map((chat) =>
      areIdsEqual(chat._id, receipt.chatId) && chat.latestMessage?._id
        ? { ...chat, latestMessage: applyReceipt(chat.latestMessage, receipt) } : chat
    ));
  }, [updateChatMessages]);

  const markMessagesRead = useCallback(async (chatId, ids) => {
    const receipt = await messageApi.markRead(chatId, ids);
    receiveReceipt(receipt);
  }, [receiveReceipt]);

  useEffect(() => {
    if (!socket) return;
    socket.on('messages-read', receiveReceipt);
    socket.on('messages-delivered', receiveReceipt);
    return () => {
      socket.off('messages-read', receiveReceipt);
      socket.off('messages-delivered', receiveReceipt);
    };
  }, [socket, receiveReceipt]);

  // Cleanup all typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutMapRef.current).forEach(clearTimeout);
      typingTimeoutMapRef.current = {};
    };
  }, []);

  // Real-time socket events with deduplication
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      if (!newMessage || !newMessage.chat) return;

      const messageId = newMessage._id;
      if (messageId) {
        if (processedMessageIdsRef.current.has(messageId)) {
          return; // Already processed this message (prevents double sound / double counter)
        }
        processedMessageIdsRef.current.add(messageId);
        // Keep set size bounded
        if (processedMessageIdsRef.current.size > 200) {
          const firstKey = processedMessageIdsRef.current.values().next().value;
          processedMessageIdsRef.current.delete(firstKey);
        }
      }

      const chatOfMessage = newMessage.chat;
      const chatId = typeof chatOfMessage === 'object' ? chatOfMessage._id : chatOfMessage;
      const activeChatId = selectedChatRef.current?._id;
      if (!areIdsEqual(newMessage.sender, userId)) {
        messageApi.markDelivered(chatId, [messageId]).then(receiveReceipt).catch(() => {});
      }

      // Play sound for incoming messages
      if (!areIdsEqual(newMessage.sender, userId)) playNotificationSound();

      if (!areIdsEqual(activeChatId, chatId)) {
        updateChatMessages(chatId, (prev) => prev.some((m) => areIdsEqual(m._id, messageId)) ? prev : [...prev, newMessage]);
      }
      // If this message belongs to the currently active chat
      if (activeChatId && areIdsEqual(activeChatId, chatId)) {
        updateChatMessages(chatId, (prev) => {
          if (prev.some((m) => areIdsEqual(m._id, newMessage._id))) return prev;
          return [...prev, newMessage];
        });
      } else if (!areIdsEqual(newMessage.sender, userId)) {
        // Increment unread count for other chats
        setUnreadMap((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }

      // Update chats list (move chat to top and update latestMessage)
      setChats((prevChats) => {
        const chatExists = prevChats.some((c) => areIdsEqual(c._id, chatId));
        if (!chatExists) {
          // If this is a new conversation not yet in list, insert it or reload
          if (typeof chatOfMessage === 'object' && chatOfMessage._id) {
            return [{ ...chatOfMessage, latestMessage: newMessage, updatedAt: new Date().toISOString() }, ...prevChats];
          }
          loadChats();
          return prevChats;
        }

        return prevChats
          .map((c) => {
            if (areIdsEqual(c._id, chatId)) {
              return { ...c, latestMessage: newMessage, updatedAt: new Date().toISOString() };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });
    };

    const handleTyping = (room) => {
      const activeChatId = selectedChatRef.current?._id;
      const targetChatId = room || activeChatId;
      if (!targetChatId) return;

      setTypingMap((prev) => ({ ...prev, [targetChatId]: true }));

      if (typingTimeoutMapRef.current[targetChatId]) {
        clearTimeout(typingTimeoutMapRef.current[targetChatId]);
      }
      typingTimeoutMapRef.current[targetChatId] = setTimeout(() => {
        setTypingMap((prev) => ({ ...prev, [targetChatId]: false }));
        delete typingTimeoutMapRef.current[targetChatId];
      }, 3500);
    };

    const handleStopTyping = (room) => {
      const activeChatId = selectedChatRef.current?._id;
      const targetChatId = room || activeChatId;
      if (!targetChatId) return;

      setTypingMap((prev) => ({ ...prev, [targetChatId]: false }));

      if (typingTimeoutMapRef.current[targetChatId]) {
        clearTimeout(typingTimeoutMapRef.current[targetChatId]);
        delete typingTimeoutMapRef.current[targetChatId];
      }
    };

    const handleDisconnect = () => {
      setTypingMap({});
      Object.values(typingTimeoutMapRef.current).forEach(clearTimeout);
      typingTimeoutMapRef.current = {};
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, playNotificationSound, loadChats]);

  // Access or create 1-on-1 chat
  const accessChat = async (targetUserId) => {
    try {
      const chat = await chatApi.accessChat(targetUserId);
      setChats((prev) => {
        const exists = prev.some((c) => areIdsEqual(c._id, chat._id));
        if (exists) {
          return prev.map((c) => (areIdsEqual(c._id, chat._id) ? { ...c, ...chat } : c));
        }
        return [chat, ...prev];
      });
      setSelectedChat(chat);
      return chat;
    } catch (err) {
      console.error('Failed to access chat:', err.message);
      throw err;
    }
  };

  // Create new group chat
  const createGroupChat = async (name, userIds) => {
    try {
      const group = await chatApi.createGroupChat(name, userIds);
      setChats((prev) => [group, ...prev]);
      setSelectedChat(group);
      return group;
    } catch (err) {
      console.error('Failed to create group:', err.message);
      throw err;
    }
  };

  // Explicit deselect chat (e.g. mobile back)
  const clearSelectedChat = () => {
    setSelectedChat(null);
    if (userId) {
      try { localStorage.removeItem(`chime_active_chat_${userId}`); } catch { /* Optional cache. */ }
    }
  };

  // Send message with optimistic update & rollback on error
  const sendMessage = async (content) => {
    if (!selectedChat || !content.trim()) return;

    const currentChat = selectedChat;
    const previousPreview = chats.find((c) => areIdsEqual(c._id, currentChat._id));
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const tempMessage = {
      _id: tempId,
      content,
      sender: user,
      chat: currentChat,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // 1. Instant optimistic update
    updateChatMessages(currentChat._id, (prev) => [...prev, tempMessage]);
    setChats((prev) =>
      prev
        .map((c) =>
          areIdsEqual(c._id, currentChat._id)
            ? { ...c, latestMessage: tempMessage, updatedAt: new Date().toISOString() }
            : c
        )
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    );

    try {
      // 2. Persist to server
      const message = await messageApi.sendMessage(content, currentChat._id);

      // 3. Replace temp message with server response
      updateChatMessages(currentChat._id, (prev) =>
        prev.map((m) => (m._id === tempId ? message : m))
      );

      // 5. Update chats list with final saved message
      setChats((prev) =>
        prev
          .map((c) =>
            areIdsEqual(c._id, currentChat._id)
              ? { ...c, latestMessage: message, updatedAt: new Date().toISOString() }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      );

      return message;
    } catch (err) {
      // Revert optimistic message on failure
      updateChatMessages(currentChat._id, (prev) => prev.filter((m) => m._id !== tempId));
      setChats((prev) => prev.map((chat) =>
        chat.latestMessage?._id === tempId
          ? { ...chat, latestMessage: previousPreview?.latestMessage, updatedAt: previousPreview?.updatedAt }
          : chat
      ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)));
      console.error('Failed to send message:', err.message);
      throw err;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        draftsRef,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        clearSelectedChat,
        messages,
        setMessages,
        loadingChats,
        loadingMessages,
        messageError,
        retryMessages,
        markMessagesRead,
        fetchError,
        typingMap,
        unreadMap,
        loadChats,
        accessChat,
        createGroupChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

