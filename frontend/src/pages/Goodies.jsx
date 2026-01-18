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
import { Loader2, Gift, CheckCircle2, AlertTriangle, Users, History, Mail, Calendar, Building, UserCheck, Filter, X, Eye, Package, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Goodies = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [distributions, setDistributions] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [claimsOpen, setClaimsOpen] = useState(false);
    const [selectedDistribution, setSelectedDistribution] = useState(null);
    const [distributionClaims, setDistributionClaims] = useState([]);
    const [fetchingClaims, setFetchingClaims] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Filter state
    const [filterOfficeId, setFilterOfficeId] = useState('all');

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
            // Filter to only show internal and external employees
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
        try {
            const response = await api.get(`/goodies/received?distributionId=${dist._id}&limit=100`);
            const data = response.data.data;
            const records = data.records || (Array.isArray(data) ? data : []);
            setDistributionClaims(records);
        } catch (error) {
            console.error('Error fetching claims:', error);
            toast({ title: 'Error', description: 'Failed to fetch claim history', variant: 'destructive' });
        } finally {
            setFetchingClaims(false);
        }
    };

    // Handle office change in form - also fetch employees
    const handleOfficeChange = (officeId) => {
        setNewItem({ ...newItem, officeId });
        setSelectedEmployees([]);
        if (!newItem.isForAllEmployees) {
            fetchEmployeesByOffice(officeId);
        }
    };

    // Handle target type change
    const handleTargetTypeChange = (isForAll) => {
        setNewItem({ ...newItem, isForAllEmployees: isForAll });
        setSelectedEmployees([]);
        if (!isForAll && newItem.officeId) {
            fetchEmployeesByOffice(newItem.officeId);
        }
    };

    // Toggle employee selection
    const toggleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    // Select/deselect all employees
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
            toast({
                title: 'Error',
                description: 'Please select an office',
                variant: 'destructive'
            });
            return;
        }

        if (!newItem.isForAllEmployees && selectedEmployees.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one employee for targeted distribution',
                variant: 'destructive'
            });
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
            setNewItem({
                goodiesType: '',
                totalQuantity: 0,
                officeId: '',
                distributionDate: new Date().toISOString().split('T')[0],
                isForAllEmployees: true
            });
            setSelectedEmployees([]);
            setEmployees([]);
            setOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create distribution',
                variant: 'destructive'
            });
        } finally {
            setCreating(false);
        }
    };

    const initiateClaim = (distribution) => {
        setSelectedDistribution(distribution);
        setConfirmOpen(true);
    };

    const viewDistributionDetails = (distribution) => {
        setSelectedDistribution(distribution);
        setDetailsOpen(true);
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
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to receive goodies',
                variant: 'destructive'
            });
        } finally {
            setClaiming(false);
            setSelectedDistribution(null);
        }
    };

    // Reset form when dialog closes
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Goodies Distribution</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage and track goodies distribution across offices
                    </p>
                </div>
                {isManagement && (
                    <div className="flex items-center gap-3">
                        {/* Office Filter - Inline with button */}
                        {offices.length > 0 && (
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
                                {filterOfficeId && filterOfficeId !== 'all' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setFilterOfficeId('all')}
                                        className="h-8 w-8 text-gray-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
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
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                                value={newItem.officeId}
                                                onChange={e => handleOfficeChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Select an office</option>
                                                {offices.map((office) => (
                                                    <option key={office._id} value={office._id}>
                                                        {office.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Target Type Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-gray-700">Distribution Target</Label>
                                            <div className="flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant={newItem.isForAllEmployees ? "default" : "outline"}
                                                    className="flex-1"
                                                    onClick={() => handleTargetTypeChange(true)}
                                                >
                                                    <Users className="mr-2 h-4 w-4" />
                                                    All Employees
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={!newItem.isForAllEmployees ? "default" : "outline"}
                                                    className="flex-1"
                                                    onClick={() => handleTargetTypeChange(false)}
                                                >
                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                    Specific Employees
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Employee Selection - Only shown for specific employees */}
                                        {!newItem.isForAllEmployees && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-gray-700">Select Employees</Label>
                                                    {employees.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={toggleAllEmployees}
                                                        >
                                                            {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                                                        </Button>
                                                    )}
                                                </div>

                                                {!newItem.officeId ? (
                                                    <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">
                                                        Please select an office first
                                                    </div>
                                                ) : loadingEmployees ? (
                                                    <div className="flex items-center justify-center p-4 border rounded-lg">
                                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                        Loading employees...
                                                    </div>
                                                ) : employees.length === 0 ? (
                                                    <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">
                                                        No employees found in this office
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                                                        {employees.map((emp) => (
                                                            <div
                                                                key={emp._id}
                                                                className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmployees.includes(emp._id) ? 'bg-blue-50' : ''
                                                                    }`}
                                                                onClick={() => toggleEmployeeSelection(emp._id)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    checked={selectedEmployees.includes(emp._id)}
                                                                    onChange={() => { }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{emp.name}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs capitalize">
                                                                    {emp.role}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedEmployees.length > 0 && (
                                                    <p className="text-sm text-gray-500">
                                                        {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                                                    </p>
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
                )}
            </div>

            {/* Confirmation Modal for Claimants */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Confirm Claim
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to claim <strong>{selectedDistribution?.goodiesType}</strong>?
                            This action cannot be undone and will be recorded.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-3">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={claiming}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleMarkReceived}
                            disabled={claiming}
                        >
                            {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Claim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Modal for Management */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Distribution Details
                        </DialogTitle>
                        <DialogDescription>
                            Complete information about this distribution.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDistribution && (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4 px-6 py-4">
                                {/* Stock Status Banner */}
                                <div className={`p-3 rounded-lg flex items-center justify-between ${selectedDistribution.remainingCount <= 0
                                    ? 'bg-red-50 border border-red-200'
                                    : selectedDistribution.remainingCount <= 5
                                        ? 'bg-yellow-50 border border-yellow-200'
                                        : 'bg-green-50 border border-green-200'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Gift className={`h-5 w-5 ${selectedDistribution.remainingCount <= 0
                                            ? 'text-red-600'
                                            : selectedDistribution.remainingCount <= 5
                                                ? 'text-yellow-600'
                                                : 'text-green-600'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {selectedDistribution.remainingCount <= 0
                                                    ? 'Out of Stock'
                                                    : `${selectedDistribution.remainingCount} Remaining`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedDistribution.claimedCount || 0} claimed of {selectedDistribution.totalQuantity} total
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold font-mono">
                                            {selectedDistribution.remainingCount}/{selectedDistribution.totalQuantity}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Goodies Type</p>
                                        <p className="text-sm font-semibold">{selectedDistribution.goodiesType}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Total Quantity</p>
                                        <p className="text-sm font-semibold font-mono">{selectedDistribution.totalQuantity}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Office</p>
                                        <p className="text-sm font-semibold flex items-center gap-1">
                                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                            {selectedDistribution.officeId?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Distribution Date</p>
                                        <p className="text-sm font-semibold flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            {selectedDistribution.distributionDate
                                                ? format(new Date(selectedDistribution.distributionDate), 'MMM dd, yyyy')
                                                : '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Distributed By</p>
                                        <p className="text-sm font-semibold flex items-center gap-1">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            {selectedDistribution.distributedBy?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Target</p>
                                        {selectedDistribution.isForAllEmployees ? (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                <Users className="h-3 w-3 mr-1" />
                                                All Employees
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                                                <UserCheck className="h-3 w-3 mr-1" />
                                                {selectedDistribution.targetEmployees?.length || 0} Selected
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Target Employees List - Only shown for specific employee distributions */}
                                {!selectedDistribution.isForAllEmployees && selectedDistribution.targetEmployees?.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <p className="text-xs text-muted-foreground font-medium">Target Employees</p>
                                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                                            {selectedDistribution.targetEmployees.map((emp) => (
                                                <div
                                                    key={emp._id}
                                                    className="flex items-center gap-3 p-3 border-b last:border-b-0"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                                        {emp.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{emp.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs capitalize">
                                                        {emp.role}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" className="w-full" onClick={() => setDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Claims Modal for Management */}
            <Dialog open={claimsOpen} onOpenChange={setClaimsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Claim History: {selectedDistribution?.goodiesType}
                        </DialogTitle>
                        <DialogDescription>
                            Showing employees who have claimed this item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <div className="space-y-4 px-6 py-4">
                            {/* Stock Status Banner */}
                            {selectedDistribution && (
                                <div className={`p-3 rounded-lg flex items-center justify-between ${selectedDistribution.remainingCount <= 0
                                    ? 'bg-red-50 border border-red-200'
                                    : selectedDistribution.remainingCount <= 5
                                        ? 'bg-yellow-50 border border-yellow-200'
                                        : 'bg-green-50 border border-green-200'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Gift className={`h-5 w-5 ${selectedDistribution.remainingCount <= 0
                                            ? 'text-red-600'
                                            : selectedDistribution.remainingCount <= 5
                                                ? 'text-yellow-600'
                                                : 'text-green-600'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {selectedDistribution.remainingCount <= 0
                                                    ? 'Out of Stock'
                                                    : `${selectedDistribution.remainingCount} Remaining`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {distributionClaims.length} claimed of {selectedDistribution.totalQuantity} total
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold font-mono">
                                            {selectedDistribution.remainingCount}/{selectedDistribution.totalQuantity}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Claims List */}
                            <div className="min-h-[200px]">
                                {fetchingClaims ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50 py-10">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-medium">Fetching claim records...</p>
                                    </div>
                                ) : distributionClaims.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-3 py-10">
                                        <Users className="h-10 w-10 text-muted-foreground opacity-30" />
                                        <p className="text-muted-foreground font-medium text-center">No claims recorded yet for this distribution.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {distributionClaims.map((claim) => (
                                            <div key={claim._id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {claim.userId?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{claim.userId?.name}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {claim.userId?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-medium text-green-600 flex items-center justify-end gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Claimed
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-1">
                                                        <Calendar className="h-3 w-3" /> {format(new Date(claim.receivedAt), 'MMM dd, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full" onClick={() => setClaimsOpen(false)}>Close History</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">Goodies Type</TableHead>
                                <TableHead className="font-bold">Office</TableHead>
                                <TableHead className="font-bold">Target</TableHead>
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="font-bold">Stock</TableHead>
                                <TableHead className="text-right font-bold pr-6">Status / Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                        Loading distributions...
                                    </TableCell>
                                </TableRow>
                            ) : !Array.isArray(distributions) || distributions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Gift className="h-10 w-10 opacity-20" />
                                            <p className="text-lg font-medium">No distributions found</p>
                                            <p className="text-sm">Start by creating a new goodies distribution.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                distributions.map((item, index) => (
                                    <TableRow key={item._id || index} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="font-semibold py-4">
                                            {item.goodiesType}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1.5">
                                                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                                {item.officeId?.name || 'Unknown Office'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {item.isForAllEmployees ? (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    All Employees
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                                                    <UserCheck className="h-3 w-3 mr-1" />
                                                    {item.targetEmployees?.length || 0} Selected
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.distributionDate ? format(new Date(item.distributionDate), 'MMM dd, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm">{item.remainingCount}/{item.totalQuantity}</span>
                                                {item.remainingCount <= 0 ? (
                                                    <span className="text-xs text-red-600">Out of stock</span>
                                                ) : item.remainingCount <= 5 ? (
                                                    <span className="text-xs text-yellow-600">Low stock</span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-2">
                                            {canClaim && (
                                                <Button
                                                    size="sm"
                                                    variant={item.isReceived ? "secondary" : item.remainingCount <= 0 ? "secondary" : "outline"}
                                                    onClick={() => !item.isReceived && item.remainingCount > 0 && initiateClaim(item)}
                                                    disabled={item.isReceived || item.remainingCount <= 0}
                                                    className={item.isReceived
                                                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 opacity-100"
                                                        : item.remainingCount <= 0
                                                            ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 opacity-100"
                                                            : "hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                                    }
                                                >
                                                    {item.isReceived ? (
                                                        <><CheckCircle2 className="mr-2 h-4 w-4" /> Claimed</>
                                                    ) : item.remainingCount <= 0 ? (
                                                        <><X className="mr-2 h-4 w-4" /> Out of Stock</>
                                                    ) : (
                                                        <><CheckCircle2 className="mr-2 h-4 w-4" /> Claim Item</>
                                                    )}
                                                </Button>
                                            )}
                                            {isManagement && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-gray-200 hover:bg-gray-50"
                                                        onClick={() => viewDistributionDetails(item)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" /> Details
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                        onClick={() => fetchClaimsForDistribution(item)}
                                                    >
                                                        <Users className="mr-2 h-4 w-4" /> View Claims
                                                    </Button>
                                                </>
                                            )}
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

export default Goodies;
