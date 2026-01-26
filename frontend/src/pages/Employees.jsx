import React, { useState, useEffect, useMemo } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Loader2, UserPlus, ShieldCheck, UserCog, Mail, Phone, Building, Eye, EyeOff, AlertTriangle, Upload, MoreVertical, UserX, UserCheck, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BulkEmployeeUpload from '../components/BulkEmployeeUpload';

const Employees = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Verification modal state
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [verifying, setVerifying] = useState(false);

    // Bulk upload modal state
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

    // Suspend modal state
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
    const [suspendingEmployee, setSuspendingEmployee] = useState(null);
    const [suspending, setSuspending] = useState(false);

    // Unsuspend modal state
    const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);
    const [unsuspendingEmployee, setUnsuspendingEmployee] = useState(null);
    const [unsuspending, setUnsuspending] = useState(false);

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Office filter state (for super admin)
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const isSuperAdmin = currentUser?.role === 'super_admin';

    // Hierarchy Definition for creation logic
    const roleHierarchy = {
        'super_admin': 4,
        'admin': 3,
        'internal': 2,
        'external': 1
    };

    const currentRank = roleHierarchy[currentUser?.role] || 0;

    const [newEmployee, setNewEmployee] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'external',
        primaryOfficeId: '',
        employeeId: '',
        age: '',
        gender: '',
        dob: ''
    });

    const canCreateAny = currentRank > 1;

    useEffect(() => {
        fetchEmployees();
        fetchOffices();
    }, [page, filterOfficeId]); // Re-fetch on page or filter change

    useEffect(() => {
        if (open) {
            const availableRoles = Object.keys(roleHierarchy).filter(r => roleHierarchy[r] < currentRank);
            if (availableRoles.length > 0) {
                setNewEmployee(prev => ({ ...prev, role: availableRoles[0] }));
            }
            setShowPassword(false);
        }
    }, [open, currentRank]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params = { page, limit };

            // Add office filter for super admin
            if (isSuperAdmin && filterOfficeId && filterOfficeId !== 'all') {
                params.officeId = filterOfficeId;
            }

            const response = await api.get('/users', { params });
            const data = response.data.data;
            const docs = data.users || data.docs || (Array.isArray(data) ? data : []);
            setEmployees(docs);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast({ title: 'Error', description: 'Failed to LOAD employees', variant: 'destructive' });
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

    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        // Filtering based on rank visibility:
        // Super admin sees all.
        // Admin sees rank < admin (internal, external).
        // Internal sees rank < internal (external).
        return employees.filter(emp => {
            const empRank = roleHierarchy[emp.role] || 0;
            return empRank < currentRank || currentUser?.role === 'super_admin';
        });
    }, [employees, currentRank, currentUser?.role]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (roleHierarchy[newEmployee.role] >= currentRank) {
            toast({
                title: 'Permission Denied',
                description: 'You can only create employees with a lower rank than yours.',
                variant: 'destructive'
            });
            return;
        }

        setCreating(true);
        try {
            await api.post('/auth/employees', newEmployee);
            toast({ title: 'Success', description: 'Employee created and activated' });
            fetchEmployees();
            setOpen(false);
            setNewEmployee({ name: '', email: '', phone: '', password: '', role: 'external', primaryOfficeId: '', employeeId: '', age: '', gender: '', dob: '' });
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create employee',
                variant: 'destructive'
            });
        } finally {
            setCreating(false);
        }
    };

    const initiateVerify = (employee) => {
        setSelectedEmployee(employee);
        setVerifyDialogOpen(true);
    };

    const confirmVerify = async () => {
        if (!selectedEmployee) return;

        setVerifying(true);
        try {
            await api.post(`/auth/verify/${selectedEmployee._id}`);
            toast({ title: 'Success', description: 'Employee verified successfully' });
            fetchEmployees();
            setVerifyDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Verification failed',
                variant: 'destructive'
            });
        } finally {
            setVerifying(false);
            setSelectedEmployee(null);
        }
    };

    // Suspend handlers
    const initiateSuspend = (employee) => {
        setSuspendingEmployee(employee);
        setSuspendDialogOpen(true);
    };

    const confirmSuspend = async () => {
        if (!suspendingEmployee) return;

        setSuspending(true);
        try {
            await api.patch(`/users/${suspendingEmployee._id}/suspend`);
            toast({ title: 'Success', description: 'Employee suspended successfully' });
            fetchEmployees();
            setSuspendDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to suspend employee',
                variant: 'destructive'
            });
        } finally {
            setSuspending(false);
            setSuspendingEmployee(null);
        }
    };

    // Unsuspend handlers
    const initiateUnsuspend = (employee) => {
        setUnsuspendingEmployee(employee);
        setUnsuspendDialogOpen(true);
    };

    const confirmUnsuspend = async () => {
        if (!unsuspendingEmployee) return;

        setUnsuspending(true);
        try {
            await api.patch(`/users/${unsuspendingEmployee._id}/unsuspend`);
            toast({ title: 'Success', description: 'Employee reactivated successfully' });
            fetchEmployees();
            setUnsuspendDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to reactivate employee',
                variant: 'destructive'
            });
        } finally {
            setUnsuspending(false);
            setUnsuspendingEmployee(null);
        }
    };

    // Delete handlers
    const initiateDelete = (employee) => {
        setDeletingEmployee(employee);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingEmployee) return;

        setDeleting(true);
        try {
            await api.delete(`/users/${deletingEmployee._id}`);
            toast({ title: 'Success', description: 'Employee deleted successfully' });
            fetchEmployees();
            setDeleteDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete employee',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
            setDeletingEmployee(null);
        }
    };

    const getAvailableRoles = () => {
        return Object.keys(roleHierarchy).filter(role => roleHierarchy[role] < currentRank);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Employee Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage and verify employee accounts</p>
                </div>
                {canCreateAny && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        {/* Office Filter - Only for Super Admin */}
                        {isSuperAdmin && offices.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Building className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <select
                                        className="h-10 w-full sm:w-[180px] rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                                        value={filterOfficeId}
                                        onChange={(e) => {
                                            setFilterOfficeId(e.target.value);
                                            setPage(1);
                                        }}
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

                        {/* Bulk Upload Button */}
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => setBulkUploadOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                        </Button>

                        {/* Add Employee Button */}
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto">
                                    <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Register New Employee</DialogTitle>
                                    <DialogDescription>Create a new employee account with assigned role and office</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4 px-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={newEmployee.name}
                                                onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">Employee ID</Label>
                                            <Input
                                                id="employeeId"
                                                value={newEmployee.employeeId}
                                                onChange={e => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                                                placeholder="e.g., EMP001"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                                            <Input
                                                id="dob"
                                                type="date"
                                                value={newEmployee.dob}
                                                onChange={e => setNewEmployee({ ...newEmployee, dob: e.target.value })}
                                                className="w-40"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                min="18"
                                                max="100"
                                                value={newEmployee.age}
                                                onChange={e => setNewEmployee({ ...newEmployee, age: e.target.value })}
                                                placeholder="18-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                                            <select
                                                id="gender"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                                value={newEmployee.gender}
                                                onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newEmployee.email}
                                                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                                required
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={newEmployee.phone}
                                                onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                                required
                                                placeholder="10-15 digits"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                                            <select
                                                id="role"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                                value={newEmployee.role}
                                                onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                                required
                                            >
                                                {getAvailableRoles().map(role => (
                                                    <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="office" className="text-sm font-medium text-gray-700">Assigned Office</Label>
                                            <select
                                                id="office"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                                value={newEmployee.primaryOfficeId}
                                                onChange={e => setNewEmployee({ ...newEmployee, primaryOfficeId: e.target.value })}
                                                required={['internal', 'external'].includes(newEmployee.role)}
                                            >
                                                <option value="">Select an office</option>
                                                {offices.map((off) => (
                                                    <option key={off._id} value={off._id}>{off.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Initial Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={newEmployee.password}
                                                onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                                required
                                                placeholder="Min. 6 characters"
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreate} disabled={creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Employee
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Employees Table */}
            {/* Employees Table (Desktop) */}
            <Card className="hidden md:block overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Office & Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <TableRow key={emp._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                    {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{emp.name}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                {emp.employeeId || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-700">
                                                <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.email}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-700">
                                                <Building className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                {emp.primaryOfficeId?.name || (emp.role.includes('admin') ? 'Global' : 'Not Assigned')}
                                            </div>
                                            <div className="mt-2">
                                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">
                                                    {emp.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                                emp.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {roleHierarchy[emp.role] < currentRank && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {emp.status === 'pending' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => initiateVerify(emp)}>
                                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                                    Verify
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {emp.status === 'active' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => initiateSuspend(emp)}>
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    Suspend
                                                                </DropdownMenuItem>
                                                                {emp.role === 'external' && currentUser.role !== 'external' && (
                                                                    <DropdownMenuItem onClick={async () => {
                                                                        try {
                                                                            await api.post('/location/request', { targetUserId: emp._id });
                                                                            toast({ title: 'Success', description: 'Location request sent' });
                                                                        } catch (e) {
                                                                            toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
                                                                        }
                                                                    }}>
                                                                        <MapPin className="mr-2 h-4 w-4" />
                                                                        Request Location
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}
                                                        {emp.status === 'inactive' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => initiateUnsuspend(emp)}>
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    Reactivate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {['super_admin', 'admin'].includes(currentUser?.role) && (
                                                            <DropdownMenuItem
                                                                onClick={() => initiateDelete(emp)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {/* Pagination */}
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Employees Cards (Mobile) */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center text-gray-500">
                            No employees found.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {filteredEmployees.map((emp) => (
                            <Card key={emp._id}>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                                                <p className="text-xs text-gray-500 font-mono">{emp.employeeId || 'N/A'}</p>
                                            </div>
                                        </div>
                                        {roleHierarchy[emp.role] < currentRank && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="-mr-2">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {emp.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => initiateVerify(emp)}>
                                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                                Verify
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    {emp.status === 'active' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => initiateSuspend(emp)}>
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Suspend
                                                            </DropdownMenuItem>
                                                            {emp.role === 'external' && currentUser.role !== 'external' && (
                                                                <DropdownMenuItem onClick={async () => {
                                                                    try {
                                                                        await api.post('/location/request', { targetUserId: emp._id });
                                                                        toast({ title: 'Success', description: 'Location request sent' });
                                                                    } catch (e) {
                                                                        toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
                                                                    }
                                                                }}>
                                                                    <MapPin className="mr-2 h-4 w-4" />
                                                                    Request Location
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                                    {emp.status === 'inactive' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => initiateUnsuspend(emp)}>
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Reactivate
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    {['super_admin', 'admin'].includes(currentUser?.role) && (
                                                        <DropdownMenuItem
                                                            onClick={() => initiateDelete(emp)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500">Contact</span>
                                            <div className="flex items-center text-gray-700">
                                                <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                <span className="truncate">{emp.email}</span>
                                            </div>
                                            <div className="flex items-center text-gray-700">
                                                <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                <span>{emp.phone}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500">Details</span>
                                            <div className="flex items-center text-gray-700">
                                                <Building className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                <span className="truncate">{emp.primaryOfficeId?.name || (emp.role.includes('admin') ? 'Global' : 'N/A')}</span>
                                            </div>
                                            <div>
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">
                                                    {emp.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-full block text-center ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                            emp.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>
                                            {emp.status}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Mobile Pagination */}
                        <div className="flex justify-between items-center px-4 py-3 bg-white rounded-lg border border-gray-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Verification Confirmation Modal */}
            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            Confirm Verification
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to verify <strong className="text-gray-900">{selectedEmployee?.name}</strong>?
                            This will grant active status and access to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                            Once verified, the employee will have full access based on their assigned role.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifyDialogOpen(false)} disabled={verifying}>
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            onClick={confirmVerify}
                            disabled={verifying}
                        >
                            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Verify
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Confirmation Modal */}
            <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-orange-50">
                                <UserX className="h-5 w-5 text-orange-600" />
                            </div>
                            Confirm Suspension
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to suspend <strong className="text-gray-900">{suspendingEmployee?.name}</strong>?
                            This will set their status to inactive and revoke system access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                            The employee will not be able to log in until their account is reactivated.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} disabled={suspending}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmSuspend}
                            disabled={suspending}
                        >
                            {suspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Suspend Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unsuspend Confirmation Modal */}
            <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-50">
                                <UserCheck className="h-5 w-5 text-green-600" />
                            </div>
                            Confirm Reactivation
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reactivate <strong className="text-gray-900">{unsuspendingEmployee?.name}</strong>?
                            This will set their status to active and restore system access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                            The employee will be able to log in and access the system again.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnsuspendDialogOpen(false)} disabled={unsuspending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmUnsuspend}
                            disabled={unsuspending}
                        >
                            {unsuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reactivate Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            Are you sure you want to permanently delete <strong className="text-gray-900">{deletingEmployee?.name}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Warning: This will permanently delete all employee data
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
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Employee Upload Modal */}
            <BulkEmployeeUpload
                isOpen={bulkUploadOpen}
                onClose={() => setBulkUploadOpen(false)}
                onSuccess={() => {
                    fetchEmployees();
                    toast({
                        title: 'Success',
                        description: 'Employees uploaded successfully',
                    });
                }}
            />
        </div>
    );
};

export default Employees;
