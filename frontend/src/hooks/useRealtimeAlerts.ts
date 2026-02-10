/**
 * React Hook for Real-Time Alert Updates
 *
 * This hook provides an easy way for React components to subscribe
 * to real-time alert updates via WebSocket.
 *
 * Usage:
 * ```typescript
 * const { alerts, connected, newAlertCount } = useRealtimeAlerts();
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import websocketService, { WebSocketEvent } from '../services/websocket';
import { Alert } from '../types';

export interface UseRealtimeAlertsResult {
  // List of new alerts received since connection
  newAlerts: Alert[];
  // WebSocket connection status
  connected: boolean;
  // Count of new alerts (for badge display)
  newAlertCount: number;
  // Clear the new alerts list
  clearNewAlerts: () => void;
  // Manually trigger connection
  connect: () => void;
  // Manually trigger disconnection
  disconnect: () => void;
}

/**
 * Hook to receive real-time alert updates
 *
 * @param options Configuration options
 * @returns Real-time alerts state and controls
 */
export function useRealtimeAlerts(options?: {
  autoConnect?: boolean;
  onNewAlert?: (alert: Alert) => void;
}): UseRealtimeAlertsResult {
  const { autoConnect = true, onNewAlert } = options || {};

  const [newAlerts, setNewAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      switch (event.type) {
        case 'alert_created':
          const alert = event.data as Alert;
          setNewAlerts((prev) => [alert, ...prev]);
          if (onNewAlert) {
            onNewAlert(alert);
          }
          break;

        case 'alert_updated':
          // Could handle alert updates here if needed
          // For now, we just track new alerts
          break;

        case 'connection_status':
          setConnected(event.data.connected);
          break;
      }
    },
    [onNewAlert]
  );

  // Connect to WebSocket on mount, disconnect on unmount
  useEffect(() => {
    if (!autoConnect) return;

    // Subscribe to events
    const unsubscribe = websocketService.subscribe('useRealtimeAlerts', handleWebSocketEvent);

    // Connect
    websocketService.connect();

    // Cleanup
    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, [autoConnect, handleWebSocketEvent]);

  // Clear new alerts
  const clearNewAlerts = useCallback(() => {
    setNewAlerts([]);
  }, []);

  // Manual connect
  const connect = useCallback(() => {
    websocketService.connect();
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  return {
    newAlerts,
    connected,
    newAlertCount: newAlerts.length,
    clearNewAlerts,
    connect,
    disconnect,
  };
}
