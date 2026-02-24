import { NextRequest, NextResponse } from "next/server";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const SCOPES = "read,activity:read_all";

export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STRAVA_CLIENT_ID is not set in .env.local" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/strava/oauth/callback`;
  const state = "strava-dashboard-" + Math.random().toString(36).slice(2, 10);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "force",
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(`${STRAVA_AUTH_URL}?${params.toString()}`);
}
