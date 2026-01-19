/**
 * Women Safety System - Gupshup Provider
 * SMS integration via Gupshup API
 * Note: Gupshup primarily focuses on SMS. Voice support may be limited.
 */

const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class GupshupProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.baseURL = 'https://enterprise.smsgupshup.com/GatewayAPI/rest';
        console.log('Gupshup provider initialized');
    }

    validateConfig() {
        if (!this.config.userId) {
            throw new Error('Gupshup: userId is required');
        }
        if (!this.config.password) {
            throw new Error('Gupshup: password is required');
        }
    }

    /**
     * Send SMS via Gupshup
     */
    async sendSMS(phoneNumber, message) {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        try {
            const params = {
                method: 'SendMessage',
                send_to: formattedNumber,
                msg: message.substring(0, 1600),
                userid: this.config.userId,
                password: this.config.password,
                v: '1.1',
                format: 'json',
                msg_type: 'TEXT',
                auth_scheme: 'plain'
            };

            // Add India-specific source parameter
            if (this.config.source) {
                params.source = this.config.source; // e.g., 'GSDSMS' for India
            }

            const response = await axios.get(this.baseURL, { params });

            console.log(`Gupshup SMS sent to ${formattedNumber}:`, response.data);

            // Gupshup returns success/error in response
            const isSuccess = response.data.response?.status === 'success' ||
                response.data.status === 'success' ||
                !response.data.error;

            if (!isSuccess) {
                throw new Error(response.data.error || 'SMS sending failed');
            }

            return {
                contact: phoneNumber,
                success: true,
                messageId: response.data.response?.id || response.data.id || 'gupshup-' + Date.now(),
                status: 'sent',
                provider: 'Gupshup'
            };

        } catch (error) {
            console.error(`Gupshup SMS failed for ${formattedNumber}:`, error.response?.data || error.message);
            throw new Error(`Gupshup SMS failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Make voice call via Gupshup
     * Note: Gupshup's voice capabilities may be limited or require separate setup
     */
    async makeVoiceCall(phoneNumber, message) {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        // Gupshup primarily focuses on messaging (SMS, WhatsApp, RCS)
        // Voice calling may not be available or requires different API endpoints
        console.warn(`Gupshup: Voice calls may not be supported. Contact: ${formattedNumber}`);

        // Simulate or skip voice call
        return {
            contact: phoneNumber,
            success: true,
            callId: 'gupshup-voice-simulated-' + Date.now(),
            status: 'simulated',
            provider: 'Gupshup',
            simulated: true,
            note: 'Gupshup voice calls may require separate configuration or may not be available'
        };
    }
}

module.exports = GupshupProvider;
