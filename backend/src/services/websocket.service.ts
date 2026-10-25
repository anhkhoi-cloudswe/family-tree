import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  treeId?: string;
}

const clients = new Set<ClientConnection>();
let wss: WebSocketServer | null = null;

export const initWebSocketServer = (server: HttpServer) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const client: ClientConnection = { ws };
    clients.add(client);

    // Gửi tín hiệu chào mừng kết nối thành công
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket real-time connected' }));
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'SUBSCRIBE_TREE') {
          client.treeId = data.treeId;
        } else if (data.type === 'SUBSCRIBE_USER') {
          client.userId = data.userId;
        }
      } catch (e) {
        // Bỏ qua tin nhắn không đúng định dạng
      }
    });

    ws.on('close', () => {
      clients.delete(client);
    });

    ws.on('error', () => {
      clients.delete(client);
    });
  });

  console.log('[WebSocket] Real-time WebSocket server initialized on path /ws');
  return wss;
};

/**
 * Phát tín hiệu cập nhật cây gia phả tới tất cả client đang mở cây này
 */
export const broadcastTreeUpdate = (treeId: string, payload?: any) => {
  const message = JSON.stringify({
    type: 'TREE_UPDATED',
    treeId,
    payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!client.treeId || client.treeId === treeId) {
        try {
          client.ws.send(message);
        } catch (err) {
          console.warn('[WebSocket] Lỗi gửi tín hiệu tới client:', err);
        }
      }
    }
  }
};

/**
 * Phát tín hiệu cập nhật cho một người dùng cụ thể (ví dụ: nhận lời mời mới)
 */
export const broadcastUserUpdate = (userId: string, payload?: any) => {
  const message = JSON.stringify({
    type: 'USER_UPDATED',
    userId,
    payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!client.userId || client.userId === userId) {
        try {
          client.ws.send(message);
        } catch (err) {
          console.warn('[WebSocket] Lỗi gửi tín hiệu tới client:', err);
        }
      }
    }
  }
};
