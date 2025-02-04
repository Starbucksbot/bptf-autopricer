# Setup Guide

## Prerequisites
- Node.js 14+ installed
- PostgreSQL 12+ installed and running
- PM2 installed globally (`npm install -g pm2`)

1. Make sure PostgreSQL is installed and running
2. Copy `config.json.example` to `config.json`
3. Update `config.json` with your:
   - PostgreSQL database credentials (host, port, user, password)
   - Backpack.tf API key and token
   - Steam API key
3. Install dependencies:
```bash
npm install
```
4. Start the application:
```bash
pm2 start autopricer.js
```

The application will:
- Initialize the database automatically
- Start the Express server
- Connect to Backpack.tf WebSocket

To view logs:
```bash
pm2 logs autopricer
```

To stop the application:
```bash
pm2 stop autopricer
```