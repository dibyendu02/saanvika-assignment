import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, MapPin, Plus, Users } from 'lucide-react';

const Offices = () => {
    const { user } = useAuth();
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newOffice, setNewOffice] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: ''
    });

    // Check if user is admin or super_admin
    const canCreateOffice = ['super_admin', 'admin'].includes(user?.role);

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

    useEffect(() => {
        fetchOffices();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const payload = {
                name: newOffice.name,
                address: newOffice.address,
                // Ensure location object structure matches backend expectations
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(newOffice.longitude), parseFloat(newOffice.latitude)]
                },
                targetHeadcount: parseInt(newOffice.targetHeadcount) || 0
            };

            await api.post('/offices', payload);
            setOpen(false);
            setNewOffice({ name: '', address: '', latitude: '', longitude: '', targetHeadcount: 0 });
            fetchOffices(); // Refresh list
        } catch (error) {
            console.error('Error creating office:', error);
            // You might want to add a toast notification here
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Offices</h2>
                {canCreateOffice && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> Add Office
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Office</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Office Name</Label>
                                    <Input
                                        id="name"
                                        value={newOffice.name}
                                        onChange={e => setNewOffice({ ...newOffice, name: e.target.value })}
                                        required
                                        placeholder="e.g. Headquarters"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={newOffice.address}
                                        onChange={e => setNewOffice({ ...newOffice, address: e.target.value })}
                                        required
                                        placeholder="Full address"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lat">Latitude</Label>
                                        <Input
                                            id="lat"
                                            type="number"
                                            step="any"
                                            value={newOffice.latitude}
                                            onChange={e => setNewOffice({ ...newOffice, latitude: e.target.value })}
                                            required
                                            placeholder="e.g. 12.9716"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lng">Longitude</Label>
                                        <Input
                                            id="lng"
                                            type="number"
                                            step="any"
                                            value={newOffice.longitude}
                                            onChange={e => setNewOffice({ ...newOffice, longitude: e.target.value })}
                                            required
                                            placeholder="e.g. 77.5946"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetHeadcount">Target External Employees</Label>
                                    <Input
                                        id="targetHeadcount"
                                        type="number"
                                        min="0"
                                        value={newOffice.targetHeadcount}
                                        onChange={e => setNewOffice({ ...newOffice, targetHeadcount: e.target.value })}
                                        placeholder="e.g. 50"
                                    />
                                    <p className="text-xs text-muted-foreground">Target number of external employees for this office</p>
                                </div>
                                <Button type="submit" className="w-full mt-4" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Office
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Coordinates</TableHead>
                                <TableHead>Employees</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Target Status</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : !Array.isArray(offices) || offices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
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
                                        <TableCell>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {office.location?.coordinates ?
                                                    `${office.location.coordinates[1].toFixed(4)}, ${office.location.coordinates[0].toFixed(4)}` :
                                                    '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-blue-600" />
                                                <span className="font-semibold">{office.employeesCount || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{office.targetHeadcount || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            {office.targetHeadcount > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${(office.employeesCount || 0) >= office.targetHeadcount
                                                                ? 'bg-green-600'
                                                                : 'bg-orange-500'
                                                                }`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    ((office.employeesCount || 0) / office.targetHeadcount) * 100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-semibold ${(office.employeesCount || 0) >= office.targetHeadcount
                                                        ? 'text-green-600'
                                                        : 'text-orange-600'
                                                        }`}>
                                                        {Math.round(((office.employeesCount || 0) / office.targetHeadcount) * 100)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No target</span>
                                            )}
                                        </TableCell>
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
