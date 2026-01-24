/**
 * Location Request Model
 * Stores requests from admins/internal staff to see an external employee's location
 */
import mongoose from 'mongoose';

const locationRequestSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'shared', 'denied', 'expired'],
            default: 'pending',
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: {
            type: Date,
        },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
    },
    {
        timestamps: true,
    }
);

locationRequestSchema.index({ targetUser: 1, status: 1 });
locationRequestSchema.index({ requester: 1 });

const LocationRequest = mongoose.model('LocationRequest', locationRequestSchema);

export default LocationRequest;
