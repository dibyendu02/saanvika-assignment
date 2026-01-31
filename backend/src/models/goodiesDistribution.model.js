/**
 * Goodies Distribution Model
 * Tracks goodies distribution events at offices
 */
import mongoose from 'mongoose';

const goodiesDistributionSchema = new mongoose.Schema(
  {
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      required: false, // Changed from true to false: Supports global/multi-office distributions
    },
    distributionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    goodiesType: {
      type: String,
      required: [true, 'Goodies type is required'],
      trim: true,
      maxlength: [100, 'Goodies type cannot exceed 100 characters'],
    },
    distributedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Distributed by user ID is required'],
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Total quantity must be at least 1'],
    },
    isForAllEmployees: {
      type: Boolean,
      default: true,
    },
    targetEmployees: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      validate: {
        validator: function (value) {
          // If not for all employees, targetEmployees must not be empty (unless unregisteredRecipients has items)
          if (this.isForAllEmployees === false && (!value || value.length === 0) && (!this.unregisteredRecipients || this.unregisteredRecipients.length === 0)) {
            return false;
          }
          // If for all employees, targetEmployees should be empty
          if (this.isForAllEmployees === true && value && value.length > 0) {
            return false;
          }
          return true;
        },
        message: 'At least one recipient (registered or unregistered) must be specified when isForAllEmployees is false',
      },
    },
    unregisteredRecipients: [
      {
        name: { type: String, required: true },
        officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' }, // Optional
        employeeId: { type: String }, // Optional ID if provided in sheet but not in system
        isClaimed: { type: Boolean, default: false },
        claimedAt: { type: Date },
        handedOverBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Removed strict office-based uniqueness to allow single global entries
// goodiesDistributionSchema.index(
//   { officeId: 1, distributionDate: 1, goodiesType: 1 },
//   { unique: true }
// );
// Replaced with a looser index or none, but keeping query optimizations:
goodiesDistributionSchema.index({ distributionDate: -1, goodiesType: 1 });

// Index for office-based queries (still useful if officeId exists)
goodiesDistributionSchema.index({ officeId: 1, distributionDate: -1 });

// Index for user-based queries
goodiesDistributionSchema.index({ distributedBy: 1 });

// Index for targeted distribution queries
goodiesDistributionSchema.index({ targetEmployees: 1 });
goodiesDistributionSchema.index({ isForAllEmployees: 1 });


const GoodiesDistribution = mongoose.model(
  'GoodiesDistribution',
  goodiesDistributionSchema
);

export default GoodiesDistribution;
