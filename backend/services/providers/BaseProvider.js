/**
 * Women Safety System - Base CPaaS Provider
 * Abstract base class for all CPaaS providers
 */

class BaseProvider {
    /**
     * Initialize the provider
     * @param {Object} config - Provider-specific configuration
     */
    constructor(config) {
        if (new.target === BaseProvider) {
            throw new Error('BaseProvider is an abstract class and cannot be instantiated directly');
        }
        this.config = config;
        this.validateConfig();
    }

    /**
     * Validate provider configuration
     * Must be implemented by subclasses
     */
    validateConfig() {
        throw new Error('validateConfig() must be implemented by subclass');
    }

    /**
     * Send SMS message
     * @param {string} phoneNumber - Recipient phone number (with country code)
     * @param {string} message - Message content
     * @returns {Promise<Object>} - { contact, success, messageId, status, simulated? }
     */
    async sendSMS(phoneNumber, message) {
        throw new Error('sendSMS() must be implemented by subclass');
    }

    /**
     * Make voice call with automated message
     * @param {string} phoneNumber - Recipient phone number (with country code)
     * @param {string} message - Message to be spoken
     * @returns {Promise<Object>} - { contact, success, callId, status, simulated? }
     */
    async makeVoiceCall(phoneNumber, message) {
        throw new Error('makeVoiceCall() must be implemented by subclass');
    }

    /**
     * Get provider name
     * @returns {string}
     */
    getProviderName() {
        return this.constructor.name.replace('Provider', '');
    }

    /**
     * Format phone number for India (add +91 if missing)
     * @param {string} phoneNumber
     * @returns {string}
     */
    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        if (cleaned.startsWith('00')) {
            cleaned = '+' + cleaned.substring(2);
        }

        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('91') && cleaned.length === 12) {
                cleaned = '+' + cleaned;
            } else if (cleaned.length === 10) {
                cleaned = '+91' + cleaned;
            }
        }

        return cleaned;
    }
}

module.exports = BaseProvider;
