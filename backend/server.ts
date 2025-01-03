import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

interface Vehicle {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive';
  lastUpdate: Date;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

interface StopPoint {
  id: string;
  position: RoutePoint;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

interface RouteHistory {
  points: RoutePoint[];
  stops: StopPoint[];
}

const app = express();
const httpServer = createServer(app);

// Update CORS configuration for production
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Store vehicle data
const vehicles = new Map<string, Vehicle>();
const routeHistories = new Map<string, RouteHistory>();

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log('Client connected');

  // Handle vehicle position updates
  socket.on('updatePosition', (data: { 
    vehicleId: string, 
    position: { lat: number, lng: number },
    isMoving: boolean
  }) => {
    const vehicle = vehicles.get(data.vehicleId);
    if (vehicle) {
      // Update vehicle position
      vehicle.position = data.position;
      vehicle.lastUpdate = new Date();
      
      // Update route history
      let routeHistory = routeHistories.get(data.vehicleId);
      if (!routeHistory) {
        routeHistory = { points: [], stops: [] };
        routeHistories.set(data.vehicleId, routeHistory);
      }
      
      routeHistory.points.push(data.position);

      // Handle stop detection
      const lastStop = routeHistory.stops[routeHistory.stops.length - 1];
      if (!data.isMoving && (!lastStop || lastStop.endTime)) {
        // Vehicle has stopped and there's no ongoing stop
        routeHistory.stops.push({
          id: `stop-${Date.now()}`,
          position: data.position,
          startTime: new Date()
        });
      } else if (data.isMoving && lastStop && !lastStop.endTime) {
        // Vehicle has started moving and there's an ongoing stop
        lastStop.endTime = new Date();
        lastStop.duration = lastStop.endTime.getTime() - lastStop.startTime.getTime();
      }

      // Broadcast update to all clients
      io.emit('vehicleUpdate', {
        vehicle,
        routeHistory
      });
    }
  });

  // Handle new vehicle registration
  socket.on('registerVehicle', (data: { 
    vehicleId: string, 
    name: string,
    position: { lat: number, lng: number }
  }) => {
    const newVehicle: Vehicle = {
      id: data.vehicleId,
      name: data.name,
      position: data.position,
      status: 'active',
      lastUpdate: new Date()
    };
    
    vehicles.set(data.vehicleId, newVehicle);
    routeHistories.set(data.vehicleId, { points: [], stops: [] });
    
    io.emit('vehicleRegistered', newVehicle);
  });

  // Handle vehicle removal
  socket.on('removeVehicle', (vehicleId: string) => {
    vehicles.delete(vehicleId);
    routeHistories.delete(vehicleId);
    io.emit('vehicleRemoved', vehicleId);
  });

  // Handle route history clear
  socket.on('clearRouteHistory', (vehicleId: string) => {
    routeHistories.set(vehicleId, { points: [], stops: [] });
    io.emit('routeHistoryCleared', vehicleId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// REST endpoints
app.get('/api/vehicles', (req, res) => {
  res.json(Array.from(vehicles.values()));
});

app.get('/api/vehicle/:id/history', (req, res) => {
  const history = routeHistories.get(req.params.id);
  if (history) {
    res.json(history);
  } else {
    res.status(404).json({ error: 'Vehicle history not found' });
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 