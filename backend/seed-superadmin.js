/**
 * Standalone Super Admin Seeder Script
 * Run this script manually to create a super admin user
 * Usage: node seed-superadmin.js
 */
import 'dotenv/config';
import connectDB from './src/config/database.js';
import seedSuperAdmin from './src/utils/seedSuperAdmin.js';

const runSeeder = async () => {
    try {
        console.log('🌱 Starting super admin seeder...\n');

        // Connect to database
        await connectDB();

        // Seed super admin
        await seedSuperAdmin();

        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

runSeeder();
