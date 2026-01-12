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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Gift, CheckCircle2, AlertTriangle } from 'lucide-react';
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
    const [selectedDistribution, setSelectedDistribution] = useState(null);

    // Form state
    const [newItem, setNewItem] = useState({
        goodiesType: '',
        totalQuantity: 0,
        officeId: '',
        distributionDate: new Date().toISOString().split('T')[0]
    });

    const isAdmin = ['super_admin', 'admin'].includes(user?.role);

    useEffect(() => {
        fetchDistributions();
        if (isAdmin) {
            fetchOffices();
        }
    }, [isAdmin]);

    const fetchDistributions = async () => {
        try {
            const response = await api.get('/goodies/distributions');
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

        setCreating(true);
        try {
            await api.post('/goodies/distributions', newItem);
            toast({ title: 'Success', description: 'Goodie distribution created' });
            fetchDistributions();
            setNewItem({
                goodiesType: '',
                totalQuantity: 0,
                officeId: '',
                distributionDate: new Date().toISOString().split('T')[0]
            });
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Goodies Distribution</h2>
                {isAdmin && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button><Gift className="mr-2 h-4 w-4" /> New Distribution</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Distribution</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="goodiesType">Goodies Type</Label>
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
                                        <Label htmlFor="qty">Total Quantity</Label>
                                        <Input
                                            id="qty"
                                            type="number"
                                            value={newItem.totalQuantity}
                                            onChange={e => setNewItem({ ...newItem, totalQuantity: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
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
                                    <Label htmlFor="office">Office</Label>
                                    <select
                                        id="office"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newItem.officeId}
                                        onChange={e => setNewItem({ ...newItem, officeId: e.target.value })}
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
                                <Button type="submit" className="w-full mt-4" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Distribution
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Confirmation Modal */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Confirm Claim
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to claim <strong>{selectedDistribution?.goodiesType}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
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

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Goodies Type</TableHead>
                                <TableHead>Office</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Quantity</TableHead>
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
                            ) : !Array.isArray(distributions) || distributions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No distributions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                distributions.map((item, index) => (
                                    <TableRow key={item._id || index}>
                                        <TableCell className="font-medium">
                                            {item.goodiesType}
                                        </TableCell>
                                        <TableCell>{item.officeId?.name || 'Unknown Office'}</TableCell>
                                        <TableCell>
                                            {item.distributionDate ? format(new Date(item.distributionDate), 'MMM dd, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>{item.totalQuantity}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={item.isReceived ? "secondary" : "outline"}
                                                onClick={() => !item.isReceived && initiateClaim(item)}
                                                disabled={item.isReceived}
                                                className={item.isReceived
                                                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 opacity-100"
                                                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                                }
                                            >
                                                {item.isReceived ? (
                                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Claimed</>
                                                ) : (
                                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Claim</>
                                                )}
                                            </Button>
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
