/**
 * Attendance Model
 * Tracks daily attendance with location data
 * Enforces one attendance record per user per day
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

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      // Stored as start of day UTC
    },
    markedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    location: {
      type: pointSchema,
    },
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Office ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: One attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Compound index for office-wise queries
attendanceSchema.index({ officeId: 1, date: 1 });

// 2dsphere index for geospatial queries
attendanceSchema.index({ location: '2dsphere' });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
