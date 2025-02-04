const express = require('express');
const { SnapshotQueue } = require('./database/snapshot-queue');
const { SnapshotFetcher } = require('./database/snapshot-fetcher');
const http = require('http');
const socketIO = require('socket.io');

const app = express();

// Initialize and start the snapshot system
const snapshotQueue = new SnapshotQueue();
const snapshotFetcher = new SnapshotFetcher(snapshotQueue);

snapshotQueue.start();
snapshotFetcher.start();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.urlencoded({
  extended: true
}));

const config = require('../config.json');

// API routes.
const items_endpoint = require('./routes/api/items.js');

app.use('/items', items_endpoint);

const port = config.pricerPort || 3456;

const listen = () => {
  server.listen(port, () => {
    console.log(`API and Socket.IO server started on port ${port}`);
  });

  io.on('connection', (socket) => {
    console.log(`A new client connected. Socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected. Socket ID: ${socket.id}`);
    });
  });
};

module.exports = {
    listen: listen,
    socketIO: io,
};