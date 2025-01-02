const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host; 