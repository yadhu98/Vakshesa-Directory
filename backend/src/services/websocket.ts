import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'transaction' | 'balance' | 'leaderboard' | 'stall-stats' | 'ping' | 'pong';
  data?: any;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    console.log('🔌 WebSocket server initialized on /ws');

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      console.log('📱 New WebSocket connection attempt');

      // Extract token from query string
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.log('❌ No token provided, closing connection');
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        // Verify JWT token - use same secret as auth utility
        const jwtSecret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, jwtSecret) as any;
        ws.userId = decoded.id;
        ws.role = decoded.role;
        ws.isAlive = true;

        console.log(`✅ User ${ws.userId} (${ws.role}) connected via WebSocket`);

        // Add to clients map (with type guard)
        if (ws.userId) {
          if (!this.clients.has(ws.userId)) {
            this.clients.set(ws.userId, new Set());
          }
          this.clients.get(ws.userId)?.add(ws);
        }

        // Send welcome message
        this.sendToClient(ws, {
          type: 'ping',
          data: { message: 'Connected to WebSocket server', userId: ws.userId }
        });

        // Handle incoming messages
        ws.on('message', (message: string) => {
          try {
            const parsed: WebSocketMessage = JSON.parse(message.toString());
            this.handleMessage(ws, parsed);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        });

        // Handle pong responses for heartbeat
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle disconnection
        ws.on('close', () => {
          console.log(`👋 User ${ws.userId} disconnected`);
          if (ws.userId) {
            const userClients = this.clients.get(ws.userId);
            if (userClients) {
              userClients.delete(ws);
              if (userClients.size === 0) {
                this.clients.delete(ws.userId);
              }
            }
          }
        });

        ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
        });

      } catch (error) {
        console.log('❌ Invalid token, closing connection:', error);
        ws.close(1008, 'Invalid authentication token');
      }
    });

    // Start heartbeat to detect dead connections
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as AuthenticatedWebSocket;
        
        if (client.isAlive === false) {
          console.log(`💀 Terminating dead connection for user ${client.userId}`);
          return client.terminate();
        }

        client.isAlive = false;
        client.ping();
      });
    }, 30000); // Check every 30 seconds
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'pong':
        ws.isAlive = true;
        break;
      default:
        console.log(`📩 Received message type: ${message.type} from user ${ws.userId}`);
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast to specific user (all their connections)
  broadcastToUser(userId: string, message: WebSocketMessage) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        this.sendToClient(client, message);
      });
      console.log(`📤 Sent ${message.type} to user ${userId} (${userClients.size} connections)`);
    }
  }

  // Broadcast to all users with specific role
  broadcastToRole(role: string, message: WebSocketMessage) {
    let count = 0;
    this.clients.forEach((clients, userId) => {
      clients.forEach(client => {
        if (client.role === role) {
          this.sendToClient(client, message);
          count++;
        }
      });
    });
    console.log(`📤 Sent ${message.type} to ${count} ${role} connections`);
  }

  // Broadcast to all connected clients
  broadcastToAll(message: WebSocketMessage) {
    let count = 0;
    this.clients.forEach((clients) => {
      clients.forEach(client => {
        this.sendToClient(client, message);
        count++;
      });
    });
    console.log(`📤 Broadcast ${message.type} to ${count} connections`);
  }

  // Send transaction notification
  notifyTransaction(userId: string, transaction: any) {
    this.broadcastToUser(userId, {
      type: 'transaction',
      data: transaction
    });
  }

  // Send balance update
  notifyBalanceUpdate(userId: string, balance: number) {
    this.broadcastToUser(userId, {
      type: 'balance',
      data: { balance }
    });
  }

  // Send leaderboard update to all users
  notifyLeaderboardUpdate(leaderboard: any[]) {
    this.broadcastToAll({
      type: 'leaderboard',
      data: leaderboard
    });
  }

  // Send stall stats update to admins and shopkeepers
  notifyStallStatsUpdate(stallId: string, stats: any) {
    this.broadcastToRole('admin', {
      type: 'stall-stats',
      data: { stallId, stats }
    });
    this.broadcastToRole('shopkeeper', {
      type: 'stall-stats',
      data: { stallId, stats }
    });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.clients.size;
  }

  // Get total connections count
  getTotalConnectionsCount(): number {
    let total = 0;
    this.clients.forEach(clients => {
      total += clients.size;
    });
    return total;
  }

  // Cleanup
  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close();
      console.log('🔌 WebSocket server closed');
    }
  }
}

export const wsService = new WebSocketService();
