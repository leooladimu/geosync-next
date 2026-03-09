/**
 * src/lib/auth.ts
 *
 * JWT helpers for App Router API routes.
 * Replaces Express auth.middleware.js.
 *
 * Usage in a route:
 *   const user = await getAuthUser(request)
 *   if (!user) return unauthorized()
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES = "30d";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Returns the safe user object, or null if missing / invalid / user not found.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    return user ?? null;
  } catch {
    return null;
  }
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequest(message: string, details?: object) {
  return NextResponse.json({ error: message, ...(details && { details }) }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(err);
  return NextResponse.json({ error: message }, { status: 500 });
}
