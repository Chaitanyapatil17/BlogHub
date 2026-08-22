import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL, SOCKET_URL } from '../config';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [latestToast, setLatestToast] = useState(null);

  // 1. Fetch initial notifications from REST API
  const fetchNotifications = async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  // 2. Connect to Socket.io (Always connect for real-time updates for guests & auth users)
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token: token || '' },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to real-time BlogHub socket');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection retry:', err.message);
    });

    newSocket.on('notification', (newNotif) => {
      // Prepend new notification
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show in-app live toast
      setLatestToast(newNotif);
      setTimeout(() => {
        setLatestToast(null);
      }, 5000);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token, isAuthenticated]);

  // 3. Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // 4. Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  // 5. Delete notification
  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const target = notifications.find((n) => n.id === id);
        if (target && !target.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications,
        latestToast,
        setLatestToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
