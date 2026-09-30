import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, userApi } from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'verify' | 'forgot'
  const [verifyEmailState, setVerifyEmailState] = useState('');

  // Initial session check
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        if (res?.data?.user) {
          setUser(res.data.user);
          getSocket();
        }
      } catch (err) {
        console.warn('Session check failed:', err.message);
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res?.data?.tokens?.accessToken) {
      localStorage.setItem('accessToken', res.data.tokens.accessToken);
    }
    if (res?.data?.user) {
      setUser(res.data.user);
      getSocket();
    }
    setAuthModalOpen(false);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    setVerifyEmailState(email);
    setAuthMode('verify');
    return res;
  };

  const verifyEmail = async (email, otp) => {
    const res = await authApi.verifyEmail({ email, otp });
    if (res?.data?.tokens?.accessToken) {
      localStorage.setItem('accessToken', res.data.tokens.accessToken);
    }
    if (res?.data?.user) {
      setUser(res.data.user);
      getSocket();
    }
    setAuthModalOpen(false);
    return res;
  };

  const resendOtp = async (email, action = 'verify') => {
    return await authApi.resendOtp({ email, action });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('accessToken');
      disconnectSocket();
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const refreshProfile = async () => {
    try {
      const res = await userApi.getProfile();
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        verifyEmailState,
        setVerifyEmailState,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
