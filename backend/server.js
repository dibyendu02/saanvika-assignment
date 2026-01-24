import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import seedSuperAdmin from './src/utils/seedSuperAdmin.js';
import { initializeFirebase } from './src/services/firebase.service.js';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Firebase Admin SDK
    initializeFirebase();

    // Seed super admin if not exists
    await seedSuperAdmin();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();
