import { NextRequest, NextResponse } from "next/server";
import type { WhoopData } from "@/app/lib/types/whoop";

const WHOOP_BASE_URL = "https://api.prod.whoop.com/developer/v2";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

// In-memory cache of refreshed tokens (new access + refresh token; used after 401 to avoid re-refreshing every request)
let tokenCache: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null = null;

/** Refresh access token using WHOOP_REFRESH_TOKEN. Returns new tokens or null. */
async function refreshWhoopTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  const refreshToken =
    tokenCache?.refreshToken ?? process.env.WHOOP_REFRESH_TOKEN;
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[WHOOP] Refresh skipped: need WHOOP_REFRESH_TOKEN, WHOOP_CLIENT_ID, and WHOOP_CLIENT_SECRET in .env.local"
      );
    }
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "read:recovery read:cycles read:sleep read:workout offline",
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || data.error || !data.access_token) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[WHOOP] Refresh failed:",
        res.status,
        data.error || data.error_description || "no access_token in response"
      );
    }
    return null;
  }

  const accessToken = data.access_token;
  const newRefreshToken = data.refresh_token ?? refreshToken;
  const expiresIn = data.expires_in ?? 3600;

  tokenCache = {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return { accessToken, refreshToken: newRefreshToken, expiresIn };
}

/** Get a valid access token: from cache, env, or by refreshing. */
async function getWhoopAccessToken(): Promise<string | null> {
  // Use cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }
  return process.env.WHOOP_ACCESS_TOKEN ?? tokenCache?.accessToken ?? null;
}

/** Fetch with Bearer token; on 401, try refresh once and retry. */
async function whoopFetch(
  url: string,
  accessToken: string
): Promise<{ res: Response; accessToken: string }> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 1800 },
  });

  if (res.status === 401) {
    const refreshed = await refreshWhoopTokens();
    if (refreshed) {
      const retryRes = await fetch(url, {
        headers: { Authorization: `Bearer ${refreshed.accessToken}` },
        next: { revalidate: 1800 },
      });
      return { res: retryRes, accessToken: refreshed.accessToken };
    }
  }

  return { res, accessToken };
}

export async function GET(request: NextRequest) {
  let accessToken = await getWhoopAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      { error: "WHOOP_ACCESS_TOKEN is not configured" },
      { status: 400 }
    );
  }

  try {
    // Fetch latest cycle (v2: GET /v2/cycle?limit=1)
    let result = await whoopFetch(
      `${WHOOP_BASE_URL}/cycle?limit=1`,
      accessToken
    );
    const { res: cycleRes } = result;
    accessToken = result.accessToken;

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
    const cycleScore = cycles[0].score;
    const strain = cycleScore?.strain ?? 0;

    // Fetch recovery for this cycle (v2: single object with score)
    result = await whoopFetch(
      `${WHOOP_BASE_URL}/cycle/${cycleId}/recovery`,
      accessToken
    );
    const { res: recoveryRes } = result;
    accessToken = result.accessToken;

    let recovery = 0;
    let hrv = 0;
    let restingHeartRate = 0;

    if (recoveryRes.status === 404) {
      // No recovery data for this cycle yet (e.g. cycle just started) — keep going
    } else if (!recoveryRes.ok) {
      const is401 = recoveryRes.status === 401;
      const refreshConfigured = !!(
        process.env.WHOOP_REFRESH_TOKEN ||
        tokenCache?.refreshToken
      );
      return NextResponse.json(
        {
          error: "Failed to fetch recovery data",
          statusCode: recoveryRes.status,
          hint:
            is401 && !refreshConfigured
              ? "Token may be expired. Add WHOOP_REFRESH_TOKEN (and WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET) to .env.local, or get a new token from /whoop-auth."
              : is401
                ? "Token expired and refresh failed. Check WHOOP_REFRESH_TOKEN, WHOOP_CLIENT_ID, and WHOOP_CLIENT_SECRET in .env.local, or get a new token from /whoop-auth."
                : undefined,
        },
        { status: recoveryRes.status }
      );
    } else {
      const recoveryData = await recoveryRes.json();
      const score = recoveryData.score ?? recoveryData;
      recovery = score?.recovery_score ?? recoveryData.recovery_score ?? 0;
      hrv = score?.hrv_rmssd_milli ?? recoveryData.hrv_rmssd_milli ?? 0;
      restingHeartRate =
        score?.resting_heart_rate ?? recoveryData.resting_heart_rate ?? 0;
    }

    // Fetch sleep for this cycle (v2: GET /v2/cycle/{cycleId}/sleep returns single sleep object)
    result = await whoopFetch(
      `${WHOOP_BASE_URL}/cycle/${cycleId}/sleep`,
      accessToken
    );
    const { res: sleepRes } = result;
    accessToken = result.accessToken;

    let sleep = 0;
    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      const sleepScore = sleepData.score ?? sleepData;
      sleep =
        sleepScore?.sleep_performance_percentage ??
        sleepData.sleep_performance_percentage ??
        0;
    }

    // Steps: use cycle score if API provides it, else estimate from latest workout distance
    let steps = 0;
    const cycleSteps =
      typeof cycleScore?.steps === "number" ? cycleScore.steps : undefined;
    if (cycleSteps != null && cycleSteps > 0) {
      steps = cycleSteps;
    } else {
      result = await whoopFetch(
        `${WHOOP_BASE_URL}/activity/workout?limit=1`,
        accessToken
      );
      const { res: workoutRes } = result;
      accessToken = result.accessToken;
      if (workoutRes.ok) {
        const workoutData = await workoutRes.json();
        const workouts = workoutData.records || [];
        if (workouts.length > 0) {
          const w = workouts[0];
          const score = w.score ?? w;
          const distanceMeter = score?.distance_meter ?? w.distance_meter;
          if (typeof distanceMeter === "number" && distanceMeter > 0) {
            steps = Math.round(distanceMeter / 0.762);
          }
        }
      }
    }

    const data: WhoopData = {
      recovery,
      sleep,
      hrv,
      restingHeartRate,
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
