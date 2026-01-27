/**
 * User Model
 * Handles employee/user data with role-based access control
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: false,
      sparse: true, // Allows multiple null/empty values for unique index
      unique: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
      unique: true,
    },
    age: {
      type: Number,
      min: [18, 'Age must be at least 18'],
      max: [100, 'Age must be less than 100'],
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be one of: male, female, other',
      },
    },
    dob: {
      type: Date,
    },
    role: {
      type: String,
      enum: {
        values: ['super_admin', 'admin', 'internal', 'external'],
        message: 'Role must be one of: super_admin, admin, internal, external',
      },
      default: 'external',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'inactive'],
        message: 'Status must be one of: pending, active, inactive',
      },
      default: 'pending',
    },
    primaryOfficeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      validate: {
        validator: function (value) {
          // Required only for internal and external employees
          if (['internal', 'external'].includes(this.role)) {
            return value != null;
          }
          // Optional for super_admin and admin
          return true;
        },
        message: 'primaryOfficeId is required for internal and external employees',
      },
    },
    assignedOfficeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      validate: {
        validator: function (value) {
          // Required for admin role
          if (this.role === 'admin') {
            return value != null;
          }
          // Optional for other roles
          return true;
        },
        message: 'assignedOfficeId is required for admin users',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    // Multiple FCM tokens for multi-device support
    fcmTokens: [{
      token: {
        type: String,
        required: true,
      },
      deviceId: {
        type: String,
        required: true,
      },
      platform: {
        type: String,
        enum: ['web', 'ios', 'android'],
        default: 'web',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
      lastUsed: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for query optimization
userSchema.index({ primaryOfficeId: 1, role: 1 });


// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook: Auto-activate certain roles
userSchema.pre('save', function (next) {
  if (this.isNew) {
    // Auto-activate super_admin, admin, internal
    if (['super_admin', 'admin', 'internal'].includes(this.role)) {
      this.status = 'active';
    }
    // Auto-activate external employees created by authorized users
    if (this.role === 'external' && this.createdBy) {
      this.status = 'active';
      this.verifiedBy = this.createdBy;
      this.verifiedAt = new Date();
    }
  }
  next();
});

/**
 * Compare candidate password with stored hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate JWT authentication token
 * @returns {string} - JWT token
 */
userSchema.methods.generateAuthToken = function () {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Add or update FCM token for a device
 * @param {string} token - FCM token
 * @param {string} deviceId - Unique device identifier
 * @param {string} platform - Platform (web, ios, android)
 * @returns {Promise<void>}
 */
userSchema.methods.addFcmToken = async function (token, deviceId, platform = 'web') {
  // Check if token already exists for this device
  const existingTokenIndex = this.fcmTokens.findIndex(
    (t) => t.deviceId === deviceId
  );

  if (existingTokenIndex !== -1) {
    // Update existing token
    this.fcmTokens[existingTokenIndex].token = token;
    this.fcmTokens[existingTokenIndex].lastUsed = new Date();
    this.fcmTokens[existingTokenIndex].platform = platform;
  } else {
    // Add new token
    this.fcmTokens.push({
      token,
      deviceId,
      platform,
      addedAt: new Date(),
      lastUsed: new Date(),
    });
  }

  await this.save();
};

/**
 * Remove FCM token for a device
 * @param {string} deviceId - Unique device identifier
 * @returns {Promise<void>}
 */
userSchema.methods.removeFcmToken = async function (deviceId) {
  this.fcmTokens = this.fcmTokens.filter((t) => t.deviceId !== deviceId);
  await this.save();
};

/**
 * Update last used timestamp for a device token
 * @param {string} deviceId - Unique device identifier
 * @returns {Promise<void>}
 */
userSchema.methods.updateTokenLastUsed = async function (deviceId) {
  const tokenIndex = this.fcmTokens.findIndex((t) => t.deviceId === deviceId);
  if (tokenIndex !== -1) {
    this.fcmTokens[tokenIndex].lastUsed = new Date();
    await this.save();
  }
};

/**
 * Get all active FCM tokens
 * @returns {Array<string>} - Array of FCM tokens
 */
userSchema.methods.getActiveFcmTokens = function () {
  return this.fcmTokens.map((t) => t.token);
};

const User = mongoose.model('User', userSchema);

export default User;
