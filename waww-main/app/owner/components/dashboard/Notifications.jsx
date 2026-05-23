import React, { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import s from './Notifications.module.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/my');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className={s.container}>Loading notifications...</div>;

  return (
    <div className={s.container}>
      <h1 className={s.title}>Notification Center</h1>
      <p className={s.subtitle}>View all your system alerts, messages, and updates.</p>

      {notifications.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <h3 className={s.emptyTitle}>No notifications yet</h3>
          <p className={s.emptyText}>You are all caught up.</p>
        </div>
      ) : (
        <div className={s.list}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`${s.card} ${!n.is_read ? s.unread : ''}`}
            >
              <div className={s.iconBox}>
                {n.category.includes('Warning') ? '⚠️' : n.category.includes('Maintenance') ? '🔧' : n.category.includes('Alert') ? '🔔' : '📢'}
              </div>
              <div className={s.contentBox}>
                <div className={s.header}>
                  <h4 className={s.notifTitle}>
                    {n.title}
                  </h4>
                  <span className={s.time}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <div className={s.meta}>
                  {n.category} • {n.priority} Priority
                </div>
                <p className={s.message}>
                  {n.message}
                </p>
              </div>
              {!n.is_read && (
                <button 
                  onClick={() => markAsRead(n.id)}
                  className={s.readBtn}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
