import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Loader2, Info, MapPin, Gift, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications');
            const data = response.data.data;
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast({
                title: 'Error',
                description: 'Failed to load notifications',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast({
                title: 'Success',
                description: 'All notifications marked as read',
            });
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast({
                title: 'Success',
                description: 'Notification deleted',
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete notification',
                variant: 'destructive'
            });
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
            case 'location_request': return <MapPin className="h-5 w-5 text-orange-500" />;
            case 'location_shared': return <Check className="h-5 w-5 text-green-500" />;
            case 'goodies_distributed': return <Gift className="h-5 w-5 text-blue-500" />;
            default: return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-900">
                        Notifications
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Stay updated with latest activities
                    </p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <Button variant="outline" size="sm" onClick={markAllRead} className="w-full md:w-auto">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader className="border-b bg-gray-50/50">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        All Notifications
                        <Badge variant="secondary" className="ml-2">
                            {notifications.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            <p className="text-gray-500 mt-2">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Bell className="h-12 w-12 mb-4 opacity-20" />
                            <p>No notifications found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((n) => (
                                <div
                                    key={n._id}
                                    className={`p-4 sm:p-6 flex gap-4 hover:bg-gray-50 transition-colors group ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-blue-100 ring-4 ring-blue-50' : 'bg-gray-100'}`}>
                                        {getIcon(n.type)}
                                    </div>

                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(n)}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-base font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {n.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center self-center pl-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(n._id);
                                            }}
                                            title="Delete notification"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationsPage;
