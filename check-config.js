const fs = require('fs');
const path = require('path');

function checkConfig() {
    const configPath = path.join(__dirname, 'config.json');
    
    try {
        // Check if config file exists
        if (!fs.existsSync(configPath)) {
            console.error('Error: config.json file not found');
            process.exit(1);
        }

        // Read and parse config
        const config = require('./config.json');
        
        // Check required fields
        const required = [
            'bptfAPIKey',
            'bptfToken',
            'steamAPIKey',
            'database.host',
            'database.port',
            'database.name',
            'database.user',
            'database.password'
        ];

        for (const field of required) {
            const value = field.split('.').reduce((obj, key) => obj && obj[key], config);
            if (!value) {
                console.error(`Error: Missing required config field: ${field}`);
                process.exit(1);
            }
        }

        console.log('Configuration validated successfully');
    } catch (error) {
        console.error('Error validating config:', error);
        process.exit(1);
    }
}

module.exports = { checkConfig };