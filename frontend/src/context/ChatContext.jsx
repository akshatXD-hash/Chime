import React, { createContext, useContext, useState, useEffect } from 'react';
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

        // Clear unread count for this chat
        setUnreadMap((prev) => ({ ...prev, [selectedChat._id]: 0 }));

        // Join socket chat room
        if (socket) {
          socket.emit('join-chat', selectedChat._id);
        }
      } catch (err) {
        console.error('Error fetching messages:', err.message);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedChat?._id, socket]);

  // Handle incoming real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      const chatOfMessage = newMessage.chat;
      const chatId = typeof chatOfMessage === 'object' ? chatOfMessage._id : chatOfMessage;

      playNotificationSound();

      // If message is for currently active selectedChat, append it
      if (selectedChat && selectedChat._id === chatId) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      } else {
        // Increment unread count for other chats
        setUnreadMap((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }

      // Update latestMessage in chats list
      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c._id === chatId) {
            return { ...c, latestMessage: newMessage, updatedAt: new Date().toISOString() };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const handleTyping = () => {
      if (selectedChat) {
        setTypingMap((prev) => ({ ...prev, [selectedChat._id]: true }));
      }
    };

    const handleStopTyping = () => {
      if (selectedChat) {
        setTypingMap((prev) => ({ ...prev, [selectedChat._id]: false }));
      }
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket, selectedChat]);

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

    try {
      const message = await messageApi.sendMessage(content, selectedChat._id);
      setMessages((prev) => [...prev, message]);

      // Emit socket event
      if (socket) {
        socket.emit('send-message', message);
      }

      // Update chats list latestMessage
      setChats((prev) =>
        prev.map((c) => (c._id === selectedChat._id ? { ...c, latestMessage: message } : c))
      );

      return message;
    } catch (err) {
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
