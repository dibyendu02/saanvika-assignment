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
import { Loader2, UserPlus, ShieldCheck, UserCog, Mail, Phone, Building, Eye, EyeOff, AlertTriangle, Upload, MoreVertical, UserX, UserCheck, Trash2, MapPin, Filter, X, Plus } from 'lucide-react';
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
    const [showFilters, setShowFilters] = useState(false);
    const [showActions, setShowActions] = useState(false);

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
        <div className="space-y-6 pb-24">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex justify-between items-center w-full">
                    <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Employees</h2>
                        <p className="text-sm text-gray-500 mt-1 hidden sm:block">Manage and verify employee accounts</p>
                    </div>

                    <div className="flex items-center gap-2 xl:hidden">
                        {isSuperAdmin && (
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

                <div className="hidden xl:flex flex-row gap-3 items-center">
                    {isSuperAdmin && offices.length > 0 && (
                        <div className="relative">
                            <Building className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                                className="h-10 w-[180px] rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                                value={filterOfficeId}
                                onChange={(e) => {
                                    setFilterOfficeId(e.target.value);
                                    setPage(1);
                                }}
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

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-[95vw] md:w-full overflow-hidden flex flex-col max-h-[90vh] p-0">
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="text-xl md:text-2xl text-center md:text-left">Register New Employee</DialogTitle>
                                <DialogDescription className="text-center md:text-left">Create a new employee account with assigned role and office</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                                <form id="employee-form" onSubmit={handleCreate} className="space-y-6 md:space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={newEmployee.name}
                                                onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                                required
                                                placeholder="Enter full name"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="employeeId" className="text-sm font-semibold text-gray-700">Employee ID</Label>
                                            <Input
                                                id="employeeId"
                                                value={newEmployee.employeeId}
                                                onChange={e => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                                                placeholder="e.g., EMP001"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dob" className="text-sm font-semibold text-gray-700">Date of Birth</Label>
                                            <div className="relative">
                                                <Input
                                                    id="dob"
                                                    type="date"
                                                    value={newEmployee.dob}
                                                    onChange={e => setNewEmployee({ ...newEmployee, dob: e.target.value })}
                                                    className="w-full h-12 md:h-10 appearance-none bg-white block"
                                                    style={{ minHeight: '3rem' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="age" className="text-sm font-semibold text-gray-700">Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                min="18"
                                                max="100"
                                                value={newEmployee.age}
                                                onChange={e => setNewEmployee({ ...newEmployee, age: e.target.value })}
                                                placeholder="18-100"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">Gender</Label>
                                            <select
                                                id="gender"
                                                className="flex h-12 md:h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newEmployee.email}
                                                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                                required
                                                placeholder="email@example.com"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={newEmployee.phone}
                                                onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                                required
                                                placeholder="10-15 digits"
                                                className="h-12 md:h-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Role</Label>
                                            <select
                                                id="role"
                                                className="flex h-12 md:h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none"
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
                                            <Label htmlFor="office" className="text-sm font-semibold text-gray-700">Assigned Office</Label>
                                            <select
                                                id="office"
                                                className="flex h-12 md:h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none appearance-none"
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
                                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Initial Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={newEmployee.password}
                                                onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                                required
                                                placeholder="Min. 6 characters"
                                                className="pr-10 h-12 md:h-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <DialogFooter className="p-6 pt-2 bg-gray-50 flex-col md:flex-row gap-2">
                                <Button variant="outline" onClick={() => setOpen(false)} className="w-full md:w-auto h-12 md:h-10 ring-1 ring-gray-200">Cancel</Button>
                                <Button type="submit" form="employee-form" disabled={creating} className="w-full md:w-auto h-12 md:h-10">
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Employee
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {showFilters && (
                <Card className="xl:hidden bg-gray-50/50 border-2 border-primary/10 animate-in slide-in-from-top duration-300 overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <Label className="text-base font-bold flex items-center gap-2 text-primary">
                                <Filter className="h-4 w-4" /> Filter Options
                            </Label>
                            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 w-8 rounded-full p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {isSuperAdmin && offices.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Office</Label>
                                <div className="relative">
                                    <Building className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <select
                                        className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2 text-base shadow-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none appearance-none"
                                        value={filterOfficeId}
                                        onChange={(e) => {
                                            setFilterOfficeId(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="all">All Offices</option>
                                        {offices.map((office) => (
                                            <option key={office._id} value={office._id}>{office.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" onClick={() => setShowFilters(false)}>Apply Filters</Button>
                    </CardContent>
                </Card>
            )}

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
                                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">No employees found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <TableRow key={emp._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                    {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="font-medium text-gray-900">{emp.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell><span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">{emp.employeeId || 'N/A'}</span></TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-700"><Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.email}</div>
                                            <div className="flex items-center text-sm text-gray-500 mt-1"><Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-gray-700"><Building className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.primaryOfficeId?.name || (emp.role.includes('admin') ? 'Global' : 'N/A')}</div>
                                            <div className="mt-2"><span className="px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700 uppercase">{emp.role.replace('_', ' ')}</span></div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-success-50 text-success-700' : emp.status === 'pending' ? 'bg-warning-50 text-warning-700' : 'bg-destructive/10 text-destructive'}`}>
                                                {emp.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {roleHierarchy[emp.role] < currentRank && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {emp.status === 'pending' && (
                                                            <DropdownMenuItem onClick={() => initiateVerify(emp)}><ShieldCheck className="mr-2 h-4 w-4" /> Verify</DropdownMenuItem>
                                                        )}
                                                        {emp.status === 'active' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => initiateSuspend(emp)}><UserX className="mr-2 h-4 w-4" /> Suspend</DropdownMenuItem>
                                                                {emp.role === 'external' && currentUser.role !== 'external' && (
                                                                    <DropdownMenuItem onClick={async () => {
                                                                        try {
                                                                            await api.post('/location/request', { targetUserId: emp._id });
                                                                            toast({ title: 'Success', description: 'Location request sent' });
                                                                        } catch (e) {
                                                                            toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
                                                                        }
                                                                    }}><MapPin className="mr-2 h-4 w-4" /> Request Location</DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}
                                                        {emp.status === 'inactive' && (
                                                            <DropdownMenuItem onClick={() => initiateUnsuspend(emp)}><UserCheck className="mr-2 h-4 w-4" /> Reactivate</DropdownMenuItem>
                                                        )}
                                                        {['super_admin', 'admin'].includes(currentUser?.role) && (
                                                            <DropdownMenuItem onClick={() => initiateDelete(emp)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Previous</Button>
                        <span className="text-sm">Page {page} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Next</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                ) : filteredEmployees.length === 0 ? (
                    <Card><CardContent className="p-6 text-center text-gray-500">No employees found.</CardContent></Card>
                ) : (
                    <>
                        {filteredEmployees.map((emp) => (
                            <Card key={emp._id}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 shadow-sm border border-gray-200">
                                                {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900 leading-tight text-base truncate">{emp.name}</h3>
                                                <p className="text-xs text-gray-400 font-mono tracking-tighter">{emp.employeeId || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap font-black uppercase tracking-widest ${emp.status === 'active' ? 'bg-success-50 text-success-700 border border-success-100' : emp.status === 'pending' ? 'bg-warning-50 text-warning-700 border border-warning-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                {emp.status}
                                            </span>
                                            {roleHierarchy[emp.role] < currentRank && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="-mr-1.5 h-7 w-7 rounded-full"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {emp.status === 'pending' && <DropdownMenuItem onClick={() => initiateVerify(emp)}><ShieldCheck className="mr-2 h-4 w-4" /> Verify</DropdownMenuItem>}
                                                        {emp.status === 'active' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => initiateSuspend(emp)}><UserX className="mr-2 h-4 w-4" /> Suspend</DropdownMenuItem>
                                                                {emp.role === 'external' && currentUser.role !== 'external' && (
                                                                    <DropdownMenuItem onClick={async () => {
                                                                        try {
                                                                            await api.post('/location/request', { targetUserId: emp._id });
                                                                            toast({ title: 'Success', description: 'Location request sent' });
                                                                        } catch (e) {
                                                                            toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
                                                                        }
                                                                    }}><MapPin className="mr-2 h-4 w-4" /> Request Location</DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}
                                                        {emp.status === 'inactive' && <DropdownMenuItem onClick={() => initiateUnsuspend(emp)}><UserCheck className="mr-2 h-4 w-4" /> Reactivate</DropdownMenuItem>}
                                                        {['super_admin', 'admin'].includes(currentUser?.role) && <DropdownMenuItem onClick={() => initiateDelete(emp)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 text-xs pt-3 border-t border-gray-50">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-gray-600 font-medium truncate"><Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.email}</div>
                                            <div className="flex items-center text-gray-600 font-medium"><Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.phone}</div>
                                        </div>
                                        <div className="space-y-1 pl-3 border-l border-gray-100">
                                            <div className="flex items-center text-gray-600 font-medium truncate"><Building className="h-3.5 w-3.5 mr-2 text-gray-400" /> {emp.primaryOfficeId?.name || (emp.role.includes('admin') ? 'Global' : 'N/A')}</div>
                                            <div className="flex items-center gap-1.5">
                                                <UserCog className="h-3.5 w-3.5 text-primary/60" />
                                                <span className="font-bold text-primary uppercase text-[10px] tracking-tight">{emp.role.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <div className="flex justify-between items-center px-4 py-3 bg-white rounded-lg border">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Previous</Button>
                            <span className="text-sm">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Next</Button>
                        </div>
                    </>
                )}
            </div>

            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-warning-50"><AlertTriangle className="h-5 w-5 text-warning-600" /></div> Confirm Verification</DialogTitle>
                        <DialogDescription>Verify <strong>{selectedEmployee?.name}</strong>? This grants active status and system access.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-success-600 hover:bg-success-700 text-white" onClick={confirmVerify} disabled={verifying}>{verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm & Verify</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-warning-50"><UserX className="h-5 w-5 text-warning-600" /></div> Confirm Suspension</DialogTitle>
                        <DialogDescription>Suspend <strong>{suspendingEmployee?.name}</strong>? This revokes system access.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmSuspend} disabled={suspending}>{suspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Suspend Employee</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-success-50"><UserCheck className="h-5 w-5 text-success-600" /></div> Confirm Reactivation</DialogTitle>
                        <DialogDescription>Reactivate <strong>{unsuspendingEmployee?.name}</strong>? This restores system access.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnsuspendDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmUnsuspend} disabled={unsuspending}>{unsuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reactivate Employee</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-destructive/10"><Trash2 className="h-5 w-5 text-destructive" /></div> Confirm Deletion</DialogTitle>
                        <DialogDescription>Delete <strong>{deletingEmployee?.name}</strong>? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete Permanently</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BulkEmployeeUpload isOpen={bulkUploadOpen} onClose={() => setBulkUploadOpen(false)} onSuccess={() => { fetchEmployees(); toast({ title: 'Success', description: 'Employees uploaded' }); }} />

            {/* Mobile FAB */}
            {canCreateAny && (
                <div className="md:hidden fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
                    {showActions && (
                        <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-5">
                            <div className="flex items-center gap-2">
                                <span className="bg-white px-3 py-1 rounded shadow text-xs font-semibold">Bulk Upload</span>
                                <Button size="icon" className="h-12 w-12 rounded-full shadow-lg border-2 border-white" onClick={() => { setBulkUploadOpen(true); setShowActions(false); }}><Upload className="h-5 w-5" /></Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-white px-3 py-1 rounded shadow text-xs font-semibold">Add Employee</span>
                                <Button size="icon" className="h-12 w-12 rounded-full shadow-lg border-2 border-white" onClick={() => { setOpen(true); setShowActions(false); }}><UserPlus className="h-5 w-5" /></Button>
                            </div>
                        </div>
                    )}
                    <Button
                        size="icon"
                        className={`h-16 w-16 rounded-full shadow-2xl transition-all border-2 border-white ${showActions ? 'bg-gray-800 rotate-45' : 'bg-primary'}`}
                        onClick={() => setShowActions(!showActions)}
                    >
                        <Plus className="h-8 w-8 text-white" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Employees;
