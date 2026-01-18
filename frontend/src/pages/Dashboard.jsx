import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, UserCheck, Gift, Loader2, MapPin, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
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
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-500 mt-1">
                    Welcome back, <span className="font-medium text-gray-700 capitalize">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-elevation-md transition-all duration-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                        <div className="text-3xl font-bold text-gray-900 mt-1">
                                            {loading ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                            ) : (
                                                card.value
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Across all registered locations
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg bg-gray-50 ${card.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Office Targets Section - Only for Admins */}
            {isAdmin && dashboardSummary?.officeTargets && dashboardSummary.officeTargets.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <Target className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle>Office External Employee Targets</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    Track external employee headcount targets across all offices
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashboardSummary.officeTargets.map((office) => (
                                <div key={office.officeId} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{office.officeName}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {office.currentHeadcount} / {office.targetHeadcount} External Employees
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {office.targetHeadcount > 0 ? (
                                                <>
                                                    <span className={`text-2xl font-bold ${office.targetReached ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {office.progress}%
                                                    </span>
                                                    {office.targetReached ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                    ) : (
                                                        <TrendingUp className="h-5 w-5 text-amber-600" />
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400">No target set</span>
                                            )}
                                        </div>
                                    </div>
                                    {office.targetHeadcount > 0 && (
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${office.targetReached ? 'bg-emerald-500' : 'bg-amber-500'
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

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                {canMarkAttendance && !hasMarkedAttendance && !checkingAttendance && (
                    <Card className="border-emerald-200 bg-emerald-50/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-100">
                                        <UserCheck className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Mark Today's Attendance</h3>
                                        <p className="text-sm text-gray-600">
                                            You haven't marked your attendance yet
                                        </p>
                                    </div>
                                </div>
                                <MarkAttendanceDialog onSuccess={handleAttendanceMarked} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {canShareLocation && (
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Quick Location Share</h3>
                                        <p className="text-sm text-gray-600">
                                            Share your current location
                                        </p>
                                    </div>
                                </div>
                                <ShareLocationDialog />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Notice Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                            <AlertCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Internal Notice</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                This dashboard provides a high-level overview of the SAANVIKA operations.
                                Use the sidebar to navigate to specific sections for detailed management.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
