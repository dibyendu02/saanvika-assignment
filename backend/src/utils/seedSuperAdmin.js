/**
 * Super Admin Seeder
 * Creates a default super admin user if none exists
 */
import User from '../models/user.model.js';

/**
 * Seed super admin user
 * Creates a super admin with email: superadmin@test.com and password: password123
 */
export const seedSuperAdmin = async () => {
    try {
        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({
            email: 'superadmin@test.com'
        });

        if (existingSuperAdmin) {
            console.log('Super admin already exists');
            return;
        }

        // Create super admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'superadmin@test.com',
            phone: '9999999999',
            password: 'password123',
            role: 'super_admin',
            status: 'active',
            employeeId: 'SA001',
        });

        console.log('Super admin created successfully');
        console.log('  Email: superadmin@test.com');
        console.log('  Password: password123');
        console.log('  WARNING: Please change the password after first login!');

        return superAdmin;
    } catch (error) {
        console.error('Error seeding super admin:', error.message);
        throw error;
    }
};

export default seedSuperAdmin;
