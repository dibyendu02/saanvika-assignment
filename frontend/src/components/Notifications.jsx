import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Loader2, Info, MapPin, Gift, Clock } from 'lucide-react';
import api from '../api/axios';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications');
            const data = response.data.data;
            setNotifications(data.notifications || []);
            setUnreadCount(data.notifications?.filter(n => !n.isRead).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => {
                const target = prev.find(n => n._id === id);
                if (target && !target.isRead) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n._id !== id);
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        // Navigate based on notification type
        if (notification.type === 'location_request' || notification.type === 'location_shared' || notification.type === 'location_denied') {
            navigate('/location-requests');
        } else if (notification.type === 'goodies_distributed') {
            navigate('/goodies');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'location_request': return <MapPin className="h-4 w-4 text-warning-500" />;
            case 'location_shared': return <Check className="h-4 w-4 text-success-500" />;
            case 'goodies_distributed': return <Gift className="h-4 w-4 text-primary-500" />;
            default: return <Info className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center -translate-y-1 translate-x-1 ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-8 text-primary-600 hover:text-primary-700" onClick={markAllRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {loading && notifications.length === 0 ? (
                        <div className="p-10 flex flex-col items-center justify-center gap-2 opacity-50">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <>
                            {notifications.slice(0, 5).map((n) => (
                                <DropdownMenuItem
                                    key={n._id}
                                    className={`p-4 flex flex-start gap-3 cursor-pointer border-b last:border-0 group relative pr-10 ${!n.isRead ? 'bg-primary-50/50' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-primary-100 ring-2 ring-white' : 'bg-muted'}`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`text-sm font-medium leading-none ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {n.message}
                                        </p>
                                    </div>
                                    <button
                                        className="absolute right-2 top-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-600 transition-all duration-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(n._id);
                                        }}
                                        title="Delete notification"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuItem>
                            ))}
                            {notifications.length > 5 && (
                                <DropdownMenuItem
                                    className="p-2 border-t bg-muted/50 justify-center cursor-pointer text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 focus:bg-primary-50 focus:text-primary-700 w-full flex items-center outline-none"
                                    onClick={() => navigate('/notifications')}
                                >
                                    See all notifications ({notifications.length})
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Notifications;
