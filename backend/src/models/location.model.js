/**
 * Location Model
 * Stores shared location data from employees
 * This is separate from attendance - no office proximity enforcement
 */
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    sharedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location queries
locationSchema.index({ location: '2dsphere' });

// Compound index for user location history
locationSchema.index({ userId: 1, sharedAt: -1 });

const Location = mongoose.model('Location', locationSchema);

export default Location;
