import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('chime_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('chime_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('chime_user');
      localStorage.removeItem('chime_token');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.signIn({ email, password });
      setUser(data.user);
      if (data.token) {
        localStorage.setItem('chime_token', data.token);
      }
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
    try {
      const data = await authApi.signUp(formData);
      setUser(data.user);
      if (data.token) {
        localStorage.setItem('chime_token', data.token);
      }
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chime_user');
    localStorage.removeItem('chime_token');
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
