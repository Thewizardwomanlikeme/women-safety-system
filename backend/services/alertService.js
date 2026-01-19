/**
 * Women Safety System - Alert Service
 * Handles SMS and phone call alerts via CPaaS providers
 */

const ProviderFactory = require('./providers/ProviderFactory');
const config = require('../config/config');

class AlertService {
    constructor() {
        this.provider = null;

        try {
            this.provider = ProviderFactory.createProvider(config.cpaas);
            console.log(`CPaaS provider initialized: ${this.provider.getProviderName()}`);
        } catch (error) {
            console.warn(`CPaaS provider initialization failed: ${error.message}`);
            console.warn('Alerts will be simulated');
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

        if (!this.provider) {
            console.log(`[SIMULATED] SMS to ${phoneNumber}: ${message}`);
            return { contact: phoneNumber, success: true, simulated: true };
        }

        try {
            const result = await this.provider.sendSMS(phoneNumber, message);

            console.log(`SMS sent to ${phoneNumber}:`, result);

            return {
                contact: phoneNumber,
                success: true,
                sid: result.messageId,
                status: result.status,
                provider: result.provider
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

        // Voice message text
        const voiceMessage = `Emergency Alert! This is an automated safety alert. ` +
            `An emergency has been triggered from device ${incident.deviceId}. ` +
            `${location}. ` +
            `Battery level is ${incident.batteryLevel} percent. ` +
            `Please respond immediately. ` +
            `This message will repeat. ` +
            `Emergency Alert! This is an automated safety alert. ` +
            `An emergency has been triggered. ` +
            `Please respond immediately.`;

        if (!this.provider) {
            console.log(`[SIMULATED] Call to ${phoneNumber}`);
            return { contact: phoneNumber, success: true, simulated: true };
        }

        try {
            const result = await this.provider.makeVoiceCall(phoneNumber, voiceMessage);

            console.log(`Call initiated to ${phoneNumber}:`, result);

            return {
                contact: phoneNumber,
                success: true,
                sid: result.callId,
                status: result.status,
                provider: result.provider,
                simulated: result.simulated || false
            };

        } catch (error) {
            console.error(`Failed to call ${phoneNumber}:`, error.message);
            throw error;
        }
    }
}

module.exports = new AlertService();
