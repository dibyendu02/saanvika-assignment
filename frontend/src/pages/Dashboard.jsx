import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, UserCheck, Gift, Loader2, MapPin, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import ShareLocationDialog from '../components/ShareLocationDialog';
import MarkAttendanceDialog from '../components/MarkAttendanceDialog';
import { checkTodayAttendance } from '../api/attendance';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
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
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [officesRes, attendanceRes, goodiesRes, summaryRes] = await Promise.all([
                    isSuperAdmin ? api.get('/offices?limit=1').catch(() => ({ data: { data: { total: 0 } } })) : Promise.resolve({ data: { data: { total: 0 } } }),
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
        { title: 'Total Offices', value: stats.offices, icon: Building2, color: 'text-primary-600', href: '/offices', roles: ['super_admin'] },
        { title: 'Attendance Records', value: stats.attendance, icon: UserCheck, color: 'text-success-600', href: '/attendance' },
        { title: 'Goodies Managed', value: stats.goodies, icon: Gift, color: 'text-accent-foreground', href: '/goodies' },
    ];

    const visibleCards = cards.filter(card => !card.roles || card.roles.includes(user?.role));

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
                {visibleCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.title}
                            className="hover:shadow-elevation-md transition-all duration-300 cursor-pointer group hover:-translate-y-1 active:scale-[0.98]"
                            onClick={() => navigate(card.href)}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">{card.title}</p>
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
                                    <div className={`p-3 rounded-xl bg-gray-50 transition-all duration-300 group-hover:bg-primary group-hover:text-white ${card.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions - Only show for employees who can mark attendance or share location */}
            {(canMarkAttendance || canShareLocation) && (
                <div className="grid gap-4 lg:grid-cols-5">
                    {/* Notice Card - 60% width (3/5) */}
                    <Card className="lg:col-span-3 md:max-h-[110px]">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-gray-100 flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="space-y-1 md:max-h-[70px] md:overflow-y-auto pr-1">
                                    <h3 className="font-semibold text-gray-900 leading-tight">Internal Notice</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        This dashboard provides a high-level overview of the SAANVIKA operations.
                                        Use the sidebar to navigate to specific sections for detailed management.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions - 40% width (2/5) - Stacked on the right */}
                    <div className="lg:col-span-2 space-y-4">
                        {canMarkAttendance && !hasMarkedAttendance && !checkingAttendance && (
                            <Card className="border-success-200 bg-success-50/50">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-success-100">
                                                <UserCheck className="h-5 w-5 text-success-600" />
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
                            <Card className="border-primary-200 bg-primary-50/50">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary-100">
                                                <MapPin className="h-5 w-5 text-primary-600" />
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
                </div>
            )}

            {/* Notice Card and Office Targets - Side by Side Layout - Only for Admins without quick actions */}
            {isAdmin && !(canMarkAttendance || canShareLocation) && (
                <div className="grid gap-4 lg:grid-cols-5">
                    {/* Notice Card - 60% width (3/5) */}
                    <Card className="lg:col-span-3 md:max-h-[110px]">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-gray-100 flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="space-y-1 md:max-h-[70px] md:overflow-y-auto pr-1">
                                    <h3 className="font-semibold text-gray-900 leading-tight">Internal Notice</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        This dashboard provides a high-level overview of the SAANVIKA operations.
                                        Use the sidebar to navigate to specific sections for detailed management.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Office Targets Section - 40% width (2/5) - Only for Admins */}
                    {dashboardSummary?.officeTargets && dashboardSummary.officeTargets.length > 0 && (
                        <Card className="lg:col-span-2">
                            <CardHeader className="py-3 ">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-warning-50">
                                        <Target className="h-4 w-4 text-warning-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">External Employee Targets</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-3">
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {dashboardSummary.officeTargets.map((office) => (
                                        <div key={office.officeId} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h4 className="font-medium text-sm text-gray-900">{office.officeName}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {office.currentHeadcount} / {office.targetHeadcount}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-lg font-bold ${office.targetReached ? 'text-success-600' : 'text-warning-600'}`}>
                                                        {office.progress}%
                                                    </span>
                                                    {office.targetReached ? (
                                                        <CheckCircle2 className="h-4 w-4 text-success-600" />
                                                    ) : (
                                                        <TrendingUp className="h-4 w-4 text-warning-600" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${office.targetReached ? 'bg-success-500' : 'bg-warning-500'}`}
                                                    style={{ width: `${Math.min(office.progress, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Office Targets for Admins with Quick Actions - Separate row */}
            {isAdmin && (canMarkAttendance || canShareLocation) && dashboardSummary?.officeTargets && dashboardSummary.officeTargets.length > 0 && (
                <Card>
                    <CardHeader className="py-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning-50">
                                <Target className="h-4 w-4 text-warning-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">External Employee Targets</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {dashboardSummary.officeTargets.map((office) => (
                                <div key={office.officeId} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-sm text-gray-900">{office.officeName}</h4>
                                            <p className="text-xs text-gray-500">
                                                {office.currentHeadcount} / {office.targetHeadcount}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-lg font-bold ${office.targetReached ? 'text-success-600' : 'text-warning-600'}`}>
                                                {office.progress}%
                                            </span>
                                            {office.targetReached ? (
                                                <CheckCircle2 className="h-4 w-4 text-success-600" />
                                            ) : (
                                                <TrendingUp className="h-4 w-4 text-warning-600" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-300 ${office.targetReached ? 'bg-success-500' : 'bg-warning-500'}`}
                                            style={{ width: `${Math.min(office.progress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Dashboard;
