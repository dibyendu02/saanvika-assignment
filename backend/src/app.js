import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import routes
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import officeRoutes from './routes/office.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import goodiesRoutes from './routes/goodies.routes.js';

// Import middlewares
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/offices', officeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/goodies', goodiesRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found'
  });
});

// Global error handler
app.use(errorHandler);

export default app;
