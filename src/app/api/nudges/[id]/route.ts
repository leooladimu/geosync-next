import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, serverError } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/nudges/[id] ─── dismiss a nudge ───────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const nudge = await db.coachingNudge.findFirst({
      where: { id, userId: user.id },
    });
    if (!nudge) return notFound("Nudge not found");

    const updated = await db.coachingNudge.update({
      where: { id },
      data:  { dismissed: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}
