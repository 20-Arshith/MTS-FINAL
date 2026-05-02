const { validateRequiredEnv } = require('./config/env');
const config = require('./config/config');

validateRequiredEnv();

const app = require('./app');

const server = app.listen(config.port, config.host, () => {
    console.log(`Server is running on http://${config.host}:${config.port}`);
});

const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
        process.exit(0);
    });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error(`Uncaught exception: ${err.message}`);
    process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
