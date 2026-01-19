/**
 * Women Safety System - CPaaS Provider Factory
 * Factory for creating CPaaS provider instances
 */

const MSG91Provider = require('./MSG91Provider');
const ExotelProvider = require('./ExotelProvider');
const GupshupProvider = require('./GupshupProvider');

class ProviderFactory {
    /**
     * Create a CPaaS provider instance based on configuration
     * @param {Object} config - Configuration object with provider name and credentials
     * @returns {BaseProvider} Provider instance
     */
    static createProvider(config) {
        const providerName = (config.provider || 'msg91').toLowerCase();

        switch (providerName) {
            case 'msg91':
                return new MSG91Provider({
                    authKey: config.msg91?.authKey,
                    senderId: config.msg91?.senderId,
                    templateId: config.msg91?.templateId
                });

            case 'exotel':
                return new ExotelProvider({
                    accountSid: config.exotel?.accountSid,
                    apiKey: config.exotel?.apiKey,
                    apiToken: config.exotel?.apiToken,
                    exoPhone: config.exotel?.exoPhone,
                    flowUrl: config.exotel?.flowUrl
                });

            case 'gupshup':
                return new GupshupProvider({
                    userId: config.gupshup?.userId,
                    password: config.gupshup?.password,
                    source: config.gupshup?.source || 'GSDSMS'
                });

            default:
                throw new Error(
                    `Unknown CPaaS provider: ${providerName}. ` +
                    `Supported providers: msg91, exotel, gupshup`
                );
        }
    }

    /**
     * Get list of supported providers
     * @returns {Array<string>}
     */
    static getSupportedProviders() {
        return ['msg91', 'exotel', 'gupshup'];
    }
}

module.exports = ProviderFactory;
