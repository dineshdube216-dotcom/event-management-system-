import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

let wss = null;
const clients = new Map(); // ws -> { userId, role, clubId, authenticatedAt }

export function initRealtime(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Parse token from query string if provided: /ws?token=...
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let initialUser = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure');
        initialUser = decoded;
      } catch (err) {
        console.warn('⚠️ WS Connection token invalid:', err.message);
      }
    }

    const clientInfo = {
      ws,
      userId: initialUser?.user_id || null,
      role: initialUser?.role || 'guest',
      clubId: initialUser?.club_id || null,
      isAlive: true,
      connectedAt: new Date(),
    };

    clients.set(ws, clientInfo);
    console.log(`🔌 WS Client connected (${clients.size} active). Role: ${clientInfo.role}, User: ${clientInfo.userId || 'anonymous'}`);

    // Send welcome confirmation
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      data: {
        status: 'connected',
        serverTime: new Date().toISOString(),
        authenticated: !!clientInfo.userId,
        userId: clientInfo.userId,
        role: clientInfo.role,
      },
    }));

    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) client.isAlive = true;
    });

    ws.on('message', (messageRaw) => {
      try {
        const message = JSON.parse(messageRaw.toString());

        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          return;
        }

        if (message.type === 'AUTH') {
          try {
            const decoded = jwt.verify(message.token, process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure');
            const client = clients.get(ws);
            if (client) {
              client.userId = decoded.user_id;
              client.role = decoded.role;
              client.clubId = decoded.club_id || null;
              console.log(`🔐 WS Client Authenticated: ${decoded.email} (${decoded.role})`);
              ws.send(JSON.stringify({
                type: 'AUTH_SUCCESS',
                data: { userId: decoded.user_id, role: decoded.role, email: decoded.email },
              }));
            }
          } catch (authErr) {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid authentication token' }));
          }
          return;
        }
      } catch (err) {
        console.error('WS Message parsing error:', err.message);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`❌ WS Client disconnected (${clients.size} active)`);
    });

    ws.on('error', (err) => {
      console.warn('WS Client error:', err.message);
      clients.delete(ws);
    });
  });

  // Heartbeat interval to cleanup dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);
      if (!client || !client.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      client.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('⚡ Real-time WebSocket Server initialized on /ws');
  return wss;
}

/**
 * Broadcast event to all connected clients
 */
export function broadcastToAll(eventType, payload) {
  if (!wss) return;
  const message = JSON.stringify({
    type: eventType,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Broadcast event to a specific user
 */
export function broadcastToUser(userId, eventType, payload) {
  if (!wss || !userId) return;
  const message = JSON.stringify({
    type: eventType,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((clientInfo, ws) => {
    if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Broadcast event to users having a specific role (e.g. 'admin', 'mentor', 'president')
 */
export function broadcastToRole(role, eventType, payload) {
  if (!wss || !role) return;
  const message = JSON.stringify({
    type: eventType,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((clientInfo, ws) => {
    if (clientInfo.role === role && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Broadcast event to mentor and president associated with a club
 */
export function broadcastToClub(clubId, eventType, payload) {
  if (!wss || !clubId) return;
  const message = JSON.stringify({
    type: eventType,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((clientInfo, ws) => {
    if ((clientInfo.clubId === clubId || clientInfo.role === 'admin') && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Broadcast dashboard metrics invalidation / update trigger
 */
export function broadcastMetricsUpdate(scope = 'all', details = {}) {
  broadcastToAll('METRICS_UPDATED', {
    scope,
    details,
    invalidatedAt: new Date().toISOString(),
  });
}
