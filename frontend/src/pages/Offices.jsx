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
        <div className="space-y-6 pb-24">
            {/* Page Header */}
            <div className="flex justify-between items-center w-full">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Offices</h2>
                    <p className="text-sm text-gray-500 mt-1 hidden sm:block">Manage office locations and employee targets</p>
                </div>
                <div />
            </div>

            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div />
                {canCreateOffice && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hidden md:flex w-full sm:w-auto shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> Add Office
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-[95vw] md:w-full overflow-hidden flex flex-col max-h-[90vh] p-0">
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="text-xl md:text-2xl text-center md:text-left font-semibold">Add New Office</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                                <form id="office-form" onSubmit={handleCreate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold">Office Name</Label>
                                            <Input
                                                id="name"
                                                value={newOffice.name}
                                                onChange={e => setNewOffice({ ...newOffice, name: e.target.value })}
                                                required
                                                placeholder="e.g. Headquarters"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="officeId" className="text-sm font-semibold">Office ID</Label>
                                            <Input
                                                id="officeId"
                                                value={newOffice.officeId}
                                                onChange={e => setNewOffice({ ...newOffice, officeId: e.target.value })}
                                                required
                                                placeholder="e.g. BLR001"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
                                        <Input
                                            id="address"
                                            value={newOffice.address}
                                            onChange={e => setNewOffice({ ...newOffice, address: e.target.value })}
                                            required
                                            placeholder="Full address"
                                            className="h-12 md:h-10"
                                        />
                                    </div>

                                    {/* Map Picker */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Location Picker</Label>
                                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner">
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="targetHeadcount" className="text-sm font-semibold">Target External Employees</Label>
                                        <Input
                                            id="targetHeadcount"
                                            type="number"
                                            min="0"
                                            value={newOffice.targetHeadcount}
                                            onChange={e => setNewOffice({ ...newOffice, targetHeadcount: parseInt(e.target.value) || 0 })}
                                            placeholder="e.g. 50"
                                            className="h-12 md:h-10 font-mono"
                                        />
                                        <p className="text-[11px] text-gray-500 italic">Target number of external employees for this office</p>
                                    </div>
                                </form>
                            </div>
                            <DialogFooter className="p-6 pt-2 bg-gray-50 flex-col md:flex-row gap-2">
                                <Button variant="outline" onClick={() => setOpen(false)} className="w-full md:w-auto h-12 md:h-10 ring-1 ring-gray-200">Cancel</Button>
                                <Button type="submit" form="office-form" disabled={creating} className="w-full md:w-auto h-12 md:h-10 px-8">
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Office
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Offices Table */}
            {/* Offices Table (Desktop) */}
            <Card className="hidden md:block overflow-hidden">
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
                                                <Users className="h-4 w-4 text-primary-500" />
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
                                                                ? 'bg-success-500'
                                                                : 'bg-warning-500'
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
                                                        ? 'text-success-600'
                                                        : 'text-warning-600'
                                                        }`}>
                                                        {Math.round(((office.employeesCount || 0) / office.targetHeadcount) * 100)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No target</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${office.isActive !== false ? 'bg-success-50 text-success-700' : 'bg-destructive/10 text-destructive'
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

            {/* Offices Cards (Mobile) */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : !Array.isArray(offices) || offices.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center text-gray-500">
                            No offices found.
                        </CardContent>
                    </Card>
                ) : (
                    offices.map((office, index) => (
                        <Card key={office._id || index}>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{office.name}</h3>
                                        <p className="text-sm font-mono text-gray-500">{office.officeId}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${office.isActive !== false ? 'bg-success-50 text-success-700' : 'bg-destructive/10 text-destructive'}`}>
                                        {office.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-start text-sm text-gray-600 gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span>{office.address || office.location?.address || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit">
                                        {office.location?.coordinates ?
                                            `${office.location.coordinates[1].toFixed(4)}, ${office.location.coordinates[0].toFixed(4)}` :
                                            '-'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t pt-3">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500">Progress</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-primary-500" />
                                                <span className="font-semibold text-sm">{office.employeesCount || 0}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">/ {office.targetHeadcount || 0}</span>
                                        </div>
                                    </div>
                                    {user?.role === 'super_admin' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2"
                                            onClick={() => initiateDelete(office)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-semibold">
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

            {/* Mobile Floating Action Button */}
            {canCreateOffice && (
                <div className="fixed bottom-6 right-6 lg:hidden z-40">
                    <Button
                        size="icon"
                        className="h-16 w-16 rounded-full shadow-2xl bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all border-2 border-white"
                        onClick={() => setOpen(true)}
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </div>
            )}
        </div >
    );
};

export default Offices;
