import http from 'http';
import { handleAsNodeRequest } from 'cloudflare:node';
import app from './index';
import { setWorkerEnv } from './services/email.service';

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
    setWorkerEnv(env);
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

    // Xử lý CORS Preflight an toàn ở cấp Worker
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin') || '*';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      // Chuyển quyền xử lý cho Express qua Node HTTP bridge
      const port = ensureServer();
      const response = await handleAsNodeRequest(port, request, env, ctx);
      return response;
    } catch (err: any) {
      console.error('[Cloudflare Worker Error]:', err);
      const origin = request.headers.get('Origin') || '*';
      return new Response(
        JSON.stringify({ error: err?.message || 'Đã xảy ra lỗi máy chủ nội bộ.' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }
  },
};
