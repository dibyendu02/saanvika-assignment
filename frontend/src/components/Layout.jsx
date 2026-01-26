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
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">SAANVIKA</h1>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                {item.name}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center mb-3 px-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
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
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">SAANVIKA</h1>
                        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:hidden sticky top-0 z-30">
                    <h1 className="text-xl font-bold text-gray-900">SAANVIKA</h1>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
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
