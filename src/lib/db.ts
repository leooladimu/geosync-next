import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma 7 singleton — safe for Next.js dev hot-reload.
 *
 * Prisma 7 requires a driver adapter. We use @prisma/adapter-pg backed by
 * a pg Pool. The Pool is kept on globalThis so HMR in development doesn't
 * exhaust Postgres connections.
 */

const globalForPrisma = globalThis as unknown as {
  pool: Pool | undefined;
  prisma: PrismaClient | undefined;
};

function createClient() {
  const pool =
    globalForPrisma.pool ??
    new Pool({ connectionString: process.env.DATABASE_URL });

  if (!globalForPrisma.pool) globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
