/**
 * Women Safety System - Incident Logger
 * Database operations for incident tracking
 */

const { v4: uuidv4 } = require('uuid');

/**
 * In-memory storage (replace with MongoDB/PostgreSQL in production)
 */
class IncidentLogger {
    constructor() {
        this.incidents = new Map();
        console.log('Incident logger initialized (in-memory storage)');
    }

    /**
     * Create new incident record
     */
    async createIncident(data) {
        const incident = {
            id: uuidv4(),
            deviceId: data.deviceId,
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            batteryLevel: data.batteryLevel || 100,
            sequenceNumber: data.sequenceNumber || 0,
            timestamp: data.timestamp || Date.now(),
            emergencyContacts: data.emergencyContacts || [],
            status: data.status || 'triggered',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {}
        };

        this.incidents.set(incident.id, incident);

        console.log(`Incident created: ${incident.id}`);

        return incident;
    }

    /**
     * Update incident status
     */
    async updateIncidentStatus(incidentId, status, metadata = {}) {
        const incident = this.incidents.get(incidentId);

        if (!incident) {
            throw new Error(`Incident ${incidentId} not found`);
        }

        incident.status = status;
        incident.updatedAt = new Date().toISOString();
        incident.metadata = { ...incident.metadata, ...metadata };

        this.incidents.set(incidentId, incident);

        console.log(`Incident ${incidentId} updated: ${status}`);

        return incident;
    }

    /**
     * Get incident by ID
     */
    async getIncident(incidentId) {
        return this.incidents.get(incidentId) || null;
    }

    /**
     * Get all incidents for a device
     */
    async getIncidentsByDevice(deviceId) {
        const incidents = [];

        for (const incident of this.incidents.values()) {
            if (incident.deviceId === deviceId) {
                incidents.push(incident);
            }
        }

        // Sort by timestamp descending
        incidents.sort((a, b) => b.timestamp - a.timestamp);

        return incidents;
    }

    /**
     * Get all incidents (with optional filters)
     */
    async getAllIncidents(filters = {}) {
        let incidents = Array.from(this.incidents.values());

        // Apply filters
        if (filters.status) {
            incidents = incidents.filter(i => i.status === filters.status);
        }

        if (filters.deviceId) {
            incidents = incidents.filter(i => i.deviceId === filters.deviceId);
        }

        if (filters.startDate) {
            incidents = incidents.filter(i => i.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            incidents = incidents.filter(i => i.timestamp <= filters.endDate);
        }

        // Sort by timestamp descending
        incidents.sort((a, b) => b.timestamp - a.timestamp);

        return incidents;
    }

    /**
     * Get incident statistics
     */
    async getStats() {
        const incidents = Array.from(this.incidents.values());

        const stats = {
            total: incidents.length,
            byStatus: {},
            byDevice: {},
            avgResponseTime: 0
        };

        let totalResponseTime = 0;
        let responseTimeCount = 0;

        for (const incident of incidents) {
            // Count by status
            stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;

            // Count by device
            stats.byDevice[incident.deviceId] = (stats.byDevice[incident.deviceId] || 0) + 1;

            // Calculate response time
            if (incident.metadata.responseTime) {
                totalResponseTime += incident.metadata.responseTime;
                responseTimeCount++;
            }
        }

        if (responseTimeCount > 0) {
            stats.avgResponseTime = Math.round(totalResponseTime / responseTimeCount);
        }

        return stats;
    }
}

module.exports = new IncidentLogger();

/**
 * MongoDB Implementation Example:
 * 
 * const mongoose = require('mongoose');
 * const Incident = require('../models/Incident');
 * 
 * class IncidentLogger {
 *   async createIncident(data) {
 *     const incident = new Incident(data);
 *     await incident.save();
 *     return incident;
 *   }
 *   
 *   async updateIncidentStatus(incidentId, status, metadata) {
 *     return await Incident.findByIdAndUpdate(
 *       incidentId,
 *       { status, metadata, updatedAt: new Date() },
 *       { new: true }
 *     );
 *   }
 *   
 *   async getIncident(incidentId) {
 *     return await Incident.findById(incidentId);
 *   }
 * }
 */
