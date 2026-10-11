import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';
import { NotificationContext } from './NotificationContextStore';

export const NotificationProvider = ({ children }) => {
  const { token } = useAuth();
  const [notificationData, setNotificationData] = useState({ token: null, notifications: [], unreadCount: 0 });

  const notifications = notificationData.token === token ? notificationData.notifications : [];
  const unreadCount = notificationData.token === token ? notificationData.unreadCount : 0;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications');
      setNotificationData({
        token,
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
      });
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (active) {
          setNotificationData({
            token,
            notifications: res.data.notifications || [],
            unreadCount: res.data.unreadCount || 0,
          });
        }
      } catch (err) {
        if (active) console.error('Error fetching notifications:', err.message);
      }
    };
    loadNotifications();

    // Auto-refresh notifications every 30 seconds for active experience
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotificationData((current) => {
        if (current.token !== token) return current;
        const wasUnread = current.notifications.some((item) => item._id === id && !item.isRead);
        return {
          ...current,
          notifications: current.notifications.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
          unreadCount: wasUnread ? Math.max(0, current.unreadCount - 1) : current.unreadCount,
        };
      });
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotificationData((current) => current.token === token
        ? { ...current, notifications: current.notifications.map((item) => ({ ...item, isRead: true })), unreadCount: 0 }
        : current);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err.message);
    }
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
