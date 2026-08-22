import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('chime_user');
      const savedToken = localStorage.getItem('chime_token');
      // If token is missing, consider session invalid
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);

  // Sync user object with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('chime_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('chime_user');
      localStorage.removeItem('chime_token');
    }
  }, [user]);

  const logout = useCallback((reason = null) => {
    setUser(null);
    localStorage.removeItem('chime_user');
    localStorage.removeItem('chime_token');
    if (reason) {
      setAuthNotice(reason);
    }
  }, []);

  // Listen for unauthorized 401 events dispatched from axiosClient
  useEffect(() => {
    const handleAuthExpired = (e) => {
      const message = e.detail?.message || 'Your session has expired. Please sign in again.';
      console.warn('Session expired:', message);
      logout(message);
    };

    window.addEventListener('chime:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('chime:auth-expired', handleAuthExpired);
    };
  }, [logout]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setAuthNotice(null);
    try {
      const data = await authApi.signIn({ email, password });
      if (data.token) {
        localStorage.setItem('chime_token', data.token);
      }
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (formData) => {
    setLoading(true);
    setError(null);
    setAuthNotice(null);
    try {
      const data = await authApi.signUp(formData);
      if (data.token) {
        localStorage.setItem('chime_token', data.token);
      }
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPic = (newPicUrl) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updated = { ...prevUser, pic: newPicUrl };
      localStorage.setItem('chime_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        setError,
        authNotice,
        setAuthNotice,
        login,
        signup,
        logout,
        updateUserPic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

