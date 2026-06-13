// This file contains the notifications page interface.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getNotifications, markNotificationAsRead } from '../../services/notificationService';

// Show the notifications page interface.
const NotificationsPage = () => {
    const { token, user } = useAuth();
    const { refreshUnreadCount } = useNotifications();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load notifications.
    const loadNotifications = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getNotifications({ token });
            setNotifications(response.notifications || []);
            await refreshUnreadCount();
        } catch (err) {
            setError(err.message || 'Unable to load notifications');
        } finally {
            setLoading(false);
        }
    }, [token, refreshUnreadCount]);

    // Run this work when the listed values change.
    useEffect(() => {
        // Handle timeout id.
        const timeoutId = setTimeout(() => {
            loadNotifications();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [loadNotifications]);

    // Handle handle mark as read.
    const handleMarkAsRead = async (id) => {
        setError('');

        try {
            await markNotificationAsRead(id, token);
            await loadNotifications();
        } catch (err) {
            setError(err.message || 'Unable to update notification');
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Notifications</p>
                    <h1 style={styles.title}>Notification Center</h1>
                    <p style={styles.subtitle}>
                        View appointment, billing, laboratory, radiology, pharmacy, and system
                        notifications.
                    </p>
                </div>
                <div style={styles.actions}>
                    <Link style={styles.secondaryLink} to="/dashboard">
                        Dashboard
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'receptionist') && (
                        <Link style={styles.primaryLink} to="/notifications/new">
                            Create Notification
                        </Link>
                    )}
                </div>
            </section>

            {loading && <div style={styles.notice}>Loading notifications.</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && notifications.length === 0 && (
                <div style={styles.notice}>No notifications are currently available.</div>
            )}

            {!loading && !error && notifications.length > 0 && (
                <div style={styles.list}>
                    {notifications.map((notification) => (
                        <article
                            key={notification.id}
                            style={{
                                ...styles.card,
                                ...(!notification.isRead ? styles.unreadCard : {}),
                            }}
                        >
                            <div>
                                <div style={styles.titleRow}>
                                    <h2 style={styles.sectionTitle}>{notification.title}</h2>
                                    {!notification.isRead && (
                                        <span style={styles.unreadBadge}>New</span>
                                    )}
                                </div>
                                <p style={styles.meta}>
                                    {notification.type} · {notification.isRead ? 'Read' : 'Unread'}
                                </p>
                                <p style={styles.bodyText}>{notification.message}</p>
                            </div>
                            {!notification.isRead && (
                                <button
                                    type="button"
                                    style={styles.primaryButton}
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    Mark as Read
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
};

// Handle styles.
const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px', color: '#0f172a' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        alignItems: 'flex-start',
        marginBottom: '24px',
    },
    kicker: {
        margin: 0,
        color: '#2563eb',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '12px',
    },
    title: { margin: '8px 0', fontSize: '32px', fontWeight: 800 },
    subtitle: { margin: 0, color: '#475569', maxWidth: '680px' },
    actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    secondaryLink: {
        textDecoration: 'none',
        border: '1px solid #cbd5e1',
        color: '#0f172a',
        background: '#ffffff',
        padding: '10px 14px',
        borderRadius: '10px',
        fontWeight: 700,
    },
    primaryLink: {
        textDecoration: 'none',
        border: '1px solid #2563eb',
        color: '#ffffff',
        background: '#2563eb',
        padding: '10px 14px',
        borderRadius: '10px',
        fontWeight: 700,
    },
    notice: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px',
        color: '#475569',
    },
    error: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '14px',
        padding: '18px',
        color: '#991b1b',
    },
    list: { display: 'grid', gap: '12px' },
    card: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '18px',
    },
    unreadCard: {
        background: '#ecfeff',
        border: '2px solid #0891b2',
        boxShadow: '0 4px 14px rgba(8, 145, 178, 0.12)',
    },
    titleRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    unreadBadge: {
        borderRadius: '999px',
        background: '#dc2626',
        color: '#ffffff',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 800,
        textTransform: 'uppercase',
    },
    sectionTitle: { margin: '0 0 8px', fontSize: '20px' },
    meta: { margin: '0 0 10px', color: '#64748b', textTransform: 'capitalize' },
    bodyText: { margin: 0, color: '#334155' },
    primaryButton: {
        alignSelf: 'flex-start',
        border: 'none',
        background: '#2563eb',
        color: '#ffffff',
        padding: '10px 14px',
        borderRadius: '10px',
        fontWeight: 700,
        cursor: 'pointer',
    },
};

export default NotificationsPage;
