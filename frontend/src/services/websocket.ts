type TreeUpdateCallback = (data?: any) => void;
type UserUpdateCallback = (data?: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private treeListeners: Map<string, Set<TreeUpdateCallback>> = new Map();
  private userListeners: Map<string, Set<UserUpdateCallback>> = new Map();
  private activeTreeId: string | null = null;
  private activeUserId: string | null = null;
  private reconnectTimer: any = null;
  private reconnectInterval = 2000;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    // If backend is configured on separate port, default to window.location.host with /ws via Vite proxy
    return `${wsProtocol}//${window.location.host}/ws`;
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.isConnecting = true;
      const url = this.getSocketUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectInterval = 2000;

        // Tự động đăng ký lại treeId và userId nếu có
        if (this.activeTreeId) {
          this.sendMessage({ type: 'SUBSCRIBE_TREE', treeId: this.activeTreeId });
        }
        if (this.activeUserId) {
          this.sendMessage({ type: 'SUBSCRIBE_USER', userId: this.activeUserId });
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TREE_UPDATED' && data.treeId) {
            const listeners = this.treeListeners.get(data.treeId);
            if (listeners) {
              listeners.forEach((callback) => {
                try { callback(data); } catch (e) { console.error('[WS Callback error]', e); }
              });
            }
          } else if (data.type === 'USER_UPDATED' && data.userId) {
            const listeners = this.userListeners.get(data.userId);
            if (listeners) {
              listeners.forEach((callback) => {
                try { callback(data); } catch (e) { console.error('[WS Callback error]', e); }
              });
            }
          }
        } catch (err) {
          // Bỏ qua tin nhắn không đúng định dạng
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
    // Exponential backoff up to 10s
    this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 10000);
  }

  private sendMessage(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  /**
   * Đăng ký lắng nghe thay đổi thời gian thực cho cây gia phả
   */
  public subscribeToTree(treeId: string, callback: TreeUpdateCallback): () => void {
    this.activeTreeId = treeId;
    if (!this.treeListeners.has(treeId)) {
      this.treeListeners.set(treeId, new Set());
    }
    this.treeListeners.get(treeId)!.add(callback);

    this.sendMessage({ type: 'SUBSCRIBE_TREE', treeId });

    return () => {
      const listeners = this.treeListeners.get(treeId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.treeListeners.delete(treeId);
        }
      }
    };
  }

  /**
   * Đăng ký lắng nghe thông báo cá nhân (lời mời mới, đổi quyền)
   */
  public subscribeToUser(userId: string, callback: UserUpdateCallback): () => void {
    this.activeUserId = userId;
    if (!this.userListeners.has(userId)) {
      this.userListeners.set(userId, new Set());
    }
    this.userListeners.get(userId)!.add(callback);

    this.sendMessage({ type: 'SUBSCRIBE_USER', userId });

    return () => {
      const listeners = this.userListeners.get(userId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.userListeners.delete(userId);
        }
      }
    };
  }
}

export const wsClient = new WebSocketClient();
