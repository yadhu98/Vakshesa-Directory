import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface WebSocketMessage {
  type: 'transaction' | 'balance' | 'leaderboard' | 'stall-stats' | 'ping' | 'pong';
  data?: any;
}

interface WebSocketHookOptions {
  onTransaction?: (data: any) => void;
  onBalance?: (balance: number) => void;
  onLeaderboard?: (leaderboard: any[]) => void;
  onStallStats?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

const USE_DEV_TUNNEL = true;
const DEV_TUNNEL_BACKEND_URL = 'https://x1qqtsvs-5000.inc1.devtunnels.ms';

const getWebSocketURL = () => {
  if (USE_DEV_TUNNEL) {
    return DEV_TUNNEL_BACKEND_URL.replace('https://', 'wss://') + '/ws';
  }
  
  if (Platform.OS === 'web') {
    return 'ws://localhost:5000/ws';
  }
  
  return 'ws://192.168.1.2:5000/ws';
};

export const useWebSocket = (options: WebSocketHookOptions = {}) => {
  const {
    onTransaction,
    onBalance,
    onLeaderboard,
    onStallStats,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 3; // Stop after 3 failed attempts
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('⚠️ No auth token found, WebSocket disabled (app will work without live updates)');
        return;
      }

      const wsUrl = `${getWebSocketURL()}?token=${token}`;
      console.log('🔌 Connecting to WebSocket...');

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected - Live updates enabled');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0; // Reset on successful connection
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📩 WebSocket message:', message.type);

          switch (message.type) {
            case 'transaction':
              onTransaction?.(message.data);
              break;
            case 'balance':
              onBalance?.(message.data.balance);
              break;
            case 'leaderboard':
              onLeaderboard?.(message.data);
              break;
            case 'stall-stats':
              onStallStats?.(message.data);
              break;
            case 'ping':
              // Respond to ping with pong
              if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'pong' }));
              }
              break;
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.warn('⚠️ WebSocket error (app will continue without live updates)');
        setConnectionError('Connection error');
      };

      ws.current.onclose = (event) => {
        console.log('👋 WebSocket disconnected');
        setIsConnected(false);
        onDisconnect?.();

        // Auto reconnect with max attempts limit
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`🔄 Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${reconnectInterval}ms...`);
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('⚠️ Max reconnection attempts reached. App will work without live updates. Please log out and log back in for WebSocket support.');
          setConnectionError('Authentication failed - please re-login');
        }
      };
    } catch (error) {
      console.warn('⚠️ Failed to connect WebSocket (app will work without live updates)');
      setConnectionError('Failed to connect');
    }
  }, [onTransaction, onBalance, onLeaderboard, onStallStats, onConnect, onDisconnect, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    send,
  };
};
