import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, unauthorized, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return unauthorized("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return unauthorized("Invalid credentials");

    return NextResponse.json({
      token: signToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    return serverError(err);
  }
}
