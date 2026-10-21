import { getSession } from '../utils/session';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://chime-gjoi.onrender.com';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setSocketConnected(false);
        setConnectionStatus('disconnected');
      }
      return;
    }

    setConnectionStatus('connecting');

    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      auth: (done) => done({ token: getSession()?.token }),
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setSocketConnected(true);
      setConnectionStatus('connected');
      if (userRef.current) {
        newSocket.emit('setup', userRef.current);
      }
    });

    newSocket.io.on('reconnect_attempt', () => {
      setConnectionStatus('connecting');
    });

    newSocket.on('connected', () => {
      setSocketConnected(true);
      setConnectionStatus('connected');
    });

    newSocket.on('get-online-users', (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users.map(String));
      } else if (users && typeof users === 'object') {
        setOnlineUsers(Object.keys(users));
      } else {
        setOnlineUsers([]);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setSocketConnected(false);
      setOnlineUsers([]);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setConnectionStatus('disconnected');
      setSocketConnected(false);
      setOnlineUsers([]);
      if (err.data?.code === 'SESSION_EXPIRED') {
        window.dispatchEvent(new CustomEvent('chime:auth-expired'));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  // Audio notification generator using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.onended = () => { audioCtx.close().catch(() => {}); };
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch {
      // Ignore autoplay/audio errors on restricted browsers
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketConnected,
        connectionStatus,
        onlineUsers,
        playNotificationSound,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

