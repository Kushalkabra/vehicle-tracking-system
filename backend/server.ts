import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Use CORS_ORIGIN from environment
app.use(cors({
  origin: process.env.CORS_ORIGIN
}));
app.use(express.json());

// Store active connections
const connections = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'driver-location') {
        // Broadcast location to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws) {
            client.send(JSON.stringify({
              type: 'location-update',
              vehicleId: data.vehicleId,
              position: data.position,
              timestamp: new Date().toISOString()
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
}); 