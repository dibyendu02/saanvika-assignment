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
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Loader2, MapPin, Plus, Users, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LocationMapPicker from '../components/LocationMapPicker';

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
        longitude: '',
        targetHeadcount: 0,
        targetHeadcount: 0,
        officeId: ''
    });

    const { toast } = useToast();

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingOffice, setDeletingOffice] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
                targetHeadcount: Number(newOffice.targetHeadcount) || 0,
                officeId: newOffice.officeId
            };

            console.log('Creating office with payload:', payload);
            console.log('newOffice state:', newOffice);
            await api.post('/offices', payload);
            setOpen(false);
            setNewOffice({ name: '', address: '', latitude: '', longitude: '', targetHeadcount: 0, officeId: '' });
            fetchOffices(); // Refresh list
        } catch (error) {
            console.error('Error creating office:', error);
            // You might want to add a toast notification here
        } finally {
            setCreating(false);
        }
    };

    const initiateDelete = (office) => {
        setDeletingOffice(office);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingOffice) return;

        setDeleting(true);
        try {
            await api.delete(`/offices/${deletingOffice._id}`);
            toast({ title: 'Success', description: 'Office deleted successfully' });
            fetchOffices();
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete office',
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
            setDeletingOffice(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Offices</h2>
                    <p className="text-gray-500 mt-1">Manage office locations and employee targets</p>
                </div>
                {canCreateOffice && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Office
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New Office</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 px-6 py-4">
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
                                    <Label htmlFor="officeId">Office ID</Label>
                                    <Input
                                        id="officeId"
                                        value={newOffice.officeId}
                                        onChange={e => setNewOffice({ ...newOffice, officeId: e.target.value })}
                                        required
                                        placeholder="e.g. BLR001"
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

                                {/* Map Picker */}
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <LocationMapPicker
                                        latitude={parseFloat(newOffice.latitude) || null}
                                        longitude={parseFloat(newOffice.longitude) || null}
                                        address={newOffice.address}
                                        onLocationChange={(lat, lng) => {
                                            setNewOffice({
                                                ...newOffice,
                                                latitude: lat.toString(),
                                                longitude: lng.toString()
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="targetHeadcount">Target External Employees</Label>
                                    <Input
                                        id="targetHeadcount"
                                        type="number"
                                        min="0"
                                        value={newOffice.targetHeadcount}
                                        onChange={e => setNewOffice({ ...newOffice, targetHeadcount: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g. 50"
                                    />
                                    <p className="text-xs text-gray-500">Target number of external employees for this office</p>
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

            {/* Offices Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Office ID</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Coordinates</TableHead>
                                <TableHead>Employees</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Status</TableHead>
                                {user?.role === 'super_admin' && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : !Array.isArray(offices) || offices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                                        No offices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                offices.map((office, index) => (
                                    <TableRow key={office._id || index}>
                                        <TableCell>
                                            <span className="font-medium text-gray-900">{office.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-mono text-gray-600">{office.officeId}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                {office.address || office.location?.address || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                                                {office.location?.coordinates ?
                                                    `${office.location.coordinates[1].toFixed(4)}, ${office.location.coordinates[0].toFixed(4)}` :
                                                    '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <span className="font-semibold text-gray-900">{office.employeesCount || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm text-gray-700">{office.targetHeadcount || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            {office.targetHeadcount > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${(office.employeesCount || 0) >= office.targetHeadcount
                                                                ? 'bg-emerald-500'
                                                                : 'bg-amber-500'
                                                                }`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    ((office.employeesCount || 0) / office.targetHeadcount) * 100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-medium ${(office.employeesCount || 0) >= office.targetHeadcount
                                                        ? 'text-emerald-600'
                                                        : 'text-amber-600'
                                                        }`}>
                                                        {Math.round(((office.employeesCount || 0) / office.targetHeadcount) * 100)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No target</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${office.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {office.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        {user?.role === 'super_admin' && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => initiateDelete(office)}
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
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
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
                            Are you sure you want to delete <strong className="text-gray-900">{deletingOffice?.name}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800 font-medium flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                Warning: Associated employees and data may be affected.
                            </p>
                        </div>
                    </div>
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
                            Delete Office
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Offices;
