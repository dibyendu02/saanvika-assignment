import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocations } from '../api/location';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { MapPin, Eye, Filter } from 'lucide-react';
import ShareLocationDialog from '../components/ShareLocationDialog';
import api from '../api/axios';

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">

                        Shared Locations
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View location sharing records
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'super_admin' && offices.length > 0 && (
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
                        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
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
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View on Map
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
        </div >
    );
}
