/**
 * Women Safety System - Exotel Provider
 * SMS and Voice call integration via Exotel API
 */

const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class ExotelProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.baseURL = `https://api.in.exotel.com/v1/Accounts/${this.config.accountSid}`;
        this.auth = Buffer.from(`${this.config.apiKey}:${this.config.apiToken}`).toString('base64');
        console.log('Exotel provider initialized');
    }

    validateConfig() {
        if (!this.config.accountSid) {
            throw new Error('Exotel: accountSid is required');
        }
        if (!this.config.apiKey) {
            throw new Error('Exotel: apiKey is required');
        }
        if (!this.config.apiToken) {
            throw new Error('Exotel: apiToken is required');
        }
        if (!this.config.exoPhone) {
            throw new Error('Exotel: exoPhone (ExoPhone number) is required');
        }
    }

    /**
     * Send SMS via Exotel
     */
    async sendSMS(phoneNumber, message) {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        try {
            const formData = new URLSearchParams();
            formData.append('From', this.config.exoPhone);
            formData.append('To', formattedNumber);
            formData.append('Body', message.substring(0, 1600));

            const response = await axios.post(
                `${this.baseURL}/Sms/send.json`,
                formData.toString(),
                {
                    headers: {
                        'Authorization': `Basic ${this.auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log(`Exotel SMS sent to ${formattedNumber}:`, response.data);

            return {
                contact: phoneNumber,
                success: true,
                messageId: response.data.SMSMessage?.Sid,
                status: response.data.SMSMessage?.Status || 'sent',
                provider: 'Exotel'
            };

        } catch (error) {
            console.error(`Exotel SMS failed for ${formattedNumber}:`, error.response?.data || error.message);
            throw new Error(`Exotel SMS failed: ${error.response?.data?.RestException?.Message || error.message}`);
        }
    }

    /**
     * Make voice call via Exotel
     */
    async makeVoiceCall(phoneNumber, message) {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        try {
            // Exotel requires a flow URL or app_id
            // For emergency calls, we can use TwiML-like response or a pre-configured flow
            const formData = new URLSearchParams();
            formData.append('From', this.config.exoPhone);
            formData.append('To', formattedNumber);
            formData.append('CallerId', this.config.exoPhone);

            // If you have a flow URL configured in Exotel dashboard, use it
            // Otherwise, use a simple text-to-speech URL (you'd need to host this)
            if (this.config.flowUrl) {
                formData.append('Url', this.config.flowUrl);
            } else {
                // Use CallType for simple text-to-speech
                formData.append('CallType', 'trans');
                // Note: Exotel requires pre-configured flows for TTS
                // In production, you should set up a flow in Exotel dashboard
                console.warn('Exotel: No flowUrl configured. Call may fail without pre-configured flow.');
            }

            const response = await axios.post(
                `${this.baseURL}/Calls/connect.json`,
                formData.toString(),
                {
                    headers: {
                        'Authorization': `Basic ${this.auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log(`Exotel voice call initiated to ${formattedNumber}:`, response.data);

            return {
                contact: phoneNumber,
                success: true,
                callId: response.data.Call?.Sid,
                status: response.data.Call?.Status || 'initiated',
                provider: 'Exotel'
            };

        } catch (error) {
            console.error(`Exotel voice call failed for ${formattedNumber}:`, error.response?.data || error.message);
            throw new Error(`Exotel voice call failed: ${error.response?.data?.RestException?.Message || error.message}`);
        }
    }
}

module.exports = ExotelProvider;
