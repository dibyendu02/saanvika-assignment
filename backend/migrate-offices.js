/**
 * Migration Script: Add targetHeadcount to existing offices
 * Run this once after deploying the updated Office model
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Office from './src/models/office.model.js';

dotenv.config();

const migrateOffices = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('Updating offices...');

        // Remove the 'targets' field and add 'targetHeadcount' if it doesn't exist
        const result = await Office.updateMany(
            {},
            {
                $unset: { targets: "" }, // Remove old targets array
                $set: { targetHeadcount: 0 } // Add targetHeadcount with default value
            }
        );

        console.log(`Updated ${result.modifiedCount} offices`);
        console.log('Migration completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateOffices();
