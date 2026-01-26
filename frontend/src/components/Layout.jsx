import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
    LayoutDashboard,
    Building2,
    UserCheck,
    Gift,
    LogOut,
    Menu,
    Users,
    MapPin,
    ChevronRight,
    X,
    Navigation,
    Bell
} from 'lucide-react';
import Notifications from './Notifications';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Offices', href: '/offices', icon: Building2, roles: ['super_admin'] },
        { name: 'Employees', href: '/employees', icon: Users, roles: ['super_admin', 'admin', 'internal'] },
        { name: 'Attendance', href: '/attendance', icon: UserCheck, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Goodies', href: '/goodies', icon: Gift, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Locations', href: '/locations', icon: MapPin, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Location Requests', href: '/location-requests', icon: Navigation, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['super_admin', 'admin', 'internal', 'external'] },
    ];

    const filteredNavigation = navigation.filter(item => item.roles.includes(user?.role));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary border-r border-primary-600 hidden md:flex flex-col fixed h-full shadow-lg">
                {/* Header */}
                <div className="p-6 border-b border-primary-600">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <span className="text-primary font-bold text-xl">S</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-wider">SAANVIKA</h1>
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary/20 text-secondary uppercase tracking-widest border border-secondary/30">
                        {user?.role?.replace('_', ' ')}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative ${isActive
                                    ? 'bg-secondary text-primary shadow-md shadow-secondary/20'
                                    : 'text-primary-100 hover:bg-primary-600/50 hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-primary-300 group-hover:text-secondary'}`} />
                                {item.name}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-primary-600 bg-primary-600/30">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-primary ring-2 ring-secondary/20 shadow-inner">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-primary-300 truncate font-mono">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 group transition-all duration-200"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium">Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-primary-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <span className="text-primary font-bold text-xl">S</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-wider">SAANVIKA</h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-primary-200 hover:text-white hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex-1 py-6 px-3 space-y-1.5">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 font-semibold'
                                    : 'text-primary-100 hover:bg-primary-600/50 hover:text-white'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : 'text-primary-300'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-primary-600 bg-primary-600/30">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:ml-64">
                {/* Mobile Header */}
                <header className="h-16 bg-primary border-b border-primary-600 flex items-center justify-between px-6 md:hidden sticky top-0 z-30 shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <span className="text-primary font-bold text-xl">S</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-wider">SAANVIKA</h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-primary-100 hover:text-white hover:bg-white/10">
                        <Menu className="h-6 w-6" />
                    </Button>
                </header>

                {/* Desktop Header */}
                <header className="hidden md:flex h-14 bg-white border-b border-gray-200 items-center justify-between px-6 sticky top-0 z-10">
                    <nav className="flex items-center text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                            Welcome, {user?.name || 'User'}
                        </span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Notifications />
                    </div>
                </header>

                <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
