import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, UserCheck, Gift, Loader2, MapPin } from 'lucide-react';
import ShareLocationDialog from '../components/ShareLocationDialog';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        offices: 0,
        attendance: 0,
        goodies: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [officesRes, attendanceRes, goodiesRes] = await Promise.all([
                    api.get('/offices?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                    api.get('/attendance?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                    api.get('/goodies/distributions?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                ]);

                setStats({
                    offices: officesRes.data.data?.total || 0,
                    attendance: attendanceRes.data.data?.total || 0,
                    goodies: goodiesRes.data.data?.total || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Offices', value: stats.offices, icon: Building2, color: 'text-blue-600' },
        { title: 'Attendance Records', value: stats.attendance, icon: UserCheck, color: 'text-green-600' },
        { title: 'Goodies Managed', value: stats.goodies, icon: Gift, color: 'text-purple-600' },
    ];

    const canShareLocation = user?.role === 'internal' || user?.role === 'external';

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome back, <span className="font-semibold text-foreground capitalize">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground font-semibold">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full bg-gray-50 ${card.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-muted" />
                                    ) : (
                                        card.value
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Across all registered locations
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {canShareLocation && (
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                Quick Location Share
                            </h3>
                            <p className="text-sm text-gray-600">
                                Share your current location with your organization
                            </p>
                        </div>
                        <ShareLocationDialog />
                    </div>
                </Card>
            )}

            <Card className="p-6">
                <h3 className="font-semibold mb-2">Internal Notice</h3>
                <p className="text-sm text-gray-600">
                    This dashboard provides a high-level overview of the SAANVIKA operations.
                    Use the sidebar to navigate to specific sections for detailed management.
                </p>
            </Card>
        </div>
    );
};

export default Dashboard;
