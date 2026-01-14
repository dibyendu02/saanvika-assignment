import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAttendance } from '../api/attendance';
import { useToast } from '../hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, User, Building, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

const Attendance = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // State
    const [view, setView] = useState('daily'); // 'daily' or 'monthly'
    const [attendance, setAttendance] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    // Fetch daily attendance
    useEffect(() => {
        if (view === 'daily') {
            fetchDailyAttendance();
        }
    }, [selectedDate, view]);

    // Fetch monthly summary
    useEffect(() => {
        if (view === 'monthly') {
            fetchMonthlySummary();
        }
    }, [selectedMonth, view]);

    const fetchDailyAttendance = async () => {
        try {
            setLoading(true);
            const date = new Date(selectedDate);
            const startDate = startOfDay(date).toISOString();
            const endDate = endOfDay(date).toISOString();

            const response = await getAttendance({
                startDate,
                endDate,
                limit: 100,
            });

            if (response.success) {
                setAttendance(response.data.records || []);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch attendance records',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlySummary = async () => {
        try {
            setLoading(true);
            const date = new Date(selectedMonth + '-01');
            const startDate = startOfMonth(date).toISOString();
            const endDate = endOfMonth(date).toISOString();

            const response = await getAttendance({
                startDate,
                endDate,
                limit: 1000, // Get all records for the month
            });

            if (response.success) {
                const records = response.data.records || [];

                // Group by user and count
                const summary = records.reduce((acc, record) => {
                    const userId = record.userId?._id;
                    if (!userId) return acc;

                    if (!acc[userId]) {
                        acc[userId] = {
                            user: record.userId,
                            office: record.officeId,
                            count: 0,
                        };
                    }
                    acc[userId].count++;
                    return acc;
                }, {});

                setMonthlySummary(Object.values(summary));
            }
        } catch (error) {
            console.error('Error fetching monthly summary:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch monthly summary',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch (e) {
            return dateString;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'HH:mm:ss');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Attendance Log</h2>

                {/* View Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={view === 'daily' ? 'default' : 'outline'}
                        onClick={() => setView('daily')}
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Daily View
                    </Button>
                    <Button
                        variant={view === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setView('monthly')}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Monthly Summary
                    </Button>
                </div>
            </div>

            {/* Date/Month Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium">
                            {view === 'daily' ? 'Select Date:' : 'Select Month:'}
                        </label>
                        {view === 'daily' ? (
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        ) : (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                        <span className="text-sm text-gray-500">
                            {view === 'daily'
                                ? format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')
                                : format(new Date(selectedMonth + '-01'), 'MMMM yyyy')
                            }
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Daily View Table */}
            {view === 'daily' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Records for {format(new Date(selectedDate), 'MMM dd, yyyy')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Office</TableHead>
                                    <TableHead>Marked At</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : !Array.isArray(attendance) || attendance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No attendance records found for this date.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendance.map((record, index) => (
                                        <TableRow key={record._id || index}>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {record.userId?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {record.userId?.email || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm">
                                                    <Building className="h-3 w-3 mr-1 text-gray-400" />
                                                    {record.officeId?.name || 'Remote/Unknown'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{formatDateTime(record.markedAt)}</TableCell>
                                            <TableCell className="text-sm font-mono">{formatTime(record.markedAt)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Monthly Summary Table */}
            {view === 'monthly' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Attendance Summary for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Office</TableHead>
                                    <TableHead>Days Present</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : !Array.isArray(monthlySummary) || monthlySummary.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No attendance records found for this month.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    monthlySummary.map((summary, index) => (
                                        <TableRow key={summary.user?._id || index}>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {summary.user?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {summary.user?.email || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {summary.user?.role || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm">
                                                    <Building className="h-3 w-3 mr-1 text-gray-400" />
                                                    {summary.office?.name || 'Remote/Unknown'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-green-600">{summary.count}</span>
                                                    <span className="text-sm text-gray-500">days</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Attendance;
