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
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, Gift, CheckCircle2, AlertTriangle, Users, History, Mail, Calendar, Building, UserCheck, Filter, X, Eye, Package, User, Trash2, Upload, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import BulkGoodiesUpload from '../components/BulkGoodiesUpload';

const Goodies = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [distributions, setDistributions] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [claimsOpen, setClaimsOpen] = useState(false);
    const [selectedDistribution, setSelectedDistribution] = useState(null);
    const [distributionClaims, setDistributionClaims] = useState([]);
    const [eligibleEmployees, setEligibleEmployees] = useState([]);
    const [claimSearchQuery, setClaimSearchQuery] = useState('');
    const [fetchingClaims, setFetchingClaims] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null); // { type, id, name }
    const [deleting, setDeleting] = useState(false);

    // Manual claim modal state
    const [manualClaimOpen, setManualClaimOpen] = useState(false);
    const [manualClaimEmployee, setManualClaimEmployee] = useState(null);
    const [markingClaim, setMarkingClaim] = useState(false);

    // Employee selection state for targeted distribution
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // Form state
    const [newItem, setNewItem] = useState({
        goodiesType: '',
        totalQuantity: 0,
        officeId: '',
        distributionDate: new Date().toISOString().split('T')[0],
        isForAllEmployees: true
    });

    const isManagement = ['super_admin', 'admin'].includes(user?.role);
    const canClaim = ['internal', 'external'].includes(user?.role);

    useEffect(() => {
        fetchDistributions();
        if (isManagement) {
            fetchOffices();
        }
    }, [isManagement, filterOfficeId]);

    const fetchDistributions = async () => {
        try {
            const params = new URLSearchParams();
            if (filterOfficeId && filterOfficeId !== 'all') {
                params.append('officeId', filterOfficeId);
            }
            const response = await api.get(`/goodies/distributions?${params.toString()}`);
            const data = response.data.data;
            const docs = data.distributions || data.docs || (Array.isArray(data) ? data : []);
            setDistributions(docs);
        } catch (error) {
            console.error('Error fetching distributions:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchEmployeesByOffice = async (officeId) => {
        if (!officeId) {
            setEmployees([]);
            return;
        }
        setLoadingEmployees(true);
        try {
            const response = await api.get(`/users/office/${officeId}`);
            const data = response.data.data;
            const docs = data.users || data.employees || (Array.isArray(data) ? data : []);
            const filteredEmployees = docs.filter(emp => ['internal', 'external'].includes(emp.role));
            setEmployees(filteredEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchClaimsForDistribution = async (dist) => {
        setSelectedDistribution(dist);
        setClaimsOpen(true);
        setFetchingClaims(true);
        setClaimSearchQuery('');
        try {
            // Fetch both claims and eligible employees in parallel
            const [claimsResponse, eligibleResponse] = await Promise.all([
                api.get(`/goodies/received?distributionId=${dist._id}&limit=100`),
                api.get(`/goodies/distributions/${dist._id}/eligible-employees`)
            ]);

            const claimsData = claimsResponse.data.data;
            const records = claimsData.records || (Array.isArray(claimsData) ? claimsData : []);
            setDistributionClaims(records);

            const eligibleData = eligibleResponse.data.data;
            const eligible = eligibleData.employees || (Array.isArray(eligibleData) ? eligibleData : []);
            setEligibleEmployees(eligible);
        } catch (error) {
            console.error('Error fetching claims:', error);
            toast({ title: 'Error', description: 'Failed to fetch claim history', variant: 'destructive' });
        } finally {
            setFetchingClaims(false);
        }
    };

    const handleOfficeChange = (officeId) => {
        setNewItem({ ...newItem, officeId });
        setSelectedEmployees([]);
        if (!newItem.isForAllEmployees) {
            fetchEmployeesByOffice(officeId);
        }
    };

    const handleTargetTypeChange = (isForAll) => {
        setNewItem({ ...newItem, isForAllEmployees: isForAll });
        setSelectedEmployees([]);
        if (!isForAll && newItem.officeId) {
            fetchEmployeesByOffice(newItem.officeId);
        }
    };

    const toggleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const toggleAllEmployees = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map(emp => emp._id));
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!newItem.officeId) {
            toast({ title: 'Error', description: 'Please select an office', variant: 'destructive' });
            return;
        }

        if (!newItem.isForAllEmployees && selectedEmployees.length === 0) {
            toast({ title: 'Error', description: 'Please select at least one employee', variant: 'destructive' });
            return;
        }

        setCreating(true);
        try {
            const payload = {
                ...newItem,
                targetEmployees: newItem.isForAllEmployees ? [] : selectedEmployees
            };
            await api.post('/goodies/distributions', payload);
            toast({ title: 'Success', description: 'Goodie distribution created' });
            fetchDistributions();
            setOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create distribution', variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    };

    const initiateClaim = (distribution) => {
        setSelectedDistribution(distribution);
        setConfirmOpen(true);
    };

    const handleMarkReceived = async () => {
        if (!selectedDistribution) return;

        setClaiming(true);
        try {
            await api.post('/goodies/receive', { distributionId: selectedDistribution._id });
            toast({ title: 'Success', description: 'Goodies received successfully' });
            fetchDistributions();
            setConfirmOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to receive goodies', variant: 'destructive' });
        } finally {
            setClaiming(false);
            setSelectedDistribution(null);
        }
    };

    const initiateDeleteDistribution = (dist) => {
        setDeletingItem({ type: 'distribution', id: dist._id, name: dist.goodiesType });
        setDeleteDialogOpen(true);
    };

    const initiateDeleteClaim = (claim) => {
        setDeletingItem({ type: 'claim', id: claim._id, name: 'this claim record' });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;

        setDeleting(true);
        try {
            if (deletingItem.type === 'distribution') {
                await api.delete(`/goodies/distributions/${deletingItem.id}`);
                fetchDistributions();
                toast({ title: 'Success', description: 'Distribution deleted successfully' });
            } else if (deletingItem.type === 'claim') {
                await api.delete(`/goodies/received/${deletingItem.id}`);
                // Refresh both the claims dialog and the main distributions list
                if (selectedDistribution) fetchClaimsForDistribution(selectedDistribution);
                fetchDistributions(); // Refresh to update inventory and claimed counts
                toast({ title: 'Success', description: 'Claim record deleted successfully' });
            }
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete item', variant: 'destructive' });
        } finally {
            setDeleting(false);
            setDeletingItem(null);
        }
    };

    // Manual claim functions
    const initiateManualClaim = (employee) => {
        setManualClaimEmployee(employee);
        setManualClaimOpen(true);
    };

    const confirmManualClaim = async () => {
        if (!manualClaimEmployee || !selectedDistribution) return;

        setMarkingClaim(true);
        try {
            await api.post(`/goodies/distributions/${selectedDistribution._id}/mark-claim`, {
                userId: manualClaimEmployee._id
            });
            toast({ title: 'Success', description: `Marked ${manualClaimEmployee.name} as claimed` });
            // Refresh claims list and distributions
            fetchClaimsForDistribution(selectedDistribution);
            fetchDistributions();
            setManualClaimOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to mark claim', variant: 'destructive' });
        } finally {
            setMarkingClaim(false);
            setManualClaimEmployee(null);
        }
    };

    const handleDialogChange = (isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            setNewItem({
                goodiesType: '',
                totalQuantity: 0,
                officeId: '',
                distributionDate: new Date().toISOString().split('T')[0],
                isForAllEmployees: true
            });
            setSelectedEmployees([]);
            setEmployees([]);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex justify-between items-center w-full">
                    <div className="space-y-1">
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight">Goodies</h2>
                        <p className="text-sm text-muted-foreground hidden sm:block">Manage and track goodies distribution across offices</p>
                    </div>

                    {/* Mobile Actions Container */}
                    <div className="flex items-center gap-2 lg:hidden">
                        {isManagement && (
                            <Button
                                variant="outline"
                                size="icon"
                                className={`h-10 w-10 rounded-xl border-2 transition-all duration-200 ${showFilters ? 'bg-primary-50 border-primary text-primary' : 'bg-white'}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-3">
                    {offices.length > 0 && (
                        <div className="relative">
                            <Filter className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                                className="h-10 w-[180px] rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                                value={filterOfficeId}
                                onChange={e => setFilterOfficeId(e.target.value)}
                            >
                                <option value="all">All Offices</option>
                                {offices.map((office) => (
                                    <option key={office._id} value={office._id}>{office.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                    </Button>
                    <Dialog open={open} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button className="shadow-sm"><Gift className="mr-2 h-4 w-4" /> New Distribution</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Distribution</DialogTitle>
                                <DialogDescription>Create a new goodies distribution for employees</DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <form id="distribution-form" onSubmit={handleCreate} className="space-y-4 px-6 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="goodiesType" className="text-sm font-medium text-gray-700">Goodies Type</Label>
                                        <Input
                                            id="goodiesType"
                                            value={newItem.goodiesType}
                                            onChange={e => setNewItem({ ...newItem, goodiesType: e.target.value })}
                                            required
                                            placeholder="e.g. Diwali Sweet Box"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="qty" className="text-sm font-medium text-gray-700">Total Quantity</Label>
                                            <Input
                                                id="qty"
                                                type="number"
                                                value={newItem.totalQuantity}
                                                onChange={e => setNewItem({ ...newItem, totalQuantity: parseInt(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={newItem.distributionDate}
                                                onChange={e => setNewItem({ ...newItem, distributionDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="office" className="text-sm font-medium text-gray-700">Assign to Office</Label>
                                        <select
                                            id="office"
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
                                            value={newItem.officeId}
                                            onChange={e => handleOfficeChange(e.target.value)}
                                            required
                                        >
                                            <option value="">Select an office</option>
                                            {offices.map((office) => (
                                                <option key={office._id} value={office._id}>{office.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-gray-700">Distribution Target</Label>
                                        <div className="flex gap-4">
                                            <Button
                                                type="button"
                                                variant={newItem.isForAllEmployees ? "default" : "outline"}
                                                className="flex-1"
                                                onClick={() => handleTargetTypeChange(true)}
                                            >
                                                <Users className="mr-2 h-4 w-4" /> All Employees
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={!newItem.isForAllEmployees ? "default" : "outline"}
                                                className="flex-1"
                                                onClick={() => handleTargetTypeChange(false)}
                                            >
                                                <UserCheck className="mr-2 h-4 w-4" /> Specific Employees
                                            </Button>
                                        </div>
                                    </div>

                                    {!newItem.isForAllEmployees && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium text-gray-700">Select Employees</Label>
                                                {employees.length > 0 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={toggleAllEmployees}>
                                                        {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                                                    </Button>
                                                )}
                                            </div>
                                            {!newItem.officeId ? (
                                                <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">Please select an office first</div>
                                            ) : loadingEmployees ? (
                                                <div className="flex items-center justify-center p-4 border rounded-lg">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading employees...
                                                </div>
                                            ) : employees.length === 0 ? (
                                                <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">No employees found in this office</div>
                                            ) : (
                                                <div className="border rounded-lg max-h-48 overflow-y-auto">
                                                    {employees.map((emp) => (
                                                        <div
                                                            key={emp._id}
                                                            className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmployees.includes(emp._id) ? 'bg-primary-50' : ''}`}
                                                            onClick={() => toggleEmployeeSelection(emp._id)}
                                                        >
                                                            <div className="h-4 w-4 rounded border-gray-300 border bg-white flex items-center justify-center">
                                                                {selectedEmployees.includes(emp._id) && <div className="h-2 w-2 bg-primary rounded-full" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{emp.name}</p>
                                                                <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs capitalize">{emp.role}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => handleDialogChange(false)}>Cancel</Button>
                                <Button type="submit" form="distribution-form" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Distribution
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {showFilters && (
                <Card className="lg:hidden bg-gray-50/50 border-2 border-primary/10 animate-in slide-in-from-top duration-300 overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <Label className="text-base font-bold flex items-center gap-2 text-primary">
                                <Filter className="h-4 w-4" /> Filter Options
                            </Label>
                            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 w-8 rounded-full p-0"><X className="h-4 w-4" /></Button>
                        </div>
                        {offices.length > 0 && (
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
                                            <option key={office._id} value={office._id}>{office.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" onClick={() => setShowFilters(false)}>Apply Selection</Button>
                    </CardContent>
                </Card>
            )}

            {/* Desktop View - Table */}
            <Card className="hidden md:block overflow-hidden border-2 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold py-4">Goodies Type</TableHead>
                                <TableHead className="font-semibold py-4">Office</TableHead>
                                <TableHead className="font-semibold py-4">Inventory</TableHead>
                                <TableHead className="font-semibold py-4">Claimed</TableHead>
                                <TableHead className="font-semibold py-4">Date</TableHead>
                                <TableHead className="font-semibold py-4">Target</TableHead>
                                <TableHead className="font-semibold py-4">Status</TableHead>
                                <TableHead className="text-right font-semibold py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                                    </TableCell>
                                </TableRow>
                            ) : distributions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Gift className="h-12 w-12 text-gray-200" />
                                            <div className="text-gray-500 font-medium">No distributions found</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                distributions.map((item) => (
                                    <TableRow key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-sky-50 rounded-lg shadow-sm border border-sky-100">
                                                    <Gift className="h-4 w-4 text-sky-600" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{item.goodiesType}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Building className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                {item.officeId?.name || 'Global'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${item.remainingCount <= 0 ? 'bg-red-500' : item.remainingCount <= 5 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                        style={{ width: `${(item.remainingCount / (item.totalQuantity || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold font-mono ${item.remainingCount <= 0 ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {item.remainingCount}/{item.totalQuantity}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-semibold text-gray-700">{item.claimedCount || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                {format(new Date(item.distributionDate), 'MMM dd, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.isForAllEmployees ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold">ALL</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[10px] font-bold">TARGETED</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.isReceived ? (
                                                <Badge variant="success" className="text-[10px] font-bold">CLAIMED</Badge>
                                            ) : item.remainingCount <= 0 ? (
                                                <Badge variant="destructive" className="text-[10px] font-bold">OUT OF STOCK</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] font-bold">AVAILABLE</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                {canClaim && !item.isReceived && item.remainingCount > 0 && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 shadow-sm"
                                                        onClick={() => initiateClaim(item)}
                                                    >
                                                        Claim
                                                    </Button>
                                                )}
                                                {isManagement && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary-50"
                                                            onClick={() => fetchClaimsForDistribution(item)}
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                            onClick={() => initiateDeleteDistribution(item)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Mobile View - Cards */}
            <div className="md:hidden grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="py-20 text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary/40" /></div>
                ) : distributions.length === 0 ? (
                    <div className="py-20 text-center">
                        <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No distributions found</h3>
                        <p className="text-gray-500 mt-1">There are no goodies distributions at the moment.</p>
                    </div>
                ) : (
                    distributions.map((item) => (
                        <Card key={item._id} className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md h-full flex flex-col">
                            <CardHeader className="bg-gray-50/50 border-b py-3 px-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-sky-50 rounded-xl shadow-sm border border-sky-100/50">
                                            <Gift className="h-5 w-5 text-sky-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-xl font-semibold text-gray-900 line-clamp-1">{item.goodiesType}</CardTitle>
                                            <div className="flex items-center text-sm text-gray-500 font-medium">
                                                <Building className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                <span className="truncate">{item.officeId?.name || 'Assigned Office'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {isManagement && (
                                            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-0.5 shadow-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-gray-500 hover:text-primary hover:bg-primary-50"
                                                    onClick={() => fetchClaimsForDistribution(item)}
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                </Button>
                                                <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => initiateDeleteDistribution(item)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                        {item.isReceived && (
                                            <Badge variant="success" className="px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider">
                                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Claimed
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 flex-1 space-y-5">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available</p>
                                        <p className={`text-sm font-bold font-mono ${item.remainingCount <= 0 ? 'text-red-500' : item.remainingCount <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                                            {item.remainingCount}/{item.totalQuantity}
                                        </p>
                                    </div>
                                    <div className="space-y-1 border-x border-gray-100 px-3">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Claimed</p>
                                        <p className="text-sm font-bold text-gray-700">{item.claimedCount || 0}</p>
                                    </div>
                                    <div className="space-y-1 pl-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
                                        <p className="text-sm font-bold text-gray-700">{format(new Date(item.distributionDate), 'MMM dd')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        {item.isForAllEmployees ? (
                                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-100">
                                                <Users className="h-3 w-3" /> ALL EMPLOYEES
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-100">
                                                <UserCheck className="h-3 w-3" /> TARGETED
                                            </div>
                                        )}
                                    </div>
                                    {!item.isReceived && item.remainingCount <= 0 && (
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter bg-red-50 px-2 py-0.5 rounded border border-red-100">Out of Stock</span>
                                    )}
                                </div>
                            </CardContent>
                            {canClaim && !item.isReceived && item.remainingCount > 0 && (
                                <div className="p-4 bg-gray-50 border-t">
                                    <Button
                                        className="w-full h-11 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                        onClick={() => initiateClaim(item)}
                                    >
                                        Claim Now
                                    </Button>
                                </div>
                            )}
                            {item.isReceived && (
                                <div className="p-4 bg-green-50/50 border-t flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
                                    <CheckCircle2 className="h-4 w-4" /> Already Claimed
                                </div>
                            )}
                            {!item.isReceived && item.remainingCount <= 0 && (
                                <div className="p-4 bg-gray-100 border-t text-center text-gray-400 font-bold text-sm">
                                    Out of Stock
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Modals for Claim History and Confirms */}
            <Dialog open={claimsOpen} onOpenChange={(open) => {
                setClaimsOpen(open);
                if (!open) {
                    setClaimSearchQuery('');
                    setEligibleEmployees([]);
                    setDistributionClaims([]);
                }
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="truncate">Eligible Employees: {selectedDistribution?.goodiesType}</span>
                        </DialogTitle>
                        <DialogDescription>
                            {eligibleEmployees.length} eligible employees • {distributionClaims.length} claimed
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col space-y-4 pt-2 px-1">
                        {/* Search Input */}
                        <div className="relative">
                            <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                placeholder="Search by name or employee ID..."
                                value={claimSearchQuery}
                                onChange={(e) => setClaimSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                            {claimSearchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => setClaimSearchQuery('')}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {fetchingClaims ? (
                                <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                            ) : eligibleEmployees.length === 0 ? (
                                <div className="py-10 text-center text-gray-500">No eligible employees found.</div>
                            ) : (() => {
                                // Create a map of user IDs who have claimed
                                const claimedMap = new Map();
                                distributionClaims.forEach(claim => {
                                    if (claim.userId?._id) {
                                        claimedMap.set(claim.userId._id, claim);
                                    }
                                });

                                // Merge eligible employees with claim data
                                const mergedList = eligibleEmployees.map(emp => ({
                                    ...emp,
                                    hasClaimed: claimedMap.has(emp._id),
                                    claimData: claimedMap.get(emp._id) || null
                                }));

                                // Filter by search query
                                const query = claimSearchQuery.toLowerCase().trim();
                                const filteredList = query
                                    ? mergedList.filter(emp =>
                                        emp.name?.toLowerCase().includes(query) ||
                                        emp.email?.toLowerCase().includes(query) ||
                                        emp.employeeId?.toLowerCase().includes(query)
                                    )
                                    : mergedList;

                                // Sort: claimed first, then alphabetically
                                const sortedList = [...filteredList].sort((a, b) => {
                                    if (a.hasClaimed && !b.hasClaimed) return -1;
                                    if (!a.hasClaimed && b.hasClaimed) return 1;
                                    return (a.name || '').localeCompare(b.name || '');
                                });

                                if (sortedList.length === 0) {
                                    return <div className="py-10 text-center text-gray-500">No employees match your search.</div>;
                                }

                                return (
                                    <div className="space-y-2">
                                        {sortedList.map((emp) => (
                                            <div
                                                key={emp._id}
                                                className={`p-3 rounded-lg border ${emp.hasClaimed ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-200'} ${isManagement && !emp.hasClaimed ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300' : ''}`}
                                                onClick={() => {
                                                    if (isManagement && !emp.hasClaimed) {
                                                        initiateManualClaim(emp);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        {emp.hasClaimed ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-sm truncate">{emp.name}</p>
                                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{emp.employeeId || '-'}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Badge variant="secondary" className="text-[10px] capitalize hidden sm:inline-flex">
                                                            {emp.role}
                                                        </Badge>
                                                        {emp.claimData?.receivedAt && (
                                                            <span className="text-xs text-gray-500 hidden md:block">
                                                                {format(new Date(emp.claimData.receivedAt), 'MMM dd, HH:mm')}
                                                            </span>
                                                        )}
                                                        {isManagement && emp.hasClaimed && emp.claimData && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    initiateDeleteClaim(emp.claimData);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Summary Footer */}
                        {!fetchingClaims && eligibleEmployees.length > 0 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        <span className="text-gray-600">Claimed: <strong>{distributionClaims.length}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                                        <span className="text-gray-600">Pending: <strong>{eligibleEmployees.length - distributionClaims.length}</strong></span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {Math.round((distributionClaims.length / eligibleEmployees.length) * 100)}% claimed
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent >
            </Dialog >

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Claim</DialogTitle>
                        <DialogDescription>Are you sure you want to claim <strong>{selectedDistribution?.goodiesType}</strong>?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={handleMarkReceived} disabled={claiming}>{claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm Claim</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>Delete <strong>{deletingItem?.name}</strong>? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Claim Confirmation Dialog */}
            <Dialog open={manualClaimOpen} onOpenChange={setManualClaimOpen}>
                <DialogContent className="gap-2">
                    <DialogHeader>
                        <DialogTitle>Mark as Claimed</DialogTitle>
                        <DialogDescription>
                            Mark <strong>{manualClaimEmployee?.name}</strong> as having claimed their goodies?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setManualClaimOpen(false)}>Cancel</Button>
                        <Button onClick={confirmManualClaim} disabled={markingClaim}>
                            {markingClaim && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Mark as Claimed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mobile Floating Action Button */}
            {
                isManagement && (
                    <div className="fixed bottom-6 right-6 flex flex-col gap-3 lg:hidden z-40">
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-2xl bg-white text-primary border-2 border-primary/10 hover:bg-gray-50 active:scale-95 transition-all"
                            onClick={() => setBulkUploadOpen(true)}
                        >
                            <Upload className="h-6 w-6" />
                        </Button>
                        <Dialog open={open} onOpenChange={handleDialogChange}>
                            <DialogTrigger asChild>
                                <Button
                                    size="icon"
                                    className="h-16 w-16 rounded-full shadow-2xl bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all"
                                >
                                    <Plus className="h-8 w-8" />
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </div>
                )
            }

            <BulkGoodiesUpload
                isOpen={bulkUploadOpen}
                onClose={() => setBulkUploadOpen(false)}
                onSuccess={() => {
                    fetchDistributions();
                    toast({ title: 'Success', description: 'Bulk distribution processed' });
                }}
            />
        </div >
    );
};

export default Goodies;
