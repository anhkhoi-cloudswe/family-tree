import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

export const prismaStorage = new AsyncLocalStorage<PrismaClient>();

let _globalPrisma: PrismaClient | null = null;

export function createPrismaInstance(connectionString: string): { prisma: PrismaClient; cleanup: () => Promise<void> } {
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.warn('[PostgreSQL Pool warning]:', err.message);
  });

  const adapter = new PrismaPg(pool);
  const prismaClient = new PrismaClient({ adapter });

  const cleanup = async () => {
    try {
      await pool.end();
    } catch {
      // Ignored during cleanup
    }
  };

  return { prisma: prismaClient, cleanup };
}

export function getPrismaClient(): PrismaClient {
  const scoped = prismaStorage.getStore();
  if (scoped) {
    return scoped;
  }

  if (!_globalPrisma) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
    const { prisma: globalClient } = createPrismaInstance(connectionString);
    _globalPrisma = globalClient;
  }
  return _globalPrisma;
}

// Proxy để các controller/service gọi prisma.user / prisma.person vẫn hoạt động trong suốt theo ngữ cảnh request
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});
