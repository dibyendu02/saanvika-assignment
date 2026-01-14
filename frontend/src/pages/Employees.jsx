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
import { Loader2, UserPlus, ShieldCheck, UserCog, Mail, Phone, Building, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

    const getAvailableRoles = () => {
        return Object.keys(roleHierarchy).filter(role => roleHierarchy[role] < currentRank);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
                </div>
                {canCreateAny && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register New Employee</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4 border-t mt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
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
                                        <Label htmlFor="email">Email Address</Label>
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
                                        <Label htmlFor="phone">Phone Number</Label>
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
                                        <Label htmlFor="role">Role (Provisioned)</Label>
                                        <select
                                            id="role"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                        <Label htmlFor="office">Assigned Office</Label>
                                        <select
                                            id="office"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                    <Label htmlFor="password">Initial Password</Label>
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
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full mt-4" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create and Activate Employee
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
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
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <TableRow key={emp._id}>
                                        <TableCell>
                                            <div className="font-medium text-base">{emp.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{emp._id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm font-medium">
                                                <Mail className="h-3.5 w-3.5 mr-2 text-primary/70" /> {emp.email}
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                <Phone className="h-3.5 w-3.5 mr-2 text-primary/70" /> {emp.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm font-medium">
                                                <Building className="h-3.5 w-3.5 mr-2 text-primary/70" />
                                                {emp.primaryOfficeId?.name || (emp.role.includes('admin') ? 'Global' : 'Not Assigned')}
                                            </div>
                                            <div className="flex items-center text-xs mt-2">
                                                <span className={`px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary font-bold uppercase tracking-wider`}>
                                                    {emp.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${emp.status === 'active' ? 'bg-green-100 text-green-700' :
                                                emp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-destructive/10 text-destructive'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {emp.status === 'pending' && roleHierarchy[emp.role] < currentRank && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => initiateVerify(emp)}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-8"
                                                >
                                                    <ShieldCheck className="mr-2 h-4 w-4" /> Verify
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex justify-between items-center p-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-500">
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
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Confirm Verification
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to verify <strong>{selectedEmployee?.name}</strong>?
                            <br />
                            <span className="text-xs text-muted-foreground mt-2 block">
                                Verification will grant active status and access to the system.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setVerifyDialogOpen(false)} disabled={verifying}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={confirmVerify}
                            disabled={verifying}
                        >
                            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Verify
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default Employees;
