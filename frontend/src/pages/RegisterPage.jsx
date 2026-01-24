import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, ArrowLeft, Building2, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingOffices, setFetchingOffices] = useState(true);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        primaryOfficeId: '',
        employeeId: '',
        age: '',
        gender: '',
        dob: '',
        role: 'external' // Default for self-registration
    });

    useEffect(() => {
        const fetchOffices = async () => {
            try {
                // Use public endpoint for registration dropdown
                const response = await api.get('/offices/public');
                const data = response.data.data;
                const docs = data.offices || (Array.isArray(data) ? data : []);
                setOffices(docs);
            } catch (err) {
                console.error('Error fetching offices:', err);
                setError('Could not load offices. Please try again later.');
            } finally {
                setFetchingOffices(false);
            }
        };
        fetchOffices();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', formData);
            navigate('/login', {
                state: { message: 'Registration successful! Please wait for an admin to verify your account.' }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                        <Link to="/login" className="text-sm text-gray-600 flex items-center hover:text-gray-900 transition-colors">
                            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Login
                        </Link>
                    </div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-gray-700" />
                        </div>
                        Employee Registration
                    </CardTitle>
                    <CardDescription>
                        Register as an external employee for SAANVIKA
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                            <Input id="name" placeholder="John Doe" required value={formData.name} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                            <Input id="email" type="email" placeholder="john@example.com" required value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                            <Input id="phone" type="tel" placeholder="9876543210" required value={formData.phone} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">Employee ID</Label>
                                <Input id="employeeId" placeholder="EMP001" value={formData.employeeId} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                                <select
                                    id="gender"
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                    value={formData.gender}
                                    onChange={handleChange}
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
                                <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
                                <Input id="age" type="number" min="18" max="100" placeholder="18-100" value={formData.age} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                                <Input id="dob" type="date" value={formData.dob} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primaryOfficeId" className="text-sm font-medium text-gray-700">Primary Office</Label>
                            <select
                                id="primaryOfficeId"
                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50"
                                value={formData.primaryOfficeId}
                                onChange={handleChange}
                                required
                                disabled={fetchingOffices}
                            >
                                <option value="">Select your office</option>
                                {offices.map((office) => (
                                    <option key={office._id} value={office._id}>
                                        {office.name}
                                    </option>
                                ))}
                            </select>
                            {fetchingOffices && <p className="text-xs text-gray-500">Loading offices...</p>}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Register Account
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default RegisterPage;
