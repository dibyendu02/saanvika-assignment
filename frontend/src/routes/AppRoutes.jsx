import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import Offices from '../pages/Offices';
import Attendance from '../pages/Attendance';
import Goodies from '../pages/Goodies';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'internal']}>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/offices"
                element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                        <Layout>
                            <Offices />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/attendance"
                element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'internal']}>
                        <Layout>
                            <Attendance />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/goodies"
                element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'internal']}>
                        <Layout>
                            <Goodies />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route path="/unauthorized" element={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-red-600">403</h1>
                        <p className="text-xl">Access Denied</p>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="mt-4 text-primary hover:underline"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

export default AppRoutes;
