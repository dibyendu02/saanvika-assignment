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
      required: [true, 'Phone number is required'],
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
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ primaryOfficeId: 1, role: 1 });
userSchema.index({ assignedOfficeId: 1 });


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

const User = mongoose.model('User', userSchema);

export default User;
