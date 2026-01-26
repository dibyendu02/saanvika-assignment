import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocations } from '../api/location';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { MapPin, Eye, Filter, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import ShareLocationDialog from '../components/ShareLocationDialog';
import api from '../api/axios';
import { deleteLocation } from '../api/location';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
    });
    const [offices, setOffices] = useState([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingLocation, setDeletingLocation] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLocations();
    }, [pagination.currentPage, filterOfficeId]);

    useEffect(() => {
        if (user?.role === 'super_admin') {
            fetchOffices();
        }
    }, [user?.role]);

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

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await getLocations({
                page: pagination.currentPage,
                limit: 10,
                officeId: filterOfficeId !== 'all' ? filterOfficeId : undefined
            });

            if (response.success) {
                setLocations(response.data.records || []);
                setPagination({
                    currentPage: response.data.currentPage || 1,
                    totalPages: response.data.totalPages || 1,
                    totalRecords: response.data.totalRecords || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch locations',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewOnMap = (locationId) => {
        navigate(`/locations/${locationId}`);
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch {
            return dateString;
        }
    };

    const handleLocationShared = () => {
        // Refresh the locations list after sharing
        fetchLocations();
    };

    const initiateDelete = (location) => {
        setDeletingLocation(location);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingLocation) return;

        setDeleting(true);
        try {
            await deleteLocation(deletingLocation._id);
            toast({ title: 'Success', description: 'Location record deleted successfully' });
            fetchLocations();
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete location record',
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
            setDeletingLocation(null);
        }
    };

    // Check if user can share location (internal or external)
    const canShareLocation = user?.role === 'internal' || user?.role === 'external';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading locations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center w-full">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Shared Locations</h1>
                    <p className="text-gray-600 mt-1 hidden sm:block">View location sharing records</p>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                    {user?.role === 'super_admin' && (
                        <div className="relative">
                            <select
                                className="h-10 w-10 opacity-0 absolute inset-0 cursor-pointer z-10"
                                value={filterOfficeId}
                                onChange={e => setFilterOfficeId(e.target.value)}
                            >
                                <option value="all">All</option>
                                {offices.map((office) => (
                                    <option key={office._id} value={office._id}>{office.name}</option>
                                ))}
                            </select>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2">
                                <Filter className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden md:flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                    {user?.role === 'super_admin' && offices.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Filter className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <select
                                    className="h-10 w-full sm:w-[180px] rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none cursor-pointer"
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
                    {canShareLocation && (
                        <ShareLocationDialog onSuccess={handleLocationShared} />
                    )}
                </div>
            </div>

            {
                locations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No location records found</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reason
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {locations.map((location) => (
                                        <tr key={location._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {location.userId?.name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {location.userId?.email || ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-50 text-primary-700">
                                                    {location.userId?.role || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(location.sharedAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {location.reason ? (
                                                    <span className="italic">"{location.reason}"</span>
                                                ) : (
                                                    <span className="text-gray-400">No reason provided</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewOnMap(location._id)}
                                                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium mr-4"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View on Map
                                                </button>
                                                {user?.role === 'super_admin' && (
                                                    <button
                                                        onClick={() => initiateDelete(location)}
                                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-4">
                            {locations.map((location) => (
                                <div key={location._id} className="bg-white rounded-lg shadow p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{location.userId?.name || 'Unknown'}</h3>
                                            <p className="text-xs text-gray-500">{location.userId?.email || ''}</p>
                                        </div>
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-50 text-primary-700">
                                            {location.userId?.role || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500">Time</span>
                                            <p className="text-gray-700">{formatDate(location.sharedAt)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500">Reason</span>
                                            <p className="text-gray-700 truncate">{location.reason || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t flex justify-end gap-2">
                                        <button
                                            onClick={() => handleViewOnMap(location._id)}
                                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm font-medium px-2 py-1"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Map
                                        </button>
                                        {user?.role === 'super_admin' && (
                                            <button
                                                onClick={() => initiateDelete(location)}
                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
                                <div className="text-sm text-gray-700">
                                    Showing page {pagination.currentPage} of {pagination.totalPages}
                                    ({pagination.totalRecords} total records)
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        disabled={pagination.currentPage === 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )
            }
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
                            Are you sure you want to delete this location record for <strong className="text-gray-900">{deletingLocation?.userId?.name}</strong>?
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

            {/* Mobile FAB */}
            {canShareLocation && (
                <div className="md:hidden fixed bottom-6 right-6 z-50">
                    <ShareLocationDialog onSuccess={handleLocationShared} isFab />
                </div>
            )}
        </div >
    );
}
