# React WebSocket Integration Guide

## Installation

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

## Quick Start

### 1. Create a WebSocket Hook

Create `src/hooks/useWebSocket.js` (or `.ts` for TypeScript):

```javascript
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const useWebSocket = (token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      path: '/ws',
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  // Helper function to subscribe to events
  const on = (event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
  };

  // Helper function to unsubscribe from events
  const off = (event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, callback);
  };

  // Helper function to emit events (if needed)
  const emit = (event, data) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  };

  return {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit
  };
};
```

### 2. TypeScript Version (Optional)

Create `src/hooks/useWebSocket.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data?: any) => void;
}

export const useWebSocket = (token: string | null): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      path: '/ws',
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current.on('connect_error', (error: Error) => {
      console.error('Connection error:', error.message);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  const on = (event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  };

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  };

  return {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit
  };
};
```

## Usage Examples

### Example 1: Simple Component

```javascript
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

function OrdersPage() {
  const token = localStorage.getItem('accessToken');
  const { isConnected, on, off } = useWebSocket(token);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Handler for new orders
    const handleNewOrder = (data) => {
      console.log('New order received:', data);
      setOrders(prev => [data, ...prev]);
      // Show notification
      alert(`New order #${data.orderId}`);
    };

    // Handler for order updates
    const handleOrderUpdate = (data) => {
      console.log('Order updated:', data);
      setOrders(prev => 
        prev.map(order => 
          order.orderId === data.orderId ? { ...order, ...data } : order
        )
      );
    };

    // Subscribe to events
    on('order:new', handleNewOrder);
    on('order:updated', handleOrderUpdate);

    // Cleanup
    return () => {
      off('order:new', handleNewOrder);
      off('order:updated', handleOrderUpdate);
    };
  }, [on, off]);

  return (
    <div>
      <h1>Orders {isConnected ? '🟢' : '🔴'}</h1>
      <div>
        {orders.map(order => (
          <div key={order.orderId}>
            Order #{order.orderId} - Status: {order.status}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdersPage;
```

### Example 2: Notifications Component

```javascript
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

function NotificationCenter() {
  const token = localStorage.getItem('accessToken');
  const { isConnected, on, off } = useWebSocket(token);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          ...data,
          timestamp: new Date()
        },
        ...prev
      ]);
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [on, off]);

  return (
    <div className="notification-center">
      <h3>Notifications {isConnected && '🟢'}</h3>
      {notifications.map(notif => (
        <div key={notif.id} className="notification">
          <strong>{notif.title}</strong>
          <p>{notif.message}</p>
          <small>{notif.timestamp.toLocaleTimeString()}</small>
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;
```

### Example 3: Context Provider (Advanced)

For app-wide WebSocket access, create a context:

```javascript
// src/context/WebSocketContext.js
import React, { createContext, useContext } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, token }) => {
  const websocket = useWebSocket(token);

  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};
```

**Usage in App.js:**

```javascript
import { WebSocketProvider } from './context/WebSocketContext';

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <WebSocketProvider token={token}>
      <YourApp />
    </WebSocketProvider>
  );
}
```

**Usage in any component:**

```javascript
import { useWebSocketContext } from '../context/WebSocketContext';

function AnyComponent() {
  const { isConnected, on, off } = useWebSocketContext();

  useEffect(() => {
    const handleEvent = (data) => {
      console.log('Event received:', data);
    };

    on('order:new', handleEvent);
    return () => off('order:new', handleEvent);
  }, [on, off]);

  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

## Available Events (from server)

Listen to these events based on your needs:

### Order Events
```javascript
on('order:new', (data) => {/* New order created */});
on('order:updated', (data) => {/* Order status changed */});
on('order:ready', (data) => {/* Order ready */});
on('order:completed', (data) => {/* Order completed */});
```

### Payment Events
```javascript
on('payment:initiated', (data) => {/* Payment started */});
on('payment:completed', (data) => {/* Payment successful */});
on('payment:failed', (data) => {/* Payment failed */});
```

### Inventory Events
```javascript
on('inventory:updated', (data) => {/* Stock changed */});
on('inventory:low', (data) => {/* Low stock alert */});
```

### Generic Events
```javascript
on('notification', (data) => {/* Generic notification */});
on('task:assigned', (data) => {/* Task assigned */});
```

## Environment Setup

Add to your `.env` file:

```bash
REACT_APP_API_URL=http://localhost:3000
# or for production
REACT_APP_API_URL=https://api.scanserve.cloud
```

## Troubleshooting

### Connection Issues

1. **Token not found**: Make sure you're getting the token after login
   ```javascript
   const token = localStorage.getItem('accessToken');
   console.log('Token:', token); // Debug
   ```

2. **CORS errors**: Server already has `origin: '*'` configured, but for production, update the CORS settings in [websocket.service.ts](../src/service/websocket.service.ts)

3. **Connection keeps disconnecting**: Check that your JWT token hasn't expired

### Debugging

Add debug logging to your hook:

```javascript
useEffect(() => {
  if (!token) {
    console.warn('No token provided to WebSocket');
    return;
  }

  console.log('Initializing WebSocket with token:', token.substring(0, 20) + '...');
  // ... rest of code
}, [token]);
```

## Best Practices

1. **Always clean up listeners** to prevent memory leaks:
   ```javascript
   useEffect(() => {
     const handler = (data) => { /* ... */ };
     on('event', handler);
     return () => off('event', handler); // Cleanup
   }, [on, off]);
   ```

2. **Check connection status** before showing real-time features:
   ```javascript
   {isConnected ? <LiveOrders /> : <Spinner />}
   ```

3. **Handle reconnection** gracefully - the hook already handles this with `reconnection: true`

4. **Store token securely** - consider using httpOnly cookies instead of localStorage for production

5. **Throttle UI updates** if receiving many events:
   ```javascript
   import { debounce } from 'lodash';
   
   const debouncedUpdate = debounce((data) => {
     setOrders(prev => [...prev, data]);
   }, 300);
   ```

## Testing Connection

Quick test in browser console:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/ws',
  auth: { token: 'YOUR_TOKEN_HERE' }
});

socket.on('connect', () => console.log('Connected!'));
socket.on('order:new', (data) => console.log('Order:', data));
```
