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
    Users
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Offices', href: '/offices', icon: Building2, roles: ['super_admin', 'admin'] },
        { name: 'Employees', href: '/employees', icon: Users, roles: ['super_admin', 'admin', 'internal'] },
        { name: 'Attendance', href: '/attendance', icon: UserCheck, roles: ['super_admin', 'admin', 'internal', 'external'] },
        { name: 'Goodies', href: '/goodies', icon: Gift, roles: ['super_admin', 'admin', 'internal', 'external'] },
    ];

    const filteredNavigation = navigation.filter(item => item.roles.includes(user?.role));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-primary">SAANVIKA</h1>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b flex items-center justify-between px-8 md:hidden">
                    <h1 className="text-xl font-bold text-primary">SAANVIKA</h1>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </header>
                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
