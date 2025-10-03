/**
 * WebSocket Server for Real-time Data Synchronization
 * Handles WebSocket connections and real-time updates
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketServer extends EventEmitter {
  constructor(server) {
    super();
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server and connection handling
   */
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      // Add client to active connections
      this.clients.add(ws);
      
      // Send welcome message
      this.sendToClient(ws, 'connected', {
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendToClient(ws, 'error', {
            message: 'Invalid message format',
            error: error.message
          });
        }
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        console.log('WebSocket connection closed:', code, reason.toString());
        this.clients.delete(ws);
      });

      // Handle connection errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Handle messages from clients
   */
  handleClientMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'ping':
        this.sendToClient(ws, 'pong', { timestamp: new Date().toISOString() });
        break;
      
      case 'subscribe':
        this.handleSubscription(ws, payload);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscription(ws, payload);
        break;
      
      default:
        console.log('Unknown message type from client:', type);
    }
  }

  /**
   * Handle client subscriptions
   */
  handleSubscription(ws, payload) {
    const { events } = payload;
    
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    
    if (Array.isArray(events)) {
      events.forEach(event => ws.subscriptions.add(event));
    } else if (typeof events === 'string') {
      ws.subscriptions.add(events);
    }
    
    this.sendToClient(ws, 'subscription:confirmed', {
      events: Array.from(ws.subscriptions),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client unsubscriptions
   */
  handleUnsubscription(ws, payload) {
    const { events } = payload;
    
    if (ws.subscriptions) {
      if (Array.isArray(events)) {
        events.forEach(event => ws.subscriptions.delete(event));
      } else if (typeof events === 'string') {
        ws.subscriptions.delete(events);
      }
    }
    
    this.sendToClient(ws, 'unsubscription:confirmed', {
      events: ws.subscriptions ? Array.from(ws.subscriptions) : [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(type, payload) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        // Check if client is subscribed to this event type
        if (!ws.subscriptions || ws.subscriptions.has(type) || ws.subscriptions.has('*')) {
          ws.send(JSON.stringify(message));
        }
      }
    });
  }

  /**
   * Broadcast dashboard updates
   */
  broadcastDashboardUpdate(data) {
    this.broadcast('dashboard:update', data);
  }

  /**
   * Broadcast inventory updates
   */
  broadcastInventoryUpdate(data) {
    this.broadcast('inventory:update', data);
  }

  /**
   * Broadcast sales metrics updates
   */
  broadcastSalesMetrics(data) {
    this.broadcast('sales:metrics', data);
  }

  /**
   * Broadcast order completion
   */
  broadcastOrderCompleted(data) {
    this.broadcast('order:completed', data);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      activeConnections: Array.from(this.clients).filter(ws => ws.readyState === WebSocket.OPEN).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Close all connections and shutdown server
   */
  shutdown() {
    console.log('Shutting down WebSocket server...');
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1001, 'Server shutdown');
      }
    });
    
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}

module.exports = WebSocketServer;