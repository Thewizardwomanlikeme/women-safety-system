/**
 * Women Safety System - MSG91 Provider
 * SMS and Voice call integration via MSG91 API
 */

const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class MSG91Provider extends BaseProvider {
    constructor(config) {
        super(config);
        this.baseURL = 'https://control.msg91.com/api/v5';
        this.voiceURL = 'https://control.msg91.com/api/v2';
        console.log('MSG91 provider initialized');
    }

    validateConfig() {
        if (!this.config.authKey) {
            throw new Error('MSG91: authKey is required');
        }
        if (!this.config.senderId) {
            throw new Error('MSG91: senderId is required');
        }
        if (!this.config.templateId) {
            console.warn('MSG91: templateId not set - using basic SMS');
        }
    }

    /**
     * Send SMS via MSG91
     */
    async sendSMS(phoneNumber, message) {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        try {
            // MSG91 SMS API v5 (using short URLs and template)
            const payload = {
                sender: this.config.senderId,
                route: '4', // Transactional route
                country: '91',
                sms: [
                    {
                        message: message.substring(0, 1600), // MSG91 limit
                        to: [formattedNumber.replace('+', '')]
                    }
                ]
            };

            const response = await axios.post(
                `${this.baseURL}/flow/`,
                payload,
                {
                    headers: {
                        'authkey': this.config.authKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`MSG91 SMS sent to ${formattedNumber}:`, response.data);

            return {
                contact: phoneNumber,
                success: true,
                messageId: response.data.request_id || response.data.message_id,
                status: 'sent',
                provider: 'MSG91'
            };

        } catch (error) {
            console.error(`MSG91 SMS failed for ${formattedNumber}:`, error.response?.data || error.message);
            throw new Error(`MSG91 SMS failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Make voice call via MSG91
     */
    async makeVoiceCall(phoneNumber, message) {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        try {
            // MSG91 Voice API
            const payload = {
                mobiles: formattedNumber.replace('+', ''),
                voice_message: message.substring(0, 500), // Limit for voice
                country: '91'
            };

            const response = await axios.post(
                `${this.voiceURL}/voice/call.php`,
                null,
                {
                    params: {
                        authkey: this.config.authKey,
                        ...payload
                    }
                }
            );

            console.log(`MSG91 voice call initiated to ${formattedNumber}:`, response.data);

            return {
                contact: phoneNumber,
                success: true,
                callId: response.data.request_id || response.data.message,
                status: 'initiated',
                provider: 'MSG91'
            };

        } catch (error) {
            console.error(`MSG91 voice call failed for ${formattedNumber}:`, error.response?.data || error.message);
            throw new Error(`MSG91 voice call failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

module.exports = MSG91Provider;
