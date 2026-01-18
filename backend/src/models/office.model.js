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
    targetHeadcount: {
      type: Number,
      default: 0,
      min: [0, 'Target headcount cannot be negative'],
    },
    officeType: {
      type: String,
      enum: {
        values: ['main', 'branch'],
        message: 'Office type must be either main or branch',
      },
      default: 'branch',
      required: [true, 'Office type is required'],
    },
    isMainOffice: {
      type: Boolean,
      default: false,
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

// Index for office type queries
officeSchema.index({ officeType: 1 });
officeSchema.index({ isMainOffice: 1 });

// Pre-save validation: Ensure only one main office exists
officeSchema.pre('save', async function (next) {
  console.log('Pre-save hook - targetHeadcount before:', this.targetHeadcount);

  if (this.officeType === 'main' || this.isMainOffice === true) {
    // Set both fields consistently
    this.officeType = 'main';
    this.isMainOffice = true;

    // Check if another main office already exists
    const existingMainOffice = await this.constructor.findOne({
      isMainOffice: true,
      _id: { $ne: this._id }, // Exclude current document if updating
    });

    if (existingMainOffice) {
      const error = new Error('A main office already exists. Only one main office is allowed.');
      return next(error);
    }
  } else {
    // Ensure branch offices have correct values
    this.officeType = 'branch';
    this.isMainOffice = false;
  }

  console.log('Pre-save hook - targetHeadcount after:', this.targetHeadcount);
  next();
});


const Office = mongoose.model('Office', officeSchema);

export default Office;
