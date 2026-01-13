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
import { Loader2, MapPin } from 'lucide-react';

const Offices = () => {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const response = await api.get('/offices');
                const data = response.data.data;
                const docs = data.offices || data.docs || (Array.isArray(data) ? data : []);
                setOffices(docs);
            } catch (error) {
                console.error('Error fetching offices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffices();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Offices</h2>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : !Array.isArray(offices) || offices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No offices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                offices.map((office, index) => (
                                    <TableRow key={office._id || index}>
                                        <TableCell className="font-medium">{office.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {office.address || office.location?.address || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{office.code || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${office.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {office.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
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

export default Offices;
