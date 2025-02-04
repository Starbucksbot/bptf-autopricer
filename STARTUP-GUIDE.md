# Getting Started with bptf-autopricer

After configuring the application, you'll need to follow these steps to get it running:

1. **Configure the application**
   - Edit `config.json` and fill in all required fields:
     - `bptfAPIKey`: Your backpack.tf API key
     - `bptfToken`: Your backpack.tf token
     - `steamAPIKey`: Your Steam API key
     - Database configuration details (host, port, credentials, etc.)
     - Other optional settings like price difference thresholds

2. **Set up the database**
   - Install PostgreSQL if not already installed
   - Create a new database named "bptf-autopricer" (or your configured name)
   - Run the database initialization script:
     ```bash
     node API/database/init-db.js
     ```

3. **Install dependencies**
   - Run `npm install` in the project directory to install required packages

4. **Start the application**
   - Run the following command to start the auto pricer:
     ```bash
     node server.js
     ```

The application will then:
- Initialize the database connection
- Start the Express server on your configured port (default: 3456)
- Begin listening for pricing requests through API routes or WebSocket connections

You can then add items to price either:
- Through the API routes
- Via WebSocket connections
- By integrating with compatible trading bots

The application will continuously run and automatically handle pricing calculations based on your configuration settings.