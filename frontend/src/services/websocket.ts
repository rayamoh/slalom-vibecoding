/**
 * WebSocket Service for Real-Time Alert Updates
 *
 * This service manages WebSocket connections to receive real-time alert updates
 * from the backend. Supports both mock mode (for testing) and live connection.
 *
 * Features:
 * - Auto-reconnection on disconnect
 * - Event subscription system
 * - Mock mode for development without backend
 */

import { Alert } from '../types';

// Configuration
const USE_MOCK_UPDATES = true; // Set to false when backend WebSocket is ready
const WEBSOCKET_URL = 'ws://localhost:8000/ws/alerts';
const RECONNECT_INTERVAL = 5000; // 5 seconds

// Event types
export type WebSocketEventType = 'alert_created' | 'alert_updated' | 'connection_status';

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

export interface AlertCreatedEvent {
  type: 'alert_created';
  data: Alert;
}

export interface AlertUpdatedEvent {
  type: 'alert_updated';
  data: Alert;
}

export interface ConnectionStatusEvent {
  type: 'connection_status';
  data: {
    connected: boolean;
    timestamp: string;
  };
}

export type WebSocketEvent = AlertCreatedEvent | AlertUpdatedEvent | ConnectionStatusEvent;

type EventCallback = (event: WebSocketEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, EventCallback> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private mockIntervalId: NodeJS.Timeout | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (USE_MOCK_UPDATES) {
      this.startMockUpdates();
      this.notifyConnectionStatus(true);
      return;
    }

    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket: Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      console.log('WebSocket: Connecting to', WEBSOCKET_URL);
      this.ws = new WebSocket(WEBSOCKET_URL);

      this.ws.onopen = () => {
        console.log('WebSocket: Connected');
        this.isConnecting = false;
        this.notifyConnectionStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          this.notifySubscribers(message);
        } catch (error) {
          console.error('WebSocket: Failed to parse message', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket: Error', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket: Connection closed, attempting to reconnect...');
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('WebSocket: Failed to connect', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (USE_MOCK_UPDATES) {
      this.stopMockUpdates();
      this.notifyConnectionStatus(false);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.notifyConnectionStatus(false);
  }

  /**
   * Subscribe to WebSocket events
   */
  subscribe(id: string, callback: EventCallback): () => void {
    this.subscribers.set(id, callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    if (USE_MOCK_UPDATES) {
      return this.mockIntervalId !== null;
    }
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private notifySubscribers(event: WebSocketEvent): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('WebSocket: Subscriber callback error', error);
      }
    });
  }

  private notifyConnectionStatus(connected: boolean): void {
    const event: ConnectionStatusEvent = {
      type: 'connection_status',
      data: {
        connected,
        timestamp: new Date().toISOString(),
      },
    };
    this.notifySubscribers(event);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      console.log('WebSocket: Attempting to reconnect...');
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  // ============================================================================
  // Mock Mode for Development
  // ============================================================================

  private startMockUpdates(): void {
    console.log('WebSocket: Starting mock updates (development mode)');

    // Simulate new alerts every 30 seconds (for demo purposes)
    // In real scenario, this would be irregular based on actual transactions
    this.mockIntervalId = setInterval(() => {
      const shouldSendUpdate = Math.random() > 0.5; // 50% chance every 30s
      if (shouldSendUpdate) {
        this.sendMockAlert();
      }
    }, 30000);
  }

  private stopMockUpdates(): void {
    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
    }
  }

  private sendMockAlert(): void {
    // Generate a mock alert
    const transactionTypes = ['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER'] as const;
    const priorities = ['low', 'medium', 'high', 'critical'] as const;
    const statuses = ['new'] as const;
    const riskBands = ['low', 'medium', 'high', 'critical'] as const;

    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const mlScore = priority === 'critical' ? 0.9 + Math.random() * 0.1 :
      priority === 'high' ? 0.75 + Math.random() * 0.15 :
        priority === 'medium' ? 0.6 + Math.random() * 0.15 :
          Math.random() * 0.6;

    const mockAlert: Alert = {
      id: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transaction_id: `TXN-${Date.now()}`,
      status: statuses[0],
      priority,
      transaction: {
        type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        amount: Math.floor(Math.random() * 500000) + 1000,
        step: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        nameOrig: `C${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        nameDest: `C${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      },
      ml_score: mlScore,
      ml_risk_band: riskBands[priorities.indexOf(priority)],
      ml_reason_codes: ['HIGH_VALUE_TRANSFER', 'NEW_COUNTERPARTY'],
      shap_values: [
        { feature: 'amount_zscore', value: 0.35 },
        { feature: 'new_counterparty_7d', value: 0.28 },
        { feature: 'velocity_1h', value: 0.15 },
      ],
      rules_triggered: priority === 'critical' || priority === 'high' ? [
        {
          rule_id: 'HIGH_VALUE_TRANSFER',
          rule_name: 'High Value Transfer Rule',
          reason: 'Transfer amount exceeds $200,000',
        },
      ] : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const event: AlertCreatedEvent = {
      type: 'alert_created',
      data: mockAlert,
    };

    console.log('WebSocket: Mock alert created', mockAlert.id, `(${mockAlert.priority})`);
    this.notifySubscribers(event);
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
