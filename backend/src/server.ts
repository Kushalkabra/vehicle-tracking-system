import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer, RawData } from 'ws';
import cors from 'cors';

interface MessageData {
  type: string;
  payload: any;
}

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS with more specific options
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Implement ping-pong to keep connections alive
function heartbeat(this: WebSocket) {
  (this as any).isAlive = true;
}

const interval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    if ((ws as any).isAlive === false) return ws.terminate();
    (ws as any).isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  const clientCount = wss.clients.size;
  console.log(`New client connected. Total clients: ${clientCount}`);
  
  ws.on('close', () => {
    const remainingClients = wss.clients.size;
    console.log(`Client disconnected. Remaining clients: ${remainingClients}`);
  });

  (ws as any).isAlive = true;

  ws.on('pong', heartbeat);

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connection', payload: 'Connected to server' }));

  ws.on('message', (data: RawData) => {
    try {
      const message = JSON.parse(data.toString()) as MessageData;
      console.log('Server received message:', message);

      if (message.type === 'driverLocationUpdate') {
        const vehicleData = message.payload;
        console.log('Processing vehicle update:', vehicleData);
        
        // Echo back to sender
        console.log('Sending update back to sender');
        ws.send(JSON.stringify({
          type: 'driverLocationUpdate',
          payload: vehicleData
        }));

        // Broadcast to others
        const connectedClients = Array.from(wss.clients).filter(
          client => client !== ws && client.readyState === WebSocket.OPEN
        );
        console.log(`Broadcasting to ${connectedClients.length} other clients`);
        
        connectedClients.forEach(client => {
          client.send(JSON.stringify({
            type: 'driverLocationUpdate',
            payload: vehicleData
          }));
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
server.listen(Number(port), () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  wss.close(() => {
    console.log('WebSocket server closed.');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
}); 