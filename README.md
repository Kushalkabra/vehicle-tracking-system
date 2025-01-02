# Vehicle Tracking Application

A real-time vehicle tracking system with route planning and geofencing capabilities. The application uses WebSocket for real-time location updates and Google Maps for visualization.

## Features

- 🚗 Real-time vehicle location tracking
- 🗺️ Interactive route planning
- 🎯 Geofencing with customizable radius
- 🔔 Real-time notifications for geofence entry
- 📍 Live distance and ETA updates
- 📱 Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Maps API key
- WebSocket server (backend)

## Environment Setup

### Frontend (.env)

Required Google Maps API key
```bash
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```     
WebSocket connection URL
```bash
   VITE_WEBSOCKET_URL=ws://localhost:3001 
```   


## Development
```bash
    VITE_WEBSOCKET_URL=wss://your-production-url.com 
```   


### Backend (.env)

Server configuration
```bash
 PORT=3001
 NODE_ENV=development
 CORS_ORIGIN=http://localhost:5173
```   



## Key Components

### 1. Map View
- Displays vehicle locations
- Shows route paths
- Visualizes geofence areas

### 2. Route Planning
- Calculate optimal routes
- Display distance and ETA
- Real-time route updates

### 3. Geofencing
- Create custom geofence areas
- Set radius and name
- Real-time entry notifications

### 4. Live Tracking
- Real-time vehicle position updates
- Distance to destination
- Progress tracking

## Troubleshooting

### WebSocket Connection Issues
1. Check if the WebSocket server is running
2. Verify the WebSocket URL in frontend .env
3. Ensure proper CORS configuration
4. Check for secure WebSocket (wss://) in production

### Google Maps Issues
1. Verify API key is valid
2. Enable required Google Maps services
3. Check for billing status
4. Verify domain restrictions


