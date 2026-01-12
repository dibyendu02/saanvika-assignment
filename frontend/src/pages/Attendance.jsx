import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, User, Building } from 'lucide-react';
import { format } from 'date-fns';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await api.get('/attendance');
                const data = response.data.data;
                const docs = data.records || data.docs || (Array.isArray(data) ? data : []);
                setAttendance(docs);
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Attendance Log</h2>
                <div className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(), 'MMMM yyyy')}
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Office</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Marked At</TableHead>
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
                                        No attendance records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendance.map((record, index) => (
                                    <TableRow key={record._id || index}>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                                <div className="font-medium">
                                                    {record.userId?.name || record.userId?.email?.split('@')[0] || 'Unknown'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm">
                                                <Building className="h-3 w-3 mr-1 text-gray-400" />
                                                {record.officeId?.name || 'Remote/Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                                        <TableCell className="text-sm">{formatDate(record.markedAt)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Attendance;
