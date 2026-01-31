/**
 * Upload Middleware
 * Handles file uploads using multer
 */
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from 'fs';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../temp/uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter for Excel files
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new AppError('Only Excel files (.xlsx, .xls) are allowed', 400), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
});

// Middleware for single file upload
export const uploadSingleFile = upload.single('file');

// Error handling middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size cannot exceed 5MB', 400));
        }
        return next(new AppError(err.message, 400));
    }
    next(err);
};

export default {
    uploadSingleFile,
    handleUploadError,
};
