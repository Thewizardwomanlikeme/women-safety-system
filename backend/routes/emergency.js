/**
 * Women Safety System - Emergency Routes
 * API endpoints for emergency events
 */

const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const incidentLogger = require('../services/incidentLogger');

/**
 * POST /api/emergency
 * Receive emergency alert from Android app
 */
router.post('/', async (req, res) => {
    try {
        const {
            deviceId,
            latitude,
            longitude,
            batteryLevel,
            sequenceNumber,
            timestamp,
            emergencyContacts
        } = req.body;

        // Validate required fields
        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        if (!emergencyContacts || emergencyContacts.length === 0) {
            return res.status(400).json({ error: 'At least one emergency contact required' });
        }

        console.log(`Emergency received from device 0x${deviceId.toString(16).padStart(4, '0')}`);
        console.log(`Location: ${latitude}, ${longitude}`);
        console.log(`Battery: ${batteryLevel}%`);
        console.log(`Contacts: ${emergencyContacts.join(', ')}`);

        // Create incident record
        const incident = await incidentLogger.createIncident({
            deviceId,
            latitude,
            longitude,
            batteryLevel,
            sequenceNumber,
            timestamp: timestamp || Date.now(),
            emergencyContacts,
            status: 'triggered'
        });

        console.log(`Incident created: ${incident.id}`);

        // Send alerts asynchronously (don't wait)
        alertService.sendAlerts(incident, emergencyContacts)
            .then(results => {
                console.log(`Alerts sent for incident ${incident.id}:`, results);
                incidentLogger.updateIncidentStatus(incident.id, 'alerts_sent', {
                    alertResults: results,
                    responseTime: Date.now() - incident.timestamp
                });
            })
            .catch(error => {
                console.error(`Error sending alerts for incident ${incident.id}:`, error);
                incidentLogger.updateIncidentStatus(incident.id, 'alert_failed', {
                    error: error.message
                });
            });

        // Return immediate response
        res.status(201).json({
            success: true,
            incidentId: incident.id,
            message: 'Emergency alert received and being processed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error processing emergency:', error);
        res.status(500).json({
            error: 'Failed to process emergency alert',
            message: error.message
        });
    }
});

/**
 * GET /api/emergency/:id
 * Get incident status by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const incident = await incidentLogger.getIncident(req.params.id);

        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        res.json(incident);

    } catch (error) {
        console.error('Error fetching incident:', error);
        res.status(500).json({
            error: 'Failed to fetch incident',
            message: error.message
        });
    }
});

/**
 * GET /api/emergency/device/:deviceId
 * Get all incidents for a device
 */
router.get('/device/:deviceId', async (req, res) => {
    try {
        const incidents = await incidentLogger.getIncidentsByDevice(
            parseInt(req.params.deviceId)
        );

        res.json({
            deviceId: req.params.deviceId,
            count: incidents.length,
            incidents
        });

    } catch (error) {
        console.error('Error fetching device incidents:', error);
        res.status(500).json({
            error: 'Failed to fetch incidents',
            message: error.message
        });
    }
});

module.exports = router;
