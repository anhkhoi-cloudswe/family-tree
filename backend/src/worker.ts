import http from 'http';
import { handleAsNodeRequest } from 'cloudflare:node';
import app from './index';

let server: http.Server | null = null;
let serverPort = 8080;

function ensureServer(): number {
  if (!server) {
    server = http.createServer(app);
    server.listen(serverPort);
  }
  return serverPort;
}

// Cloudflare Workers fetch handler
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Inject biến môi trường từ Cloudflare Workers runtime
    if (env.DATABASE_URL) {
      process.env.DATABASE_URL = env.DATABASE_URL;
    }
    if (env.JWT_SECRET) {
      process.env.JWT_SECRET = env.JWT_SECRET;
    }

    const url = new URL(request.url);
    
    // Fallback response cho health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'FamilyTree Cloudflare Backend' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Chuyển quyền xử lý cho Express qua Node HTTP bridge
    const port = ensureServer();
    return handleAsNodeRequest(port, request, env, ctx);
  },
};
