import app from './index';

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

    // Xử lý request qua Express app (Web standard Request -> Response)
    // Dùng adapter Node.js HTTP Server tương thích Cloudflare Workers
    const url = new URL(request.url);
    
    // Fallback response cho health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'FamilyTree Cloudflare Backend' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Chuyển quyền xử lý cho Express
    return (app as any)(request, env, ctx);
  },
};
