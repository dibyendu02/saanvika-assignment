import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, UserCheck, Gift, Loader2, MapPin, Users, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import ShareLocationDialog from '../components/ShareLocationDialog';
import MarkAttendanceDialog from '../components/MarkAttendanceDialog';
import { checkTodayAttendance } from '../api/attendance';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        offices: 0,
        attendance: 0,
        goodies: 0,
    });
    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasMarkedAttendance, setHasMarkedAttendance] = useState(true);
    const [checkingAttendance, setCheckingAttendance] = useState(false);

    const isAdmin = ['super_admin', 'admin'].includes(user?.role);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [officesRes, attendanceRes, goodiesRes, summaryRes] = await Promise.all([
                    api.get('/offices?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                    api.get('/attendance?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                    api.get('/goodies/distributions?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                    isAdmin ? api.get('/dashboard/summary').catch(() => ({ data: { data: { summary: null } } })) : Promise.resolve({ data: { data: { summary: null } } }),
                ]);

                setStats({
                    offices: officesRes.data.data?.total || 0,
                    attendance: attendanceRes.data.data?.total || 0,
                    goodies: goodiesRes.data.data?.total || 0,
                });

                if (isAdmin && summaryRes.data.data?.summary) {
                    setDashboardSummary(summaryRes.data.data.summary);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isAdmin]);

    // Check if user has marked attendance today
    useEffect(() => {
        const checkAttendance = async () => {
            if (user?.role === 'internal' || user?.role === 'external') {
                setCheckingAttendance(true);
                const marked = await checkTodayAttendance();
                setHasMarkedAttendance(marked);
                setCheckingAttendance(false);
            }
        };
        checkAttendance();
    }, [user]);

    const handleAttendanceMarked = async () => {
        setHasMarkedAttendance(true);
        // Refresh stats
        const attendanceRes = await api.get('/attendance?limit=1').catch(() => ({ data: { data: { total: 0 } } }));
        setStats(prev => ({ ...prev, attendance: attendanceRes.data.data?.total || 0 }));
    };

    const cards = [
        { title: 'Total Offices', value: stats.offices, icon: Building2, color: 'text-blue-600' },
        { title: 'Attendance Records', value: stats.attendance, icon: UserCheck, color: 'text-green-600' },
        { title: 'Goodies Managed', value: stats.goodies, icon: Gift, color: 'text-purple-600' },
    ];

    const canShareLocation = user?.role === 'internal' || user?.role === 'external';
    const canMarkAttendance = user?.role === 'internal' || user?.role === 'external';

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

            {/* Office Targets Section - Only for Admins */}
            {isAdmin && dashboardSummary?.officeTargets && dashboardSummary.officeTargets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-orange-600" />
                            Office External Employee Targets
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Track external employee headcount targets across all offices
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashboardSummary.officeTargets.map((office) => (
                                <div key={office.officeId} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-blue-50">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{office.officeName}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {office.currentHeadcount} / {office.targetHeadcount} External Employees
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {office.targetHeadcount > 0 ? (
                                                <>
                                                    <span className={`text-2xl font-bold ${office.targetReached ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {office.progress}%
                                                    </span>
                                                    {office.targetReached ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <TrendingUp className="h-5 w-5 text-orange-600" />
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No target set</span>
                                            )}
                                        </div>
                                    </div>
                                    {office.targetHeadcount > 0 && (
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${office.targetReached ? 'bg-green-600' : 'bg-orange-500'
                                                    }`}
                                                style={{ width: `${Math.min(office.progress, 100)}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {canMarkAttendance && !hasMarkedAttendance && !checkingAttendance && (
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-green-600" />
                                Mark Today's Attendance
                            </h3>
                            <p className="text-sm text-gray-600">
                                You haven't marked your attendance for today yet
                            </p>
                        </div>
                        <MarkAttendanceDialog onSuccess={handleAttendanceMarked} />
                    </div>
                </Card>
            )}

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
