const { checkConfig } = require('./check-config');
const { initializeDatabase } = require('./API/database/init-db');
const { BackpackWebSocket } = require('./API/database/backpack-websocket');
const express = require('express');
const app = require('./API/server');
const config = require('./config.json');

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
});

async function startApplication() {
    // Validate configuration first
    checkConfig();
    try {
        // Initialize the database first
        await initializeDatabase();
        console.log('Database initialized successfully');

        // Start the Express server
        const port = config.pricerPort || 3456;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        // Initialize and connect WebSocket
        const bptfSocket = new BackpackWebSocket();
        await bptfSocket.connect();
        console.log('Connected to Backpack.tf WebSocket');

    } catch (error) {
        console.error('Error starting application:', error);
        process.exit(1);
    }
}

// Start the application
startApplication();