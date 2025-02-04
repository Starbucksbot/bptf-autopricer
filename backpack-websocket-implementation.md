# Backpack.tf Websocket Integration Documentation

## Overview
The system implements a real-time pricing update system using backpack.tf's websocket API with the following components:

1. **WebSocket Connection (BackpackWebSocket)**
   - Connects to `wss://next.backpack.tf/socket/websocket`
   - Handles authentication and reconnection
   - Subscribes to pricing updates channel

2. **Snapshot Fetcher (SnapshotFetcher)**
   - Implements single-item requests with 2-second delays
   - Rate limited to 30 requests/minute (configurable up to 50)
   - Queues items for processing

3. **Snapshot Queue (SnapshotQueue)**
   - Processes bulk events every 0.5 minutes
   - Handles database insertions
   - Deduplicates items by SKU

4. **Price Calculation Service (PriceCalculationService)**
   - Coordinates all components
   - Runs price calculations every 0.7 minutes
   - Manages websocket connection lifecycle

## Rate Limiting
- 2 seconds between individual item requests
- Maximum 30 requests per minute (configurable up to 50)
- If user configures more than 50, defaults to 30 for safety

## Intervals
- Websocket events processed in bulk every 0.5 minutes
- Price calculations run every 0.7 minutes
- Failed items are requeued with backoff