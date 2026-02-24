import { NextRequest, NextResponse } from "next/server";

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return htmlResponse(
      "WHOOP authorization failed",
      `<p class="error">Error: ${escapeHtml(error)}</p>
       <p>${escapeHtml(searchParams.get("error_description") || "")}</p>
       <p><a href="/whoop-auth">Try again</a></p>`
    );
  }

  if (!code || !state) {
    return htmlResponse(
      "Missing code",
      "<p>No authorization code received. <a href=\"/whoop-auth\">Start over</a></p>"
    );
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return htmlResponse(
      "Server misconfigured",
      "<p>WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET must be set in .env.local</p>"
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/whoop/oauth/callback`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenRes = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || data.error) {
    return htmlResponse(
      "Token exchange failed",
      `<p class="error">${escapeHtml(data.error_description || data.error || "Unknown error")}</p>
       <p><a href="/whoop-auth">Try again</a></p>`
    );
  }

  const accessToken = data.access_token ?? "";
  const refreshToken = data.refresh_token ?? "";
  const expiresIn = data.expires_in ?? 0;

  const instructions = `
    <h2>Add these to your <code>.env.local</code> file</h2>
    <p>Restart your dev server after saving.</p>
    <div class="token-box">
      <label>WHOOP_ACCESS_TOKEN</label>
      <pre id="access-token">${escapeHtml(accessToken)}</pre>
      <button type="button" onclick="copyToken('access-token')">Copy</button>
    </div>
    ${
      refreshToken
        ? `
    <div class="token-box">
      <label>Optional: save for refresh later</label>
      <pre id="refresh-token">${escapeHtml(refreshToken)}</pre>
      <button type="button" onclick="copyToken('refresh-token')">Copy</button>
    </div>
    `
        : ""
    }
    <p class="meta">Access token expires in about ${Math.round(expiresIn / 60)} minutes. When it expires, run this flow again or use the refresh token.</p>
    <p><a href="/">Back to dashboard</a></p>
  `;

  return htmlResponse("WHOOP token", instructions, true);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlResponse(
  title: string,
  body: string,
  withCopyScript = false
): NextResponse {
  const script = withCopyScript
    ? `
    <script>
      function copyToken(id) {
        const pre = document.getElementById(id);
        navigator.clipboard.writeText(pre.textContent);
        const btn = pre.nextElementSibling;
        const old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function(){ btn.textContent = old; }, 1500);
      }
    </script>
  `
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    .error { color: #c00; }
    .token-box { margin: 1rem 0; padding: 1rem; background: #f5f5f5; border-radius: 4px; }
    .token-box label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
    .token-box pre { word-break: break-all; font-size: 12px; margin: 0.5rem 0; }
    .token-box button { padding: 0.25rem 0.75rem; cursor: pointer; }
    .meta { font-size: 0.9rem; color: #666; }
    a { color: #0066cc; }
    code { background: #eee; padding: 0.1em 0.3em; border-radius: 2px; }
  </style>${script}
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${body}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
