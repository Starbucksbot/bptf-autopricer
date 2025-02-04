const ReconnectingWebSocket = require('reconnecting-websocket');
const ws = require('ws');
const fs = require('fs');
const chokidar = require('chokidar');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const methods = require('./methods');
const Methods = new methods();

// WebSocket connection management
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

function getReconnectDelay() {
    return Math.min(
        INITIAL_RECONNECT_DELAY * Math.pow(2, wsReconnectAttempts),
        MAX_RECONNECT_DELAY
    );
}
const Schema = require('@tf2autobot/tf2-schema');

const config = require('./config.json');

const SCHEMA_PATH = './schema.json';
const PRICELIST_PATH = './files/pricelist.json';
const ITEM_LIST_PATH = './files/item_list.json';

const { listen, socketIO } = require('./API/server.js');

// Steam API key is required for the schema manager to work.
const schemaManager = new Schema({
    apiKey: config.steamAPIKey
});

// Steam IDs of bots that we want to ignore listings from.
const excludedSteamIds = config.excludedSteamIDs;

// Steam IDs of bots that we want to prioritise listings from.
const prioritySteamIds = config.trustedSteamIDs;

// Listing descriptions that we want to ignore.
const excludedListingDescriptions = config.excludedListingDescriptions;

// Blocked attributes that we want to ignore. (Paints, parts, etc.)
const blockedAttributes = config.blockedAttributes;

const alwaysQuerySnapshotAPI = config.alwaysQuerySnapshotAPI;

// Create database instance for pg-promise.
const pgp = require('pg-promise')({
    schema: config.database.schema
});

// Create a database instance
const cn = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password
};

const calculatePrices = async (name, sku, sellListings, buyListings) => {
    try {
        const keyPrice = await Methods.getKeyPrice();
        const keyobj = { metal: keyPrice || 70 }; // Default to 70 ref if no price available

        // Sort buyListings into descending order of price.
        var buyFiltered = buyListings.rows.sort((a, b) => {
            let valueA = Methods.toMetal(a.currencies, keyobj.metal);
            let valueB = Methods.toMetal(b.currencies, keyobj.metal);
            return valueB - valueA;
        });

        // Sort sellListings into ascending order of price.
        var sellFiltered = sellListings.rows.sort((a, b) => {
            let valueA = Methods.toMetal(a.currencies, keyobj.metal);
            let valueB = Methods.toMetal(b.currencies, keyobj.metal);
            return valueA - valueB;
        });

        // Calculate average prices
        const final_buyObj = calculateAveragePrice(buyFiltered, keyobj.metal);
        const final_sellObj = calculateAveragePrice(sellFiltered, keyobj.metal);

        try {
            // Validate the calculated prices
            Methods.validatePrice(final_buyObj, final_sellObj);
            return [final_buyObj, final_sellObj];
        } catch (error) {
            throw new Error(`| UPDATING PRICES |: Invalid price calculation for ${name}: ${error.message}`);
        }
    } catch (error) {
        throw new Error(`| UPDATING PRICES |: Failed to calculate price for ${name}: ${error.message}`);
    }
};