import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, conflict, badRequest, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return badRequest("Missing required fields", {
        name: !!name, email: !!email, password: !!password,
      });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return conflict("Email already registered");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(
      { token: signToken(user.id), user },
      { status: 201 },
    );
  } catch (err) {
    return serverError(err);
  }
}
