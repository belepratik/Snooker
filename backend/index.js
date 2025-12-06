const express = require('express');
const dotenv = require('dotenv');
const {app} = require('./app.js')
dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Listen on all interfaces

// Create server
const server = app.listen(port, host, () => {
    console.log(`✓ Server is listening on http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});