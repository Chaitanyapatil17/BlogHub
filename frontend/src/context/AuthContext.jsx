import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL as BASE_URL } from '../config';

const AuthContext = createContext();

const API_BASE_URL = `${BASE_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bloghub_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount or token change
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Login handler
  const login = async (email, password, turnstileToken = null) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, turnstileToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('bloghub_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Register handler
  const register = async (name, email, password, turnstileToken = null) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, turnstileToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    localStorage.setItem('bloghub_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Refresh user data (useful after verify or profile updates)
  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user info:', err);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('bloghub_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVerified: user?.is_verified === true || user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
