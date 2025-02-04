const { pool } = require('./pool');

const { snapshotQueue } = require('./snapshot-queue');

async function insertSnapshotData(listing) {
    snapshotQueue.add(listing);
}

module.exports = {
    insertSnapshotData
};