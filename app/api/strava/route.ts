import { NextResponse } from "next/server";
import type { StravaData, StravaWeeklyMileage } from "@/app/lib/types/strava";

const STRAVA_BASE_URL = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

let tokenCache: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null = null;

interface StravaActivity {
  type?: string;
  start_date?: string;
  distance?: number;
}

interface StravaTokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  message?: string;
  errors?: Array<{ resource?: string; field?: string; code?: string }>;
}

function getErrorMessage(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const maybeMsg = (body as { message?: unknown }).message;
    if (typeof maybeMsg === "string" && maybeMsg.length > 0) {
      return maybeMsg;
    }
    const maybeError = (body as { error?: unknown }).error;
    if (typeof maybeError === "string" && maybeError.length > 0) {
      return maybeError;
    }
  }
  return `HTTP ${status}`;
}

async function refreshStravaTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null> {
  const refreshToken =
    tokenCache?.refreshToken ?? process.env.STRAVA_REFRESH_TOKEN;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[STRAVA] Refresh skipped: need STRAVA_REFRESH_TOKEN, STRAVA_CLIENT_ID, and STRAVA_CLIENT_SECRET in .env.local"
      );
    }
    return null;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = (await res.json()) as StravaTokenRefreshResponse;
  if (!res.ok || !data.access_token) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[STRAVA] Refresh failed:",
        res.status,
        getErrorMessage(res.status, data)
      );
    }
    return null;
  }

  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token ?? refreshToken;
  const expiresAt =
    typeof data.expires_at === "number"
      ? data.expires_at * 1000
      : Date.now() + (data.expires_in ?? 3600) * 1000;

  tokenCache = {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresAt,
  };

  return tokenCache;
}

async function getStravaAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }
  return process.env.STRAVA_ACCESS_TOKEN ?? tokenCache?.accessToken ?? null;
}

async function stravaFetch(
  url: string,
  accessToken: string
): Promise<{ res: Response; accessToken: string; didRefresh: boolean }> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    const refreshed = await refreshStravaTokens();
    if (refreshed) {
      const retryRes = await fetch(url, {
        headers: { Authorization: `Bearer ${refreshed.accessToken}` },
        cache: "no-store",
      });
      return {
        res: retryRes,
        accessToken: refreshed.accessToken,
        didRefresh: true,
      };
    }
  }

  return { res, accessToken, didRefresh: false };
}

export async function GET() {
  const accessToken = await getStravaAccessToken();

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
    const result = await stravaFetch(
      `${STRAVA_BASE_URL}/athlete/activities?after=${ninetyDaysAgo}&per_page=200`,
      accessToken
    );
    const { res: activitiesRes, didRefresh } = result;

    if (!activitiesRes.ok) {
      let errorDetail = `HTTP ${activitiesRes.status}`;
      try {
        const errorBody = (await activitiesRes.json()) as unknown;
        errorDetail = getErrorMessage(activitiesRes.status, errorBody);
      } catch {
        // If response isn't JSON, use status text
        errorDetail = activitiesRes.statusText || errorDetail;
      }

      const refreshConfigured = !!(
        process.env.STRAVA_REFRESH_TOKEN ||
        tokenCache?.refreshToken
      );
      const hint =
        activitiesRes.status === 401 && !refreshConfigured
          ? "Token may be expired. Add STRAVA_REFRESH_TOKEN, STRAVA_CLIENT_ID, and STRAVA_CLIENT_SECRET to .env.local."
          : activitiesRes.status === 401 &&
              errorDetail.toLowerCase().includes("authorization")
            ? "Strava token likely lacks required scope. Re-authorize with activity:read_all and replace both STRAVA_ACCESS_TOKEN and STRAVA_REFRESH_TOKEN."
          : activitiesRes.status === 401 && didRefresh
            ? "Token refresh was attempted but Strava still returned 401. Re-authorize and update STRAVA_ACCESS_TOKEN/STRAVA_REFRESH_TOKEN."
            : activitiesRes.status === 401
              ? "Token may be expired. Ensure STRAVA_REFRESH_TOKEN, STRAVA_CLIENT_ID, and STRAVA_CLIENT_SECRET are correct in .env.local."
              : undefined;

      return NextResponse.json(
        { error: `Strava API error: ${errorDetail}`, hint },
        { status: activitiesRes.status }
      );
    }

    const activities = (await activitiesRes.json()) as StravaActivity[];

    // Filter for runs and convert distance to miles
    const runs = activities
      .filter(
        (activity) =>
          activity.type === "Run" &&
          typeof activity.start_date === "string" &&
          typeof activity.distance === "number"
      )
      .map((activity) => ({
        date: new Date(activity.start_date as string),
        miles: (activity.distance as number) * 0.000621371,
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
