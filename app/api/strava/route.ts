import { NextRequest, NextResponse } from "next/server";
import type { StravaData, StravaWeeklyMileage } from "@/app/lib/types/strava";

const STRAVA_BASE_URL = "https://www.strava.com/api/v3";

export async function GET(request: NextRequest) {
  const accessToken = process.env.STRAVA_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "STRAVA_ACCESS_TOKEN is not configured" },
      { status: 400 }
    );
  }

  try {
    // Calculate timestamps: now and 90 days ago
    const now = Math.floor(Date.now() / 1000);
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60;

    // Fetch activities from last 90 days
    const activitiesRes = await fetch(
      `${STRAVA_BASE_URL}/athlete/activities?after=${ninetyDaysAgo}&per_page=200`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!activitiesRes.ok) {
      let errorDetail = `HTTP ${activitiesRes.status}`;
      try {
        const errorBody = await activitiesRes.json();
        errorDetail = errorBody.message || errorBody.error || errorDetail;
      } catch {
        // If response isn't JSON, use status text
        errorDetail = activitiesRes.statusText || errorDetail;
      }
      return NextResponse.json(
        { error: `Strava API error: ${errorDetail}` },
        { status: activitiesRes.status }
      );
    }

    const activities = await activitiesRes.json();

    // Filter for runs and convert distance to miles
    const runs = activities
      .filter((activity: any) => activity.type === "Run")
      .map((activity: any) => ({
        date: new Date(activity.start_date),
        miles: activity.distance * 0.000621371,
      }));

    // Group by week (Monday = start of week)
    const weeklyMap = new Map<string, number>();

    runs.forEach((run: { date: Date; miles: number }) => {
      const date = run.date;
      const day = date.getDay();
      const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diffToMonday));
      const weekStart = monday.toISOString().split("T")[0];

      const current = weeklyMap.get(weekStart) || 0;
      weeklyMap.set(weekStart, current + run.miles);
    });

    // Create array of last 12 weeks
    const weeklyMileage: StravaWeeklyMileage[] = [];
    const today = new Date();
    let totalMiles = 0;

    for (let i = 11; i >= 0; i--) {
      const weekDate = new Date(today);
      weekDate.setDate(weekDate.getDate() - weekDate.getDay() + (i === 11 ? 0 : i - 11) * 7 + 1 - 7);
      const day = weekDate.getDay();
      const diffToMonday = weekDate.getDate() - day + (day === 0 ? -6 : 1);
      weekDate.setDate(diffToMonday);

      const weekStart = weekDate.toISOString().split("T")[0];
      const miles = weeklyMap.get(weekStart) || 0;
      weeklyMileage.push({ week: weekStart, miles });
      totalMiles += miles;
    }

    const data: StravaData = {
      weeklyMileage,
      totalMiles,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Strava API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
