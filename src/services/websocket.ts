import toast from 'react-hot-toast';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let pingInterval: NodeJS.Timeout | null = null;

const startPingPong = (ws: WebSocket) => {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000); // Send ping every 30 seconds
};

export const initSocket = () => {
  if (socket?.readyState === WebSocket.OPEN) return socket;
  
  try {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      console.log('WebSocket connection established successfully');
      console.log('Connection URL:', wsUrl);
      reconnectAttempts = 0;
      toast.success('Connected to server');
      startPingPong(socket!);
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'pong':
            console.log('Received pong from server');
            break;
          case 'connection':
            console.log('Server message:', data.payload);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', {
        event,
        readyState: socket?.readyState,
        url: wsUrl,
        error: (event as any).error,
        message: (event as any).message,
        type: event.type
      });

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          initSocket();
        }, RECONNECT_DELAY);
      } else {
        console.log('Max reconnection attempts reached');
        toast.error('Failed to connect after multiple attempts. Please check server status.');
      }
    });

    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        type: event.type,
        readyState: socket?.readyState
      });

      switch (event.code) {
        case 1000:
          console.log('Normal closure');
          break;
        case 1001:
          console.log('Going away');
          break;
        case 1002:
          console.log('Protocol error');
          break;
        case 1003:
          console.log('Unsupported data');
          break;
        case 1005:
          console.log('No status received');
          break;
        case 1006:
          console.log('Abnormal closure');
          break;
        case 1007:
          console.log('Invalid frame payload data');
          break;
        case 1008:
          console.log('Policy violation');
          break;
        case 1009:
          console.log('Message too big');
          break;
        case 1010:
          console.log('Missing extension');
          break;
        case 1011:
          console.log('Internal error');
          break;
        case 1015:
          console.log('TLS handshake');
          break;
        default:
          console.log(`Unknown close code: ${event.code}`);
      }

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          initSocket();
        }, RECONNECT_DELAY);
      }
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize WebSocket:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    toast.error('Failed to initialize WebSocket connection');
    return null;
  }
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (socket) {
    socket.close();
    socket = null;
    reconnectAttempts = 0;
  }
}; 