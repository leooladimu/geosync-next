import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, unauthorized, serverError } from "@/lib/auth";
import { getCandidateNudges } from "@/lib/nudge.service";
import type { ProfileForNudge, ConnectionForNudge } from "@/lib/types";
import type { NudgeCategory } from "@prisma/client";

// Map service string enum → Prisma enum
function toPrismaNudgeCategory(c: string): NudgeCategory {
  const map: Record<string, NudgeCategory> = {
    "withdrawal":       "withdrawal",
    "over-commitment":  "over_commitment",
    "intensity-seeking":"intensity_seeking",
    "scarcity-lock":    "scarcity_lock",
    "optimism-bias":    "optimism_bias",
  };
  return map[c] ?? (c as NudgeCategory);
}

// ─── GET /api/nudges ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const profileRow = await db.bioProfile.findUnique({ where: { userId: user.id } });

    if (profileRow) {
      const connections = await db.connection.findMany({
        where: { ownerId: user.id },
        include: { connectedUser: { select: { name: true } } },
      });

      // Build lean shapes expected by nudge service
      const profile: ProfileForNudge = {
        derived: {
          season:        profileRow.season as ProfileForNudge["derived"]["season"],
          lightProfile:  profileRow.lightProfile === "high_light" ? "high-light" : "low-light",
          latitudeTier:  profileRow.latitudeTier as ProfileForNudge["derived"]["latitudeTier"],
          chronotype:    (profileRow.adjustedChronotype ?? profileRow.chronotype) as ProfileForNudge["derived"]["chronotype"],
          stressBaseline: (() => {
            const s = profileRow.adjustedStressBaseline ?? profileRow.stressBaseline;
            return (s === "fight_flight" ? "fight-flight" : s) as ProfileForNudge["derived"]["stressBaseline"];
          })(),
          vulnerabilityWindow: {
            startMonth: profileRow.vulnerabilityStartMonth,
            endMonth:   profileRow.vulnerabilityEndMonth,
          },
          neurotransmitters: {
            dopamine:  profileRow.dopamine  as ProfileForNudge["derived"]["neurotransmitters"]["dopamine"],
            serotonin: profileRow.serotonin as ProfileForNudge["derived"]["neurotransmitters"]["serotonin"],
          },
        },
      };

      const leanConnections: ConnectionForNudge[] = connections.map((c) => ({
        id: c.id,
        connectedUserId: c.connectedUserId,
        manualProfile: (c.manualProfile as { name?: string } | null),
      }));

      const candidates = getCandidateNudges(profile, leanConnections);

      // Persist new nudges, skipping already-active ones
      for (const { connectionId, nudge } of candidates) {
        const prismaCategory = toPrismaNudgeCategory(nudge.category);
        const alreadyActive = await db.coachingNudge.findFirst({
          where: {
            userId: user.id,
            connectionId: connectionId ?? null,
            category: prismaCategory,
            dismissed: false,
          },
        });
        if (!alreadyActive) {
          await db.coachingNudge.create({
            data: {
              userId: user.id,
              connectionId: connectionId ?? null,
              category: prismaCategory,
              trigger: nudge.trigger,
              message: nudge.message,
            },
          });
        }
      }
    }

    // Return all undismissed nudges for this user
    const nudges = await db.coachingNudge.findMany({
      where: { userId: user.id, dismissed: false },
      include: {
        connection: {
          select: {
            type: true,
            manualProfile: true,
            connectedUser: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(nudges);
  } catch (err) {
    return serverError(err);
  }
}
