/**
 * Women Safety System - Incident Model
 * MongoDB schema for incident records
 */

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    deviceId: {
        type: Number,
        required: true,
        index: true
    },
    latitude: {
        type: Number,
        default: 0
    },
    longitude: {
        type: Number,
        default: 0
    },
    batteryLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    sequenceNumber: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    emergencyContacts: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['triggered', 'alerts_sent', 'alert_failed', 'resolved'],
        default: 'triggered',
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for common queries
incidentSchema.index({ deviceId: 1, timestamp: -1 });
incidentSchema.index({ status: 1, timestamp: -1 });

// Virtual for Google Maps link
incidentSchema.virtual('locationUrl').get(function () {
    if (this.latitude && this.longitude) {
        return `https://maps.google.com/?q=${this.latitude},${this.longitude}`;
    }
    return null;
});

// Ensure virtuals are included in JSON
incidentSchema.set('toJSON', { virtuals: true });
incidentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Incident', incidentSchema);
