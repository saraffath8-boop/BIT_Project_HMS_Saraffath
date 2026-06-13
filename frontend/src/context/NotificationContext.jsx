// This file contains the notification context shared application logic.

/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getNotifications } from '../services/notificationService';

// Handle notification context.
const NotificationContext = createContext(null);
// Store the refresh interval ms setting used by this file.
const REFRESH_INTERVAL_MS = 30000;

// Show the notification provider interface.
export const NotificationProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    // Handle refresh unread count.
    const refreshUnreadCount = useCallback(async () => {
        if (!token || !user) {
            setUnreadCount(0);
            return;
        }

        try {
            const response = await getNotifications({ token, filters: { isRead: false } });
            setUnreadCount((response.notifications || []).length);
        } catch {
            // Keep the last known count when a background refresh fails.
        }
    }, [token, user]);

    // Run this work when the listed values change.
    useEffect(() => {
        refreshUnreadCount();
        const intervalId = setInterval(refreshUnreadCount, REFRESH_INTERVAL_MS);
        // Handle handle visibility change.
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') refreshUnreadCount();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshUnreadCount]);

    const value = useMemo(
        () => ({ unreadCount, refreshUnreadCount }),
        [unreadCount, refreshUnreadCount],
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Handle use notifications.
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
    return context;
};
