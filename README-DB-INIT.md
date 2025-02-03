# Database Initialization Instructions

To initialize the database tables automatically:

1. Ensure your database connection settings are correctly configured in `config.json`
2. Run the following command from the project root:
```bash
node API/database/init-db.js
```

This will create the required tables:
- `listings`: Stores item listings with SKU, name, buy/sell prices
- `snapshots`: Stores historical price data for listings

The script will output success or error messages to help troubleshoot any issues.