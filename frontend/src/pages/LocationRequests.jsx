import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, User, CheckCircle, XCircle, Navigation, Filter, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import ShareLocationDialog from '../components/ShareLocationDialog';
import { deleteLocationRequest } from '../api/location';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';

const LocationRequests = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null);
    const [offices, setOffices] = useState([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRequest, setDeletingRequest] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const isExternal = user?.role === 'external';
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchRequests();
    }, [filterOfficeId]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchOffices();
        }
    }, [isSuperAdmin]);

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

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {};
            if (isSuperAdmin && filterOfficeId && filterOfficeId !== 'all') {
                params.officeId = filterOfficeId;
            }
            const response = await api.get('/location/requests', { params });
            setRequests(response.data.data.requests || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch location requests',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDenyRequest = async (requestId) => {
        try {
            setResponding(requestId);
            await api.patch(`/location/requests/${requestId}/deny`);
            toast({
                title: 'Success',
                description: 'Location request denied',
            });
            fetchRequests();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to deny request',
                variant: 'destructive',
            });
        } finally {
            setResponding(null);
        }
    };

    const initiateDelete = (request) => {
        setDeletingRequest(request);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingRequest) return;

        setDeleting(true);
        try {
            await deleteLocationRequest(deletingRequest._id);
            toast({
                title: 'Success',
                description: 'Location request deleted successfully',
            });
            fetchRequests();
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete request',
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
            setDeletingRequest(null);
        }
    };

    const handleViewLocation = (locationId) => {
        navigate(`/locations/${locationId}`);
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            shared: 'bg-green-100 text-green-800 border-green-300',
            denied: 'bg-red-100 text-red-800 border-red-300',
            expired: 'bg-gray-100 text-gray-800 border-gray-300',
        };

        const icons = {
            pending: <Clock className="h-3 w-3 mr-1" />,
            shared: <CheckCircle className="h-3 w-3 mr-1" />,
            denied: <XCircle className="h-3 w-3 mr-1" />,
            expired: <Clock className="h-3 w-3 mr-1" />,
        };

        return (
            <Badge className={`${variants[status]} flex items-center w-fit`}>
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">

                        Location Requests
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isExternal
                            ? 'Manage location requests from your team'
                            : 'Track your location requests'}
                    </p>
                </div>
                {isSuperAdmin && offices.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                                className="h-10 w-[180px] rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none cursor-pointer"
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
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="p-10 text-center">
                        <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {isExternal
                                ? 'No location requests received'
                                : 'No location requests sent'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-3">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {isExternal
                                                        ? request.requester?.name
                                                        : request.targetUser?.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {isExternal
                                                        ? request.requester?.email
                                                        : request.targetUser?.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Request Details */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    Requested{' '}
                                                    {format(new Date(request.requestedAt), 'MMM dd, yyyy HH:mm')}
                                                </span>
                                            </div>
                                            {request.respondedAt && (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span>
                                                        Responded{' '}
                                                        {format(new Date(request.respondedAt), 'MMM dd, yyyy HH:mm')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div>{getStatusBadge(request.status)}</div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        {isExternal && request.status === 'pending' && (
                                            <>
                                                <ShareLocationDialog
                                                    requestId={request._id}
                                                    onSuccess={() => {
                                                        toast({
                                                            title: 'Success',
                                                            description: 'Location shared successfully',
                                                        });
                                                        fetchRequests();
                                                    }}
                                                    triggerButton={
                                                        <Button size="sm" className="w-full">
                                                            <MapPin className="h-4 w-4 mr-2" />
                                                            Share Location
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDenyRequest(request._id)}
                                                    disabled={responding === request._id}
                                                >
                                                    {responding === request._id && (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    )}
                                                    Deny
                                                </Button>
                                            </>
                                        )}

                                        {!isExternal && request.status === 'shared' && request.locationId && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleViewLocation(request.locationId._id || request.locationId)}
                                            >
                                                <MapPin className="h-4 w-4 mr-2" />
                                                View Location
                                            </Button>
                                        )}

                                        {request.status === 'pending' && !isExternal && (
                                            <Badge variant="outline" className="text-xs">
                                                Waiting for response
                                            </Badge>
                                        )}

                                        {!isExternal && (request.status === 'pending' || isSuperAdmin || user?.role === 'admin') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => initiateDelete(request)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {request.status === 'pending' ? 'Cancel' : 'Delete'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
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
                            Are you sure you want to delete this location request?
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

export default LocationRequests;
