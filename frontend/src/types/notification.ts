export type NotificationType = 'ANOMALY' | 'WARNING' | 'INFO';
export type NotificationSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    severity: NotificationSeverity;
    timestamp: string;
    read: boolean;
    vehicleId: string;
    vehicleType: string;
    region: string;
    year: string;
    metadata: Record<string, any>;
}

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}
