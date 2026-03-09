import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 config.
 * - `datasource.url` provides the connection string for migrate / introspect commands.
 * - The runtime PrismaClient adapter (pg Pool) lives in src/lib/db.ts.
 * https://pris.ly/d/config-datasource
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

