import { NextRequest, NextResponse } from "next/server";
import type { WhoopData } from "@/app/lib/types/whoop";

const WHOOP_BASE_URL = "https://api.prod.whoop.com/developer/v1";
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
    // Fetch latest cycle
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

    // Fetch recovery data for the cycle (404 = no recovery for this cycle yet, treat as optional)
    result = await whoopFetch(
      `${WHOOP_BASE_URL}/cycle/${cycleId}/recovery`,
      accessToken
    );
    const { res: recoveryRes } = result;
    accessToken = result.accessToken;

    let recovery = 0;
    let hrv = 0;

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
      const score = recoveryData.score;
      recovery = score?.recovery_score ?? 0;
      hrv = score?.hrv_rmssd_milli ?? 0;
    }

    // Fetch sleep data
    result = await whoopFetch(
      `${WHOOP_BASE_URL}/activity/sleep?limit=1`,
      accessToken
    );
    const { res: sleepRes } = result;
    accessToken = result.accessToken;

    let sleep = 0;
    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      const sleepRecords = sleepData.records || [];
      if (sleepRecords.length > 0) {
        const sleepScore = sleepRecords[0].score;
        sleep = sleepScore?.sleep_performance_percentage ?? 0;
      }
    }

    // Fetch workout/activity data for steps
    result = await whoopFetch(
      `${WHOOP_BASE_URL}/activity/workout?limit=1`,
      accessToken
    );
    const { res: workoutRes } = result;

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
