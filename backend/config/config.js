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

    // Twilio configuration (SMS & Calls)
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
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
