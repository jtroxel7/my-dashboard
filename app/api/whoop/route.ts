import { NextRequest, NextResponse } from "next/server";
import type { WhoopData } from "@/app/lib/types/whoop";

const WHOOP_BASE_URL = "https://api.prod.whoop.com/developer/v1";

export async function GET(request: NextRequest) {
  const accessToken = process.env.WHOOP_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "WHOOP_ACCESS_TOKEN is not configured" },
      { status: 400 }
    );
  }

  try {
    // Fetch latest cycle
    const cycleRes = await fetch(`${WHOOP_BASE_URL}/cycle?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!cycleRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Whoop cycle data" },
        { status: cycleRes.status }
      );
    }

    const cycleData = await cycleRes.json();
    const cycles = cycleData.records || [];

    if (cycles.length === 0) {
      return NextResponse.json(
        { error: "No cycle data available" },
        { status: 404 }
      );
    }

    const cycleId = cycles[0].id;

    // Fetch recovery data for the cycle
    const recoveryRes = await fetch(`${WHOOP_BASE_URL}/cycle/${cycleId}/recovery`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 1800 },
    });

    if (!recoveryRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch recovery data" },
        { status: recoveryRes.status }
      );
    }

    const recoveryData = await recoveryRes.json();
    const recovery = recoveryData.recovery_score || 0;
    const hrv = recoveryData.hrv_rmssd_milli || 0;
    const strain = cycles[0].strain || 0;

    // Fetch sleep data
    const sleepRes = await fetch(`${WHOOP_BASE_URL}/activity/sleep?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 1800 },
    });

    let sleep = 0;
    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      const sleepRecords = sleepData.records || [];
      if (sleepRecords.length > 0) {
        sleep = sleepRecords[0].score || 0;
      }
    }

    // Fetch workout/activity data for steps
    const workoutRes = await fetch(`${WHOOP_BASE_URL}/activity/workout?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 1800 },
    });

    let steps = 0;
    if (workoutRes.ok) {
      const workoutData = await workoutRes.json();
      const workouts = workoutData.records || [];
      if (workouts.length > 0) {
        steps = workouts[0].steps || 0;
      }
    }

    const data: WhoopData = {
      recovery,
      sleep,
      hrv,
      steps,
      strain,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Whoop API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
