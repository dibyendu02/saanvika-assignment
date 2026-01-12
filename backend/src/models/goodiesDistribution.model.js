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
      required: [true, 'Office ID is required'],
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index: One distribution per office per date per goodies type
goodiesDistributionSchema.index(
  { officeId: 1, distributionDate: 1, goodiesType: 1 },
  { unique: true }
);

// Index for office-based queries
goodiesDistributionSchema.index({ officeId: 1, distributionDate: -1 });

// Index for user-based queries
goodiesDistributionSchema.index({ distributedBy: 1 });

const GoodiesDistribution = mongoose.model(
  'GoodiesDistribution',
  goodiesDistributionSchema
);

export default GoodiesDistribution;
