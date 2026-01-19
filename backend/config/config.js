/**
 * Women Safety System - Configuration
 * Environment variables and application config
 */

module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // CORS origins
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['*'],

    // CPaaS Provider Configuration (replaces Twilio)
    cpaas: {
        // Provider selection: 'msg91', 'exotel', or 'gupshup'
        provider: process.env.CPAAS_PROVIDER || 'msg91',

        // MSG91 Configuration
        msg91: {
            authKey: process.env.MSG91_AUTH_KEY,
            senderId: process.env.MSG91_SENDER_ID,
            templateId: process.env.MSG91_TEMPLATE_ID // Optional
        },

        // Exotel Configuration
        exotel: {
            accountSid: process.env.EXOTEL_ACCOUNT_SID,
            apiKey: process.env.EXOTEL_API_KEY,
            apiToken: process.env.EXOTEL_API_TOKEN,
            exoPhone: process.env.EXOTEL_PHONE_NUMBER,
            flowUrl: process.env.EXOTEL_FLOW_URL // Optional, for voice calls
        },

        // Gupshup Configuration
        gupshup: {
            userId: process.env.GUPSHUP_USER_ID,
            password: process.env.GUPSHUP_PASSWORD,
            source: process.env.GUPSHUP_SOURCE || 'GSDSMS' // India-specific
        }
    },

    // Database configuration (MongoDB)
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/women_safety',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // PostgreSQL configuration (alternative)
    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'women_safety',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD
    },

    // Alert configuration
    alerts: {
        maxRetries: 3,
        retryDelayMs: 2000,
        callDurationSeconds: 30
    },

    // API configuration
    api: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    }
};
