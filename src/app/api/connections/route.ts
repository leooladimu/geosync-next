import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getAuthUser, unauthorized, badRequest, serverError,
} from "@/lib/auth";
import { derive } from "@/lib/bioProfile.service";
import { generate } from "@/lib/compatibility.service";
import { geocodeBirthLocation } from "@/lib/geocode.service";
import type { DerivedProfile, Survey } from "@/lib/types";
import type {
  BioProfile, ConnectionType,
  Chronotype, StressResponse, SocialSeason,
} from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPrismaStress(s: string): StressResponse {
  return (s === "fight-flight" ? "fight_flight" : s) as StressResponse;
}

/** Reconstruct a DerivedProfile from a Prisma BioProfile row */
function profileToDerived(p: BioProfile, adjustments?: {
  chronotype?: string | null;
  stressBaseline?: string | null;
  socialSeason?: string | null;
}): DerivedProfile {
  const chronotype = adjustments?.chronotype
    ? (adjustments.chronotype as DerivedProfile["chronotype"])
    : (p.chronotype as DerivedProfile["chronotype"]);

  const stressBaseline = adjustments?.stressBaseline
    ? (adjustments.stressBaseline === "fight_flight" ? "fight-flight" : adjustments.stressBaseline) as DerivedProfile["stressBaseline"]
    : (p.stressBaseline === "fight_flight" ? "fight-flight" : p.stressBaseline) as DerivedProfile["stressBaseline"];

  return {
    season:        p.season as DerivedProfile["season"],
    lightProfile:  p.lightProfile === "high_light" ? "high-light" : "low-light",
    latitudeTier:  p.latitudeTier as DerivedProfile["latitudeTier"],
    chronotype,
    stressBaseline,
    vulnerabilityWindow: {
      startMonth: p.vulnerabilityStartMonth,
      endMonth:   p.vulnerabilityEndMonth,
    },
    neurotransmitters: {
      dopamine:  p.dopamine  as DerivedProfile["neurotransmitters"]["dopamine"],
      serotonin: p.serotonin as DerivedProfile["neurotransmitters"]["serotonin"],
    },
  };
}

// ─── GET /api/connections ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const connections = await db.connection.findMany({
      where: { ownerId: user.id },
      include: {
        connectedUser: { select: { id: true, name: true } },
        compatibilityReport: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(connections);
  } catch (err) {
    return serverError(err);
  }
}

// ─── POST /api/connections ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { type, connectedUserId, manualProfile } = await req.json() as {
      type: ConnectionType;
      connectedUserId?: string;
      manualProfile?: {
        name: string;
        dob: string;
        birthLocation: { city: string; state?: string; country: string; lat?: number; lng?: number };
        survey?: Survey;
      };
    };

    if (!connectedUserId && !manualProfile) {
      return badRequest("Provide either connectedUserId or manualProfile");
    }

    // Load owner profile
    const ownerRow = await db.bioProfile.findUnique({ where: { userId: user.id } });
    if (!ownerRow) return badRequest("Complete your own profile before adding connections");

    const ownerDerived = profileToDerived(ownerRow, {
      chronotype:    ownerRow.adjustedChronotype,
      stressBaseline: ownerRow.adjustedStressBaseline,
      socialSeason:  ownerRow.adjustedSocialSeason,
    });

    // Resolve partner
    let partnerDerived: DerivedProfile;
    let resolvedConnectedUserId: string | null = connectedUserId ?? null;
    let matchedExistingUser = false;
    let resolvedManualProfile = manualProfile ?? null;

    if (connectedUserId) {
      const partnerRow = await db.bioProfile.findUnique({ where: { userId: connectedUserId } });
      if (!partnerRow) return badRequest("Partner has not completed their profile yet");
      partnerDerived = profileToDerived(partnerRow, {
        chronotype:    partnerRow.adjustedChronotype,
        stressBaseline: partnerRow.adjustedStressBaseline,
      });
    } else if (manualProfile) {
      // Try to match against existing users
      const { dob, birthLocation, survey } = manualProfile;

      if (dob && birthLocation?.city && birthLocation?.country) {
        const dayStart = new Date(dob); dayStart.setUTCHours(0,0,0,0);
        const dayEnd   = new Date(dob); dayEnd.setUTCHours(23,59,59,999);

        const candidates = await db.bioProfile.findMany({
          where: {
            userId: { not: user.id },
            dob: { gte: dayStart, lte: dayEnd },
          },
          include: { user: { select: { name: true } } },
        });

        const norm = (s: string) => s.trim().toLowerCase();
        const matched = candidates.find((bp) =>
          norm(bp.user.name) === norm(manualProfile.name) &&
          norm(bp.birthCity) === norm(birthLocation.city) &&
          norm(bp.birthCountry) === norm(birthLocation.country),
        );

        if (matched) {
          partnerDerived = profileToDerived(matched, {
            chronotype:    matched.adjustedChronotype,
            stressBaseline: matched.adjustedStressBaseline,
          });
          resolvedConnectedUserId = matched.userId;
          matchedExistingUser = true;
          resolvedManualProfile = null;
        } else {
          const { lat, lng } = birthLocation.lat && birthLocation.lng
            ? { lat: birthLocation.lat, lng: birthLocation.lng }
            : await geocodeBirthLocation(birthLocation);

          const effectiveSurvey: Survey = survey ?? {
            stressResponse: "expand",
            openness: "situational",
            socialSeason: "summer",
            conflictStyle: "process-first",
          };

          partnerDerived = derive(dob, lat, lng, effectiveSurvey);
          resolvedManualProfile = { ...manualProfile, birthLocation: { ...birthLocation, lat, lng } };
        }
      } else {
        const { lat, lng } = await geocodeBirthLocation(manualProfile.birthLocation);
        const effectiveSurvey: Survey = manualProfile.survey ?? {
          stressResponse: "expand", openness: "situational",
          socialSeason: "summer", conflictStyle: "process-first",
        };
        partnerDerived = derive(manualProfile.dob, lat, lng, effectiveSurvey);
        resolvedManualProfile = { ...manualProfile, birthLocation: { ...manualProfile.birthLocation, lat, lng } };
      }
    } else {
      return badRequest("Provide either connectedUserId or manualProfile");
    }

    const report = generate(ownerDerived, partnerDerived);

    // Create connection + report in a transaction
    const [connection, savedReport] = await db.$transaction(async (tx) => {
      const conn = await tx.connection.create({
        data: {
          ownerId: user.id,
          type,
          connectedUserId: resolvedConnectedUserId,
          manualProfile:   resolvedConnectedUserId ? undefined : (resolvedManualProfile as unknown as object) ?? undefined,
        },
      });

      const rep = await tx.compatibilityReport.create({
        data: {
          connectionId:    conn.id,
          scoreOverall:    report.scores.overall,
          scoreChronotype: report.scores.chronotype,
          scoreStress:     report.scores.stress,
          scoreSeasonal:   report.scores.seasonal,
          tierChronotype:  report.tiers.chronotype,
          tierStress:      report.tiers.stress,
          tierSeasonal:    report.tiers.seasonal,
          archetype:       report.archetype,
          dimensions:      report.dimensions as object,
          generatedAt:     report.generatedAt,
        },
      });

      await tx.connection.update({
        where: { id: conn.id },
        data: { compatibilityReportId: rep.id },
      });

      return [conn, rep];
    });

    return NextResponse.json(
      { connection, report: savedReport, matchedExistingUser },
      { status: 201 },
    );
  } catch (err) {
    return serverError(err);
  }
}
