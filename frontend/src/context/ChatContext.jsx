import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatApi } from '../api/chatApi';
import { messageApi } from '../api/messageApi';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, playNotificationSound } = useSocket();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingMap, setTypingMap] = useState({});
  const [unreadMap, setUnreadMap] = useState({});

  // Safety timeout refs for typing indicator — auto-clears if stop-typing is never received
  const typingTimeoutMapRef = useRef({});
  const prevSelectedChatIdRef = useRef(null);

  // Fetch chats on user login
  const loadChats = async () => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const data = await chatApi.fetchChats();
      setChats(data);
    } catch (err) {
      console.error('Error fetching chats:', err.message);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
    }
  }, [user]);

  // Join socket chat room immediately when selectedChat or socket changes
  useEffect(() => {
    if (socket && selectedChat?._id) {
      socket.emit('join-chat', selectedChat._id);
    }
  }, [selectedChat?._id, socket]);

  // Clear typing state when switching chats
  useEffect(() => {
    const prevId = prevSelectedChatIdRef.current;
    const newId = selectedChat?._id;

    if (prevId && prevId !== newId) {
      // Clear typing for the chat we just left
      setTypingMap((prev) => ({ ...prev, [prevId]: false }));
      // Clear any safety timeout for the old chat
      if (typingTimeoutMapRef.current[prevId]) {
        clearTimeout(typingTimeoutMapRef.current[prevId]);
        delete typingTimeoutMapRef.current[prevId];
      }
    }
    prevSelectedChatIdRef.current = newId;
  }, [selectedChat?._id]);

  // Load messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat || !selectedChat._id) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await messageApi.getMessages(selectedChat._id);
        setMessages(data);

        setUnreadMap((prev) => ({ ...prev, [selectedChat._id]: 0 }));
      } catch (err) {
        console.error('Error fetching messages:', err.message);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedChat?._id]);

  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Cleanup all typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutMapRef.current).forEach(clearTimeout);
      typingTimeoutMapRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      if (!newMessage || !newMessage.chat) return;

      const chatOfMessage = newMessage.chat;
      const chatId = typeof chatOfMessage === 'object' ? chatOfMessage._id : chatOfMessage;

      playNotificationSound();

      const activeChatId = selectedChatRef.current?._id;

      if (activeChatId && activeChatId === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      } else {
        setUnreadMap((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }

      setChats((prevChats) => {
        const chatExists = prevChats.some((c) => c._id === chatId);
        if (!chatExists) {
          loadChats();
          return prevChats;
        }
        return prevChats
          .map((c) => {
            if (c._id === chatId) {
              return { ...c, latestMessage: newMessage, updatedAt: new Date().toISOString() };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const handleTyping = (room) => {
      const activeChatId = selectedChatRef.current?._id;
      const targetChatId = room || activeChatId;
      if (!targetChatId) return;

      setTypingMap((prev) => ({ ...prev, [targetChatId]: true }));

      // Safety timeout: auto-clear typing after 3 seconds if stop-typing is lost
      if (typingTimeoutMapRef.current[targetChatId]) {
        clearTimeout(typingTimeoutMapRef.current[targetChatId]);
      }
      typingTimeoutMapRef.current[targetChatId] = setTimeout(() => {
        setTypingMap((prev) => ({ ...prev, [targetChatId]: false }));
        delete typingTimeoutMapRef.current[targetChatId];
      }, 3000);
    };

    const handleStopTyping = (room) => {
      const activeChatId = selectedChatRef.current?._id;
      const targetChatId = room || activeChatId;
      if (!targetChatId) return;

      setTypingMap((prev) => ({ ...prev, [targetChatId]: false }));

      // Cancel the safety timeout since we got the explicit stop
      if (typingTimeoutMapRef.current[targetChatId]) {
        clearTimeout(typingTimeoutMapRef.current[targetChatId]);
        delete typingTimeoutMapRef.current[targetChatId];
      }
    };

    const handleDisconnect = () => {
      // Clear all typing indicators on disconnect
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
  }, [socket]);

  // Access or create 1-on-1 chat
  const accessChat = async (targetUserId) => {
    try {
      const chat = await chatApi.accessChat(targetUserId);
      if (!chats.find((c) => c._id === chat._id)) {
        setChats((prev) => [chat, ...prev]);
      }
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

  // Send message
  const sendMessage = async (content) => {
    if (!selectedChat || !content.trim()) return;

    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const tempMessage = {
      _id: tempId,
      content,
      sender: user,
      chat: selectedChat,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // 1. Instant optimistic update in local state for sender
    setMessages((prev) => [...prev, tempMessage]);
    setChats((prev) =>
      prev
        .map((c) =>
          c._id === selectedChat._id
            ? { ...c, latestMessage: tempMessage, updatedAt: new Date().toISOString() }
            : c
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );

    try {
      // 2. Persist to server
      const message = await messageApi.sendMessage(content, selectedChat._id);

      // 3. Replace temp message with server response
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? message : m))
      );

      // 4. Emit socket event for instant real-time delivery to recipient
      if (socket) {
        socket.emit('send-message', message);
      }

      // Update chats list with final saved message
      setChats((prev) =>
        prev
          .map((c) =>
            c._id === selectedChat._id
              ? { ...c, latestMessage: message, updatedAt: new Date().toISOString() }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );

      return message;
    } catch (err) {
      // Revert optimistic message if error occurred
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      console.error('Failed to send message:', err.message);
      throw err;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        messages,
        setMessages,
        loadingChats,
        loadingMessages,
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
