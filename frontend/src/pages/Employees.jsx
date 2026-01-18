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
import { Loader2, UserPlus, ShieldCheck, UserCog, Mail, Phone, Building, Eye, EyeOff, AlertTriangle, Upload, MoreVertical, UserX, Trash2 } from 'lucide-react';
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

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

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
        primaryOfficeId: ''
    });

    const canCreateAny = currentRank > 1;

    useEffect(() => {
        fetchEmployees();
        fetchOffices();
    }, [page]); // Re-fetch on page change

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
            const response = await api.get('/users', {
                params: { page, limit }
            });
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
            setNewEmployee({ name: '', email: '', phone: '', password: '', role: 'external', primaryOfficeId: '' });
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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
                    <p className="text-gray-500 mt-1">Manage and verify employee accounts</p>
                </div>
                {canCreateAny && (
                    <div className="flex gap-3">
                        {/* Bulk Upload Button */}
                        <Button
                            variant="outline"
                            onClick={() => setBulkUploadOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                        </Button>

                        {/* Add Employee Button */}
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Register New Employee</DialogTitle>
                                    <DialogDescription>Create a new employee account with assigned role and office</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4 px-6 py-4">
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
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Office & Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
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
                                                    <div className="text-xs text-gray-400 font-mono">{emp._id?.slice(-8)}</div>
                                                </div>
                                            </div>
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
                                                            <DropdownMenuItem onClick={() => initiateSuspend(emp)}>
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Suspend
                                                            </DropdownMenuItem>
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
