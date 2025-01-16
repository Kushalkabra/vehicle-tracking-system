import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://vehicle-tracking-final.netlify.app',
  'https://websocketking.com',
  'wss://websocketking.com'
];

// In development or if explicitly allowed, accept all origins
const isDevelopment = process.env.NODE_ENV !== 'production';

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Configure Express CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',  // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  connectTimeout: 60000
});

// Add connection error handling
io.engine.on("connection_error", (err) => {
  console.log('Connection error:', err.req);      // the request object
  console.log('Error message:', err.code);     // the error code
  console.log('Error context:', err.context);  // some additional error context
});

// Store active vehicles
const activeVehicles = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected, ID:', socket.id);

  // Send existing vehicles to new client
  const vehicles = Array.from(activeVehicles.values());
  socket.emit('initialVehicles', vehicles);
  console.log('Sent initial vehicles:', vehicles);

  socket.on('driverLocationUpdate', (data) => {
    const { driverName, position, timestamp } = data;
    console.log('Received driver update:', { driverName, position, timestamp });

    if (!driverName) {
      console.error('No driver name provided');
      return;
    }

    const vehicle = {
      id: driverName.toLowerCase().replace(/\s+/g, '-'),
      name: driverName,
      position,
      status: 'active',
      lastUpdate: timestamp || new Date().toISOString(),
      isDriver: true,
      driverName
    };

    // Update active vehicles
    activeVehicles.set(driverName, vehicle);
    console.log('Updated active vehicles:', Array.from(activeVehicles.values()));

    // Broadcast to all clients
    io.emit('driverLocationUpdate', vehicle);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected, ID:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 