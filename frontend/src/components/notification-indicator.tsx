'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/context/notification/notification-context';
import { cn } from '@/lib/utils';
import { Notification, NotificationType } from '@/types/notification';
import { Bell } from 'lucide-react';
import { useState } from 'react';

export function NotificationIndicator() {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        // Don't close popover when marking as read
    };

    const handleBellClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const getNotificationColor = (type: NotificationType, metadata?: Record<string, any>) => {
        // For anomalies, check if it's a SER violation
        if (type === 'ANOMALY' && metadata?.exceedsSER) {
            return metadata?.severity === 'HIGH' 
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-warning text-warning-foreground';
        }

        switch (type) {
            case 'ANOMALY':
                return 'bg-destructive text-destructive-foreground';
            case 'WARNING':
                return 'bg-warning text-warning-foreground';
            case 'INFO':
                return 'bg-secondary text-secondary-foreground';
            default:
                return 'bg-primary text-primary-foreground';
        }
    };

    const getNotificationDetails = (notification: Notification) => {
        const { metadata, vehicleType } = notification;
        
        if (vehicleType.toLowerCase() === 'camions' && metadata?.exceedsSER) {
            return {
                title: `Anomalie SER - ${vehicleType}`,
                message: `IPE/Tonne: ${metadata.ipeL100TonneKm?.toFixed(2)} L/100km·T (SER: ${metadata.predictedIpeL100TonneKm?.toFixed(2)} L/100km·T)`,
                color: getNotificationColor('ANOMALY', metadata)
            };
        }

        return {
            title: notification.title,
            message: notification.message,
            color: getNotificationColor(notification.type)
        };
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-accent"
                    aria-label="Notifications"
                    onClick={handleBellClick}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-20">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex items-center justify-center h-20 text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group',
                                        !notification.read && 'bg-muted/30'
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-4">
                                        {(() => {
                                            const details = getNotificationDetails(notification);
                                            return (
                                                <>
                                                    <Badge className={cn('mt-1', details.color)}>
                                                        {notification.type}
                                                    </Badge>
                                                    <div className="flex-1">
                                                        <h5 className="font-medium">{details.title}</h5>
                                                        <p className="text-sm text-muted-foreground">
                                                            {details.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                            <span>{new Date(notification.timestamp).toLocaleString()}</span>
                                                            <span>•</span>
                                                            <span>{notification.vehicleType}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
