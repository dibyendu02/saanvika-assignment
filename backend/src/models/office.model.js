/**
 * Office Model
 * Handles office locations with geospatial support and distribution targets
 */
import mongoose from 'mongoose';

// GeoJSON Point schema for location data
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function (coords) {
          return (
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90
          );
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges',
      },
    },
  },
  { _id: false }
);

// Target schema for distribution goals
const targetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['daily', 'monthly', 'yearly'],
        message: 'Target type must be one of: daily, monthly, yearly',
      },
      required: [true, 'Target type is required'],
    },
    count: {
      type: Number,
      required: [true, 'Target count is required'],
      min: [0, 'Target count cannot be negative'],
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      // Format: "2024-01-15" (daily), "2024-01" (monthly), "2024" (yearly)
    },
  },
  { _id: false }
);

const officeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Office name is required'],
      trim: true,
      maxlength: [200, 'Office name cannot exceed 200 characters'],
    },
    address: {
      type: String,
      required: [true, 'Office address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    location: {
      type: pointSchema,
      required: [true, 'Office location is required'],
    },
    targets: {
      type: [targetSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial queries
officeSchema.index({ location: '2dsphere' });

// Text index for name search
officeSchema.index({ name: 'text' });

const Office = mongoose.model('Office', officeSchema);

export default Office;
