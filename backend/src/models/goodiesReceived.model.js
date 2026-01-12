/**
 * Goodies Received Model
 * Tracks individual goodies receipts by users
 * Enforces one receipt per user per distribution event
 */
import mongoose from 'mongoose';

const goodiesReceivedSchema = new mongoose.Schema(
  {
    goodiesDistributionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodiesDistribution',
      required: [true, 'Goodies distribution ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    receivedAtOfficeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Received at office ID is required'],
    },
    handedOverBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Handed over by user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Prevents duplicate goodies for same distribution
goodiesReceivedSchema.index(
  { goodiesDistributionId: 1, userId: 1 },
  { unique: true }
);

// Index for user-based queries
goodiesReceivedSchema.index({ userId: 1, receivedAt: -1 });

// Index for office-based queries
goodiesReceivedSchema.index({ receivedAtOfficeId: 1, receivedAt: -1 });

const GoodiesReceived = mongoose.model(
  'GoodiesReceived',
  goodiesReceivedSchema
);

export default GoodiesReceived;
