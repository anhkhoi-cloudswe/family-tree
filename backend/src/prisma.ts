import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let _prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
    const pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    // Bắt buộc lắng nghe sự kiện error để tránh unhandled socket error làm crash Worker
    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool warning]:', err.message);
    });
    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

// Proxy để các file gọi prisma.user / prisma.person vẫn hoạt động bình thường
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});
