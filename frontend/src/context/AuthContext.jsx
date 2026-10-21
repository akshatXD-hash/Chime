import { getSession, saveSession, clearSession } from '../utils/session';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SESSION_EXPIRED } from '../utils/errorMessages';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getSession()?.user || null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);

  const logout = useCallback((reason = null) => {
    setUser(null);
    clearSession();
    setAuthNotice(typeof reason === 'string' ? reason : null);
  }, []);

  // Listen for unauthorized 401 events dispatched from axiosClient
  useEffect(() => {
    const handleAuthExpired = (e) => {
      const message = SESSION_EXPIRED;
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
      saveSession({ user: data.user, token: data.token });
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
      saveSession({ user: data.user, token: data.token });
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
      saveSession({ ...getSession(), user: updated });
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

