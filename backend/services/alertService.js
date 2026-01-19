/**
 * Women Safety System - Alert Service
 * Handles SMS and phone call alerts via Twilio
 */

const twilio = require('twilio');
const config = require('../config/config');

class AlertService {
    constructor() {
        this.client = null;

        if (config.twilio.accountSid && config.twilio.authToken) {
            this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
            console.log('Twilio client initialized');
        } else {
            console.warn('Twilio credentials not configured - alerts will be simulated');
        }
    }

    /**
     * Send alerts to all emergency contacts
     */
    async sendAlerts(incident, contacts) {
        const results = {
            sms: [],
            calls: []
        };

        const promises = [];

        for (const contact of contacts) {
            if (!contact || contact === '') continue;

            // Send SMS
            promises.push(
                this.sendSMS(contact, incident)
                    .then(result => results.sms.push(result))
                    .catch(error => results.sms.push({
                        contact,
                        success: false,
                        error: error.message
                    }))
            );

            // Initiate call
            promises.push(
                this.makeCall(contact, incident)
                    .then(result => results.calls.push(result))
                    .catch(error => results.calls.push({
                        contact,
                        success: false,
                        error: error.message
                    }))
            );
        }

        await Promise.all(promises);
        return results;
    }

    /**
     * Send SMS alert
     */
    async sendSMS(phoneNumber, incident) {
        const location = incident.latitude && incident.longitude
            ? `Location: https://maps.google.com/?q=${incident.latitude},${incident.longitude}`
            : 'Location: Not available';

        const message = `🚨 EMERGENCY ALERT 🚨\n\n` +
            `A safety alert has been triggered!\n\n` +
            `Device: ${incident.deviceId}\n` +
            `Time: ${new Date(incident.timestamp).toLocaleString()}\n` +
            `${location}\n` +
            `Battery: ${incident.batteryLevel}%\n\n` +
            `This is an automated emergency alert. Please respond immediately.`;

        if (!this.client) {
            console.log(`[SIMULATED] SMS to ${phoneNumber}: ${message}`);
            return { contact: phoneNumber, success: true, simulated: true };
        }

        try {
            const result = await this.client.messages.create({
                body: message,
                from: config.twilio.phoneNumber,
                to: phoneNumber
            });

            console.log(`SMS sent to ${phoneNumber}: ${result.sid}`);

            return {
                contact: phoneNumber,
                success: true,
                sid: result.sid,
                status: result.status
            };

        } catch (error) {
            console.error(`Failed to send SMS to ${phoneNumber}:`, error.message);
            throw error;
        }
    }

    /**
     * Make emergency phone call
     */
    async makeCall(phoneNumber, incident) {
        const location = incident.latitude && incident.longitude
            ? `Latitude ${incident.latitude}, Longitude ${incident.longitude}`
            : 'Location not available';

        // TwiML for voice message
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say voice="alice">
                    Emergency Alert! This is an automated safety alert. 
                    An emergency has been triggered from device ${incident.deviceId}. 
                    ${location}. 
                    Battery level is ${incident.batteryLevel} percent. 
                    Please respond immediately. 
                    This message will repeat.
                </Say>
                <Say voice="alice">
                    Emergency Alert! This is an automated safety alert. 
                    An emergency has been triggered. 
                    Please respond immediately.
                </Say>
            </Response>`;

        if (!this.client) {
            console.log(`[SIMULATED] Call to ${phoneNumber}`);
            return { contact: phoneNumber, success: true, simulated: true };
        }

        try {
            const result = await this.client.calls.create({
                twiml: twiml,
                from: config.twilio.phoneNumber,
                to: phoneNumber,
                timeout: config.alerts.callDurationSeconds
            });

            console.log(`Call initiated to ${phoneNumber}: ${result.sid}`);

            return {
                contact: phoneNumber,
                success: true,
                sid: result.sid,
                status: result.status
            };

        } catch (error) {
            console.error(`Failed to call ${phoneNumber}:`, error.message);
            throw error;
        }
    }
}

module.exports = new AlertService();
