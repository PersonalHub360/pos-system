/**
 * WebSocket Client for Real-time Data Synchronization
 * Handles real-time updates for dashboard, inventory, and order management
 */

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
    this.isConnected = false;
  }

  /**
   * Initialize WebSocket connection
   */
  connect(url = 'ws://localhost:5000') {
    try {
      this.socket = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      this.isConnected = false;
      this.emit('disconnected');
      
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    const { type, payload, timestamp } = data;

    switch (type) {
      case 'dashboard:update':
        this.emitCustomEvent('dashboardUpdate', payload);
        break;
      
      case 'inventory:update':
        this.emitCustomEvent('inventoryUpdate', payload);
        break;
      
      case 'order:completed':
        this.emitCustomEvent('orderCompleted', payload);
        break;
      
      case 'sales:metrics':
        this.emitCustomEvent('salesMetricsUpdate', payload);
        break;
      
      default:
        console.log('Unknown message type:', type, payload);
    }
  }

  /**
   * Emit custom DOM events for components to listen to
   */
  emitCustomEvent(eventName, data) {
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        ...data,
        timestamp: new Date().toISOString()
      }
    }));
  }

  /**
   * Send message to server
   */
  send(type, payload) {
    if (this.isConnected && this.socket) {
      const message = {
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', type, payload);
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  /**
   * Unsubscribe from event types
   */
  unsubscribe(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit events to registered listeners
   */
  emit(eventType, data = null) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socket: this.socket ? this.socket.readyState : null
    };
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient();

// Auto-connect when module is loaded
if (typeof window !== 'undefined') {
  websocketClient.connect();
}

export default websocketClient;