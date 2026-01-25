# WebSocket Service Documentation

## Overview

The WebSocket service provides real-time bidirectional communication between the Scanserve API and connected clients using Socket.IO.

## Connection

### Endpoint
```
ws://your-domain.com/ws
```

### Authentication

Clients must authenticate by providing a JWT token when connecting:

```javascript
// JavaScript/TypeScript client example
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/ws',
  auth: {
    token: 'your-jwt-token-here'
  }
});

// Alternative: Pass token as query parameter
const socket = io('http://localhost:3000', {
  path: '/ws',
  query: {
    token: 'your-jwt-token-here'
  }
});
```

## Room Management

Upon successful authentication, sockets are automatically joined to:
- **User Room**: `user:<userId>` - For user-specific messages
- **Business Room**: `business:<businessId>` - For business-wide messages (if business context exists)

## Server-Side Usage

### Import the Service

```typescript
import { websocketService } from './service/websocket.service';
```

### Available Methods

#### 1. Send to Entire Business
```typescript
websocketService.sendToBusiness(businessId: string, event: string, data: any): void
```

**Example:**
```typescript
websocketService.sendToBusiness(
  req.currentBusiness._id.toString(),
  'order:new',
  {
    orderId: order._id,
    total: order.total,
    status: 'pending'
  }
);
```

#### 2. Send to Specific User
```typescript
websocketService.sendToUser(userId: string, event: string, data: any): void
```

**Example:**
```typescript
websocketService.sendToUser(
  userId,
  'notification',
  {
    title: 'Order Ready',
    message: 'Your order #1234 is ready for pickup'
  }
);
```

#### 3. Send to User in Business Context
```typescript
websocketService.sendToBusinessUser(businessId: string, userId: string, event: string, data: any): void
```

**Example:**
```typescript
websocketService.sendToBusinessUser(
  businessId,
  userId,
  'task:assigned',
  {
    taskId: task._id,
    taskName: 'Prepare Order #5678'
  }
);
```

#### 4. Broadcast to All Clients
```typescript
websocketService.broadcast(event: string, data: any): void
```

**Example:**
```typescript
websocketService.broadcast('system:maintenance', {
  message: 'System maintenance scheduled for 2AM',
  scheduledAt: new Date()
});
```

#### 5. Generic Send Method
```typescript
websocketService.send({
  business: string,
  user?: string,  // optional
  event: string,
  data: any
}): void
```

**Example:**
```typescript
websocketService.send({
  business: businessId,
  user: userId, // Optional - targets specific user if provided
  event: 'payment:completed',
  data: { transactionId: '123', amount: 50.00 }
});
```

## Client-Side Usage

### Listening to Events

```javascript
// Listen for new orders (business-wide)
socket.on('order:new', (data) => {
  console.log('New order:', data);
  // Update UI with new order
});

// Listen for order updates
socket.on('order:updated', (data) => {
  console.log('Order updated:', data);
  // Refresh order status
});

// Listen for user-specific notifications
socket.on('notification', (data) => {
  console.log('Notification:', data);
  // Show notification to user
});

// Listen for payment completion
socket.on('payment:completed', (data) => {
  console.log('Payment completed:', data);
  // Redirect to success page
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Common Event Names

### Order Events
- `order:new` - New order created
- `order:updated` - Order status changed
- `order:ready` - Order ready for pickup/delivery
- `order:completed` - Order completed

### Payment Events
- `payment:initiated` - Payment process started
- `payment:completed` - Payment successful
- `payment:failed` - Payment failed
- `payment:received` - Business received payment

### Inventory Events
- `inventory:updated` - Stock levels changed
- `inventory:low` - Low stock alert

### Table Events (Restaurant)
- `table:status` - Table status changed
- `table:assigned` - Table assigned to staff

### System Events
- `system:maintenance` - System maintenance notification
- `notification` - Generic notification

### Task Events
- `task:assigned` - Task assigned to user
- `task:completed` - Task marked complete

## Usage in Controllers

```typescript
import { websocketService } from '../service/websocket.service';

export const updateOrderHandler = async (req: Request, res: Response) => {
  try {
    const order = await findAndUpdateOrder(
      { _id: req.params.orderId },
      { status: req.body.status },
      { new: true }
    );

    // Notify business about order update
    websocketService.sendToBusiness(
      req.currentBusiness._id.toString(),
      'order:updated',
      {
        orderId: order._id,
        status: order.status,
        updatedAt: new Date()
      }
    );

    return response.ok(res, { data: order });
  } catch (error) {
    return response.error(res, { message: error.message });
  }
};
```

## Usage in Workers (Bull Queues)

```typescript
import { websocketService } from '../service/websocket.service';

// In email.worker.ts or similar
emailQueue.process(async (job) => {
  const { action, data } = job.data;

  if (action === 'order-confirmation') {
    // Send email...
    await sendOrderConfirmationEmail(data);

    // Notify via WebSocket
    websocketService.sendToUser(
      data.userId,
      'email:sent',
      {
        type: 'order-confirmation',
        orderId: data.orderId
      }
    );
  }
});
```

## Usage in Services

```typescript
import { websocketService } from './websocket.service';

export async function processPayment(paymentData: any) {
  try {
    // Process payment logic...
    const result = await paystackService.verifyTransaction(paymentData.reference);

    if (result.status === 'success') {
      // Notify user
      websocketService.sendToUser(
        paymentData.userId,
        'payment:completed',
        {
          transactionId: result.transactionId,
          amount: result.amount
        }
      );

      // Notify business
      websocketService.sendToBusiness(
        paymentData.businessId,
        'payment:received',
        {
          transactionId: result.transactionId,
          userId: paymentData.userId,
          amount: result.amount
        }
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
}
```

## Error Handling

The WebSocket service includes built-in error handling:
- Invalid/expired tokens result in automatic disconnection
- Missing business context is handled gracefully
- Errors are logged using the application logger

## Best Practices

1. **Always check if service is initialized** before sending messages in workers
2. **Use meaningful event names** following the pattern `resource:action`
3. **Include relevant context** in data payloads (IDs, timestamps, etc.)
4. **Handle disconnections** gracefully on the client side
5. **Avoid sending large payloads** - use IDs and let clients fetch details if needed
6. **Use business rooms** for business-wide updates
7. **Use user rooms** for personal notifications
8. **Implement reconnection logic** on the client side

## Testing WebSocket Connections

You can test WebSocket connections using tools like:
- **Socket.IO Client Tool**: Browser-based testing
- **Postman**: Supports WebSocket testing
- **wscat**: Command-line WebSocket client

Example using Node.js:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  path: '/ws',
  auth: { token: 'your-test-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('order:new', (data) => {
  console.log('Received order:', data);
});
```

## Security Considerations

- JWT tokens are validated on connection
- Expired tokens are rejected
- Users can only join rooms they have access to
- Business context is validated against user permissions
- CORS is configured (update in `websocket.service.ts` for production)
