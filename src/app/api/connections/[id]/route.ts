import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, serverError } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/connections/[id] ────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const connection = await db.connection.findFirst({
      where: { id, ownerId: user.id },
      include: {
        connectedUser: { select: { id: true, name: true } },
        compatibilityReport: true,
      },
    });
    if (!connection) return notFound("Connection not found");
    return NextResponse.json(connection);
  } catch (err) {
    return serverError(err);
  }
}

// ─── DELETE /api/connections/[id] ─────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const connection = await db.connection.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!connection) return notFound("Connection not found");

    // Delete in FK-safe order: forecasts → report → connection
    await db.$transaction(async (tx) => {
      await tx.seasonalForecast.deleteMany({ where: { connectionId: id } });
      if (connection.compatibilityReportId) {
        await tx.compatibilityReport.delete({
          where: { id: connection.compatibilityReportId },
        });
      }
      await tx.connection.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Connection deleted" });
  } catch (err) {
    return serverError(err);
  }
}
