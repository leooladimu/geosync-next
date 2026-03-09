import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getAuthUser, unauthorized, badRequest, conflict, notFound, serverError,
} from "@/lib/auth";
import { derive } from "@/lib/bioProfile.service";
import { geocodeBirthLocation } from "@/lib/geocode.service";
import type { Survey } from "@/lib/types";
import type {
  Openness, StressResponse, SocialSeason, ConflictStyle,
  Chronotype, Season,
} from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map service string enums → Prisma enums (handles hyphen → underscore) */
function toPrismaStress(s: string): StressResponse {
  return (s === "fight-flight" ? "fight_flight" : s) as StressResponse;
}
function toPrismaConflict(s: string): ConflictStyle {
  const map: Record<string, ConflictStyle> = {
    "resolve-now": "resolve_now",
    "process-first": "process_first",
    avoid: "avoid",
  };
  return map[s] ?? (s as ConflictStyle);
}

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const profile = await db.bioProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return notFound("No profile found");
    return NextResponse.json(profile);
  } catch (err) {
    return serverError(err);
  }
}

// ─── POST /api/profile ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { dob, birthLocation, survey } = await req.json() as {
      dob: string;
      birthLocation: { city: string; state?: string; country: string; lat?: number; lng?: number };
      survey: Survey;
    };

    const existing = await db.bioProfile.findUnique({ where: { userId: user.id } });
    if (existing) return conflict("Profile already exists — use PUT to update");

    const { lat, lng } = await geocodeBirthLocation(birthLocation);
    const d = derive(dob, lat, lng, survey);

    const profile = await db.bioProfile.create({
      data: {
        userId:      user.id,
        dob:         new Date(dob),
        birthCity:   birthLocation.city,
        birthState:  birthLocation.state,
        birthCountry: birthLocation.country,
        birthLat:    lat,
        birthLng:    lng,
        openness:    survey.openness as Openness,
        stressResponse: toPrismaStress(survey.stressResponse),
        socialSeason: survey.socialSeason as SocialSeason,
        conflictStyle: toPrismaConflict(survey.conflictStyle),
        season:       d.season as Season,
        lightProfile: d.lightProfile === "high-light" ? "high_light" : "low_light",
        latitudeTier: d.latitudeTier,
        chronotype:   d.chronotype as Chronotype,
        stressBaseline: toPrismaStress(d.stressBaseline),
        vulnerabilityStartMonth: d.vulnerabilityWindow.startMonth,
        vulnerabilityEndMonth:   d.vulnerabilityWindow.endMonth,
        dopamine:  d.neurotransmitters.dopamine,
        serotonin: d.neurotransmitters.serotonin,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

// ─── PUT /api/profile ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const action: string = body.action ?? "full";

    if (action === "calibrate") {
      // PATCH-style calibration update
      const { userAdjustments } = body as {
        userAdjustments: {
          chronotype?: string;
          stressBaseline?: string;
          socialSeason?: string;
        };
      };

      const profile = await db.bioProfile.update({
        where: { userId: user.id },
        data: {
          adjustedChronotype:    userAdjustments.chronotype as Chronotype | undefined,
          adjustedStressBaseline: userAdjustments.stressBaseline
            ? toPrismaStress(userAdjustments.stressBaseline)
            : undefined,
          adjustedSocialSeason: userAdjustments.socialSeason as SocialSeason | undefined,
        },
      });
      return NextResponse.json(profile);
    }

    // Full update (re-derive from new dob/location/survey)
    const { dob, birthLocation, survey } = body as {
      dob: string;
      birthLocation: { city: string; state?: string; country: string };
      survey: Survey;
    };

    const { lat, lng } = await geocodeBirthLocation(birthLocation);
    const d = derive(dob, lat, lng, survey);

    const profile = await db.bioProfile.update({
      where: { userId: user.id },
      data: {
        dob:         new Date(dob),
        birthCity:   birthLocation.city,
        birthState:  birthLocation.state,
        birthCountry: birthLocation.country,
        birthLat:    lat,
        birthLng:    lng,
        openness:    survey.openness as Openness,
        stressResponse: toPrismaStress(survey.stressResponse),
        socialSeason: survey.socialSeason as SocialSeason,
        conflictStyle: toPrismaConflict(survey.conflictStyle),
        season:       d.season as Season,
        lightProfile: d.lightProfile === "high-light" ? "high_light" : "low_light",
        latitudeTier: d.latitudeTier,
        chronotype:   d.chronotype as Chronotype,
        stressBaseline: toPrismaStress(d.stressBaseline),
        vulnerabilityStartMonth: d.vulnerabilityWindow.startMonth,
        vulnerabilityEndMonth:   d.vulnerabilityWindow.endMonth,
        dopamine:  d.neurotransmitters.dopamine,
        serotonin: d.neurotransmitters.serotonin,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    return serverError(err);
  }
}
