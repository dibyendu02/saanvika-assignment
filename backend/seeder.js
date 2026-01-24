import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './src/models/user.model.js';
import Office from './src/models/office.model.js';
import Attendance from './src/models/attendance.model.js';
import Location from './src/models/location.model.js';
import GoodiesDistribution from './src/models/goodiesDistribution.model.js';
import GoodiesReceived from './src/models/goodiesReceived.model.js';

dotenv.config();

const password = 'password123';
const SALT_ROUNDS = 10;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        console.log('Starting data seeding...');

        // Connect to DB
        await connectDB();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 1. Create Offices
        console.log('Creating/Finding Offices...');
        const officesData = [
            { name: 'Headquarters', address: '123 Tech Park, Bangalore', location: { type: 'Point', coordinates: [77.5946, 12.9716] } },
            { name: 'Mumbai Branch', address: '456 Fin Hub, Mumbai', location: { type: 'Point', coordinates: [72.8777, 19.0760] } },
            { name: 'Delhi Hub', address: '789 Connaught Place, Delhi', location: { type: 'Point', coordinates: [77.2090, 28.6139] } }
        ];

        let offices = [];
        for (const officeData of officesData) {
            let office = await Office.findOne({ name: officeData.name });
            if (!office) {
                office = await Office.create(officeData);
                console.log(`Created office: ${office.name}`);
            }
            offices.push(office);
        }

        // 2. Create Users (Employees)
        console.log('Creating Employees...');

        // Helper to create user if not exists
        const createUser = async (userData) => {
            const exists = await User.findOne({ email: userData.email });
            if (!exists) {
                return await User.create({ ...userData, password: hashedPassword });
            }
            return exists;
        };

        const usersToCreate = [];

        // Ensure Admin exists
        await createUser({
            name: 'Super Admin',
            email: 'superadmin@test.com',
            role: 'super_admin',
            phone: '9999999999',
            status: 'active',
            isVerified: true,
            employeeId: 'SA001'
        });

        // 10 Internal Employees
        for (let i = 1; i <= 10; i++) {
            const office = offices[i % offices.length];
            usersToCreate.push({
                name: `Internal Employee ${i}`,
                email: `internal${i}@test.com`,
                role: 'internal',
                phone: `99000000${i.toString().padStart(2, '0')}`,
                status: 'active',
                isVerified: true,
                primaryOfficeId: office._id,
                employeeId: `INT${i.toString().padStart(3, '0')}`
            });
        }

        // 15 External Employees
        for (let i = 1; i <= 15; i++) {
            const office = offices[i % offices.length];
            usersToCreate.push({
                name: `External Staff ${i}`,
                email: `external${i}@test.com`,
                role: 'external',
                phone: `88000000${i.toString().padStart(2, '0')}`,
                status: 'active',
                isVerified: true,
                primaryOfficeId: office._id,
                employeeId: `EXT${i.toString().padStart(3, '0')}`
            });
        }

        let employees = [];
        for (const u of usersToCreate) {
            const emp = await createUser(u);
            employees.push(emp);
        }
        console.log(`Ensured ${employees.length} employees exist.`);

        // 3. Create Attendance
        console.log('Seeding Attendance Records...');
        // Last 30 days
        const attendanceRecords = [];
        for (const emp of employees) {
            // Randomly attend 70% of days
            for (let d = 0; d < 30; d++) {
                if (Math.random() > 0.3) {
                    const date = new Date();
                    date.setDate(date.getDate() - d);
                    date.setUTCHours(0, 0, 0, 0);

                    // Check duplicate
                    const exists = await Attendance.findOne({ userId: emp._id, date: date });
                    if (!exists) {
                        attendanceRecords.push({
                            userId: emp._id,
                            date: date,
                            markedAt: new Date(date.getTime() + 9 * 60 * 60 * 1000 + Math.random() * 3600000), // 9 AM + random time
                            location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Dummy coords
                            officeId: emp.primaryOfficeId
                        });
                    }
                }
            }
        }

        if (attendanceRecords.length > 0) {
            // Batch insert for speed
            // Note: insertMany might fail validations or duplicates if race condition, but fine here
            try {
                await Attendance.insertMany(attendanceRecords, { ordered: false });
                console.log(`Added ${attendanceRecords.length} attendance records.`);
            } catch (e) {
                // Ignore duplicate key errors if any
                console.log(`Added attendance records (some duplicates skipped).`);
            }
        }

        // 4. Create Locations (Shared History)
        console.log('Seeding Location History...');
        const locations = [];
        for (const emp of employees) {
            for (let i = 0; i < 3; i++) {
                locations.push({
                    userId: emp._id,
                    location: { type: 'Point', coordinates: [77.59 + (Math.random() / 100), 12.97 + (Math.random() / 100)] },
                    reason: `Routine checkin ${i + 1}`,
                    sharedAt: new Date()
                });
            }
        }
        await Location.deleteMany({}); // Clear old junk if any for clean view
        await Location.insertMany(locations);
        console.log(`Added ${locations.length} location shares.`);

        // 5. Goodies Distribution
        console.log('Seeding Goodies Distributions...');
        const goodieTypes = ['Diwali Gift Box', 'New Year Kit', 'Welcome Pack', 'Q1 Performance Bonus', 'Summer Refreshments'];

        let distributions = [];
        for (const office of offices) {
            for (const type of goodieTypes) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Past 2 months

                const exists = await GoodiesDistribution.findOne({ officeId: office._id, goodiesType: type });
                if (!exists) {
                    const dist = await GoodiesDistribution.create({
                        officeId: office._id,
                        goodiesType: type,
                        distributionDate: date,
                        totalQuantity: 50,
                        distributedBy: employees[0]._id // Just assign to first user/admin
                    });
                    distributions.push(dist);
                } else {
                    distributions.push(exists);
                }
            }
        }
        console.log(`Ensured ${distributions.length} goodies distributions.`);

        // 6. Goodies Claims
        console.log('Seeding Goodies Claims...');
        const claims = [];
        for (const dist of distributions) {
            // Find eligible employees (same office)
            const eligible = employees.filter(e => e.primaryOfficeId && e.primaryOfficeId.toString() === dist.officeId.toString());

            // 50% claim rate
            for (const emp of eligible) {
                if (Math.random() > 0.5) {
                    const exists = await GoodiesReceived.findOne({ userId: emp._id, goodiesDistributionId: dist._id });
                    if (!exists) {
                        claims.push({
                            goodiesDistributionId: dist._id,
                            userId: emp._id,
                            receivedAt: new Date(),
                            receivedAtOfficeId: dist.officeId,
                            handedOverBy: employees[0]._id // Self/Admin
                        });
                    }
                }
            }
        }
        if (claims.length > 0) {
            await GoodiesReceived.insertMany(claims);
            console.log(`Added ${claims.length} goodies claims.`);
        }

        console.log('Data Seeding Completed Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
