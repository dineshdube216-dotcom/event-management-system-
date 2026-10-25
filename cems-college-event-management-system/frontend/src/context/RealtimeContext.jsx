import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // { id, title, message, type, eventId }
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef(new Map()); // eventType -> Set of callbacks

  // Fetch initial notifications when user logs in
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token, fetchNotifications]);

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        console.log('⚡ Connected to CEMS Real-Time WebSocket Server');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data, timestamp } = message;

          // Dispatch to subscribed listeners
          if (listenersRef.current.has(type)) {
            listenersRef.current.get(type).forEach((cb) => {
              try {
                cb(data, timestamp);
              } catch (e) {
                console.error(`Error in listener for ${type}:`, e);
              }
            });
          }

          // Global listener for ALL events
          if (listenersRef.current.has('*')) {
            listenersRef.current.get('*').forEach((cb) => cb(type, data, timestamp));
          }

          // Handle in-app notifications & toast display
          if (type === 'NOTIFICATION_NEW') {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [
              {
                notification_id: Date.now().toString(),
                title: data.title || 'New Notification',
                message: data.message,
                event_id: data.event_id,
                is_read: false,
                sent_at: new Date().toISOString(),
              },
              ...prev,
            ]);

            // Show interactive toast
            setToast({
              id: Date.now(),
              title: data.title || 'System Alert',
              message: data.message,
              type: 'info',
              eventId: data.event_id,
            });
          }

          if (type === 'PROPOSAL_STATUS_CHANGED') {
            setToast({
              id: Date.now(),
              title: `Proposal Status: ${data.status.toUpperCase()}`,
              message: data.remarks
                ? `Remarks: "${data.remarks}" (by ${data.reviewedBy || 'Mentor'})`
                : `"${data.title}" was updated to ${data.status}.`,
              type: data.status === 'approved' ? 'success' : data.status === 'changes_requested' ? 'warning' : 'info',
              eventId: data.event_id,
            });
          }

          if (type === 'EVENT_PUBLISHED') {
            setToast({
              id: Date.now(),
              title: 'New Campus Event Published!',
              message: `"${data.title}" is now open for student registration.`,
              type: 'success',
              eventId: data.event_id,
            });
          }

          if (type === 'CERTIFICATE_AWARDED') {
            setToast({
              id: Date.now(),
              title: "Dean's Certificate Conferred! ⭐",
              message: `Dean Dr. Sarah Jenkins conferred a Virtual Certificate of Excellence for "${data.event_title}"!`,
              type: 'success',
              eventId: data.event_id,
            });
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.code, event.reason);
        setConnectionStatus('reconnecting');
        // Reconnect after 3 seconds
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (token) connectWebSocket();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      setConnectionStatus('reconnecting');
    }
  }, [token]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Subscribe to real-time events helper
  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);

    // Return cleanup unsubscribe function
    return () => {
      if (listenersRef.current.has(eventType)) {
        listenersRef.current.get(eventType).delete(callback);
      }
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (id) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const clearToast = () => setToast(null);

  return (
    <RealtimeContext.Provider
      value={{
        connectionStatus,
        notifications,
        unreadCount,
        toast,
        clearToast,
        subscribe,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
