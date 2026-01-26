import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAttendance, getMonthlySummary, deleteAttendance } from '../api/attendance';
import api from '../api/axios';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, User, Building, Filter, Trash2, AlertTriangle, Clock, X } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

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

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Office filter for super admin
    const [offices, setOffices] = useState([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const isSuperAdmin = user?.role === 'super_admin';
    const [showFilters, setShowFilters] = useState(false);

    // Reset page on date change or view change
    useEffect(() => {
        setPage(1);
    }, [selectedDate, view, filterOfficeId]);

    // Fetch offices for super admin
    useEffect(() => {
        if (isSuperAdmin) {
            fetchOffices();
        }
    }, [isSuperAdmin]);

    // Fetch daily attendance
    useEffect(() => {
        if (view === 'daily') {
            fetchDailyAttendance();
        }
    }, [selectedDate, view, page, filterOfficeId]);

    // Fetch monthly summary
    useEffect(() => {
        if (view === 'monthly') {
            fetchMonthlySummary();
        }
    }, [selectedMonth, view, filterOfficeId]);

    const fetchOffices = async () => {
        try {
            const response = await api.get('/offices');
            const data = response.data.data;
            const docs = data.offices || data.docs || (Array.isArray(data) ? data : []);
            setOffices(docs);
        } catch (error) {
            console.error('Error fetching offices:', error);
        }
    };

    const fetchDailyAttendance = async () => {
        try {
            setLoading(true);
            const date = new Date(selectedDate);
            const startDate = startOfDay(date).toISOString();
            const endDate = endOfDay(date).toISOString();

            const params = {
                startDate,
                endDate,
                page,
                limit,
            };

            // Add office filter for super admin
            if (isSuperAdmin && filterOfficeId && filterOfficeId !== 'all') {
                params.officeId = filterOfficeId;
            }

            const response = await getAttendance(params);

            if (response.success) {
                setAttendance(response.data.records || []);
                setTotalPages(response.data.totalPages || 1);
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
            const params = { month: selectedMonth };

            // Add office filter for super admin
            if (isSuperAdmin && filterOfficeId && filterOfficeId !== 'all') {
                params.officeId = filterOfficeId;
            }

            const response = await getMonthlySummary(params.month, params.officeId);

            if (response.success) {
                setMonthlySummary(response.data.summary || []);
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

    const initiateDelete = (record) => {
        setDeletingRecord(record);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingRecord) return;

        setDeleting(true);
        try {
            await deleteAttendance(deletingRecord._id);
            toast({ title: 'Success', description: 'Attendance record deleted successfully' });
            fetchDailyAttendance();
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete attendance record',
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
            setDeletingRecord(null);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex justify-between items-center w-full">
                    <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Attendance</h2>
                        <p className="text-sm text-gray-500 mt-1 hidden sm:block">Track employee attendance records</p>
                    </div>

                    <div className="flex items-center gap-2 lg:hidden">
                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-10 w-10 rounded-xl border-2 transition-all duration-200 ${showFilters ? 'bg-primary-50 border-primary text-primary' : 'bg-white'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
                        <Button
                            variant={view === 'daily' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('daily')}
                            className={`flex-1 sm:flex-none h-10 rounded-lg ${view === 'daily' ? 'shadow-md shadow-primary/20' : 'hover:bg-gray-200'}`}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Daily
                        </Button>
                        <Button
                            variant={view === 'monthly' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('monthly')}
                            className={`flex-1 sm:flex-none h-10 rounded-lg ${view === 'monthly' ? 'shadow-md shadow-primary/20' : 'hover:bg-gray-200'}`}
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            Monthly
                        </Button>
                    </div>

                    <div className="hidden lg:flex items-center gap-3">
                        {isSuperAdmin && offices.length > 0 && (
                            <div className="relative">
                                <Building className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <select
                                    className="h-10 w-[180px] rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                                    value={filterOfficeId}
                                    onChange={e => setFilterOfficeId(e.target.value)}
                                >
                                    <option value="all">All Offices</option>
                                    {offices.map((office) => (
                                        <option key={office._id} value={office._id}>
                                            {office.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {view === 'daily' && (
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        )}

                        {view === 'monthly' && (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        )}
                    </div>
                </div>
            </div>

            {showFilters && (
                <Card className="lg:hidden bg-gray-50/50 border-2 border-primary/10 animate-in slide-in-from-top duration-300 overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <Label className="text-base font-bold flex items-center gap-2 text-primary">
                                <Clock className="h-4 w-4" /> Attendance Filters
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(false)}
                                className="h-8 w-8 rounded-full p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {isSuperAdmin && offices.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Office</Label>
                                    <div className="relative">
                                        <Building className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <select
                                            className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2 text-base shadow-sm focus:border-primary focus:outline-none appearance-none"
                                            value={filterOfficeId}
                                            onChange={e => setFilterOfficeId(e.target.value)}
                                        >
                                            <option value="all">All Offices</option>
                                            {offices.map((office) => (
                                                <option key={office._id} value={office._id}>
                                                    {office.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {view === 'daily' ? 'Select Date' : 'Select Month'}
                                </Label>
                                {view === 'daily' ? (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="h-12 w-full px-4 border-2 border-gray-200 rounded-xl text-base focus:border-primary focus:outline-none"
                                    />
                                ) : (
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="h-12 w-full px-4 border-2 border-gray-200 rounded-xl text-base focus:border-primary focus:outline-none"
                                    />
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                            onClick={() => setShowFilters(false)}
                        >
                            Apply Selection
                        </Button>
                    </CardContent>
                </Card>
            )}

            {view === 'daily' && (
                <Card className="overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary-50">
                                <Calendar className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                                <CardTitle className="font-semibold">Attendance Records</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">{format(new Date(selectedDate), 'MMMM dd, yyyy')}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Office</TableHead>
                                        <TableHead>Marked At</TableHead>
                                        <TableHead>Time</TableHead>
                                        {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !Array.isArray(attendance) || attendance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                                                No attendance records found for this date.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendance.map((record, index) => (
                                            <TableRow key={record._id || index}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                            {record.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {record.userId?.name || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {record.userId?.email || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Building className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                        {record.officeId?.name || 'Remote/Unknown'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-700">{formatDateTime(record.markedAt)}</TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded text-gray-700">
                                                        {formatTime(record.markedAt)}
                                                    </span>
                                                </TableCell>
                                                {isSuperAdmin && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => initiateDelete(record)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-100">
                            {loading ? (
                                <div className="p-4 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                </div>
                            ) : !Array.isArray(attendance) || attendance.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No attendance records found.
                                </div>
                            ) : (
                                attendance.map((record, index) => (
                                    <div key={record._id || index} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                    {record.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{record.userId?.name || 'Unknown'}</h3>
                                                    <p className="text-xs text-gray-500">{record.userId?.email}</p>
                                                </div>
                                            </div>
                                            {isSuperAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2"
                                                    onClick={() => initiateDelete(record)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center text-gray-600">
                                                <Building className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                <span className="truncate">{record.officeId?.name || 'Remote/Unknown'}</span>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Clock className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-xs">{formatTime(record.markedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {view === 'monthly' && (
                <Card className="overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success-50">
                                <Calendar className="h-5 w-5 text-success-600" />
                            </div>
                            <div>
                                <CardTitle className="font-semibold">Monthly Summary</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block">
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
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !Array.isArray(monthlySummary) || monthlySummary.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                                                No attendance records found for this month.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        monthlySummary.map((summary, index) => (
                                            <TableRow key={summary.user?._id || index}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                            {summary.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {summary.user?.name || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {summary.user?.email || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-primary-50 text-primary-700 uppercase">
                                                        {summary.user?.role || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Building className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                        {summary.office?.name || 'Remote/Unknown'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-bold text-success-600">{summary.count}</span>
                                                        <span className="text-sm text-gray-500">days</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-100">
                            {loading ? (
                                <div className="p-4 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                </div>
                            ) : !Array.isArray(monthlySummary) || monthlySummary.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No attendance records found for this month.
                                </div>
                            ) : (
                                monthlySummary.map((summary, index) => (
                                    <div key={summary.user?._id || index} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                    {summary.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{summary.user?.name || 'Unknown'}</h3>
                                                    <p className="text-xs text-gray-500">{summary.user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl font-bold text-success-600">{summary.count}</span>
                                                <span className="text-xs text-gray-500">days</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-gray-600">
                                                <Building className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                <span className="truncate max-w-[150px]">{summary.office?.name || 'Remote/Unknown'}</span>
                                            </div>
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary-50 text-primary-700 uppercase">
                                                {summary.user?.role || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-red-50">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this attendance record for <strong className="text-gray-900">{deletingRecord?.userId?.name}</strong>?
                            <br />This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Attendance;
