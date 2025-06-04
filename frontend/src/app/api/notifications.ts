import { API_BASE_URL } from '@/lib/api';
import { Notification } from '@/types/notification';

export const NotificationsAPI = {
    async getAll(): Promise<Notification[]> {
        const response = await fetch(`${API_BASE_URL}/notifications`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return response.json();
    },

    async getUnread(): Promise<Notification[]> {
        const response = await fetch(`${API_BASE_URL}/notifications/unread`);
        if (!response.ok) throw new Error('Failed to fetch unread notifications');
        return response.json();
    },

    async getUnreadCount(): Promise<number> {
        const response = await fetch(`${API_BASE_URL}/notifications/unread/count`);
        if (!response.ok) throw new Error('Failed to fetch unread count');
        return response.json();
    },

    async markAsRead(id: string): Promise<Notification> {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return response.json();
    },

    async markAllAsRead(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/notifications/read/all`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to mark all notifications as read');
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete notification');
    },

    async getByVehicle(vehicleId: string): Promise<Notification[]> {
        const response = await fetch(`${API_BASE_URL}/notifications/vehicle/${vehicleId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicle notifications');
        return response.json();
    },

    async getByType(type: string): Promise<Notification[]> {
        const response = await fetch(`${API_BASE_URL}/notifications/type/${type}`);
        if (!response.ok) throw new Error('Failed to fetch notifications by type');
        return response.json();
    },

    async create(notification: Omit<Notification, 'id' | 'read'>): Promise<Notification> {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification)
        });
        if (!response.ok) throw new Error('Failed to create notification');
        return response.json();
    }
};
