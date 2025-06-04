'use client';

import { NotificationsAPI } from '@/app/api/notifications';
import { Notification, NotificationContextType } from '@/types/notification';
import React, { createContext, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const [allNotifications, count] = await Promise.all([
                NotificationsAPI.getAll(),
                NotificationsAPI.getUnreadCount()
            ]);
            setNotifications(allNotifications);
            setUnreadCount(count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            setError(null);
            await NotificationsAPI.markAsRead(id);
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === id ? { ...notif, read: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            setError(null);
            await NotificationsAPI.markAllAsRead();
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, read: true }))
            );
            setUnreadCount(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            setError(null);
            await NotificationsAPI.delete(id);
            const deletedNotification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(notif => notif.id !== id));
            if (deletedNotification && !deletedNotification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete notification');
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Poll for new notifications every minute
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
