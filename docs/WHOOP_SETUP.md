# WHOOP integration setup

Your dashboard uses the WHOOP API with a single environment variable: **`WHOOP_ACCESS_TOKEN`**. You can get that token **for free** using a built-in OAuth flow in this app (no Postman or other tools required).

---

## Step 1: Prerequisites

- An active **WHOOP membership** (the same account you use in the WHOOP app).

---

## Step 2: Create an app in the WHOOP Developer Dashboard

1. Open **https://developer-dashboard.whoop.com/** and sign in with your WHOOP account.

2. If prompted, **create a Team** (e.g. “My Dashboard”), then go to **Apps** → **Create app** (or **https://developer-dashboard.whoop.com/apps/create**).

3. Fill in the app:
   - **App name**: e.g. “My Dashboard”.
   - **Scopes**: enable at least:
     - `read:recovery`
     - `read:cycles`
     - `read:sleep`
     - `read:workout`
   - **Redirect URI(s)** — add **both** of these (for local and production):
     - **Local**: `http://localhost:3000/api/whoop/oauth/callback`
     - **Production** (if you deploy): `https://your-app.vercel.app/api/whoop/oauth/callback`  
       Replace `your-app` with your actual Vercel project URL.

4. Click **Create**, then copy and save:
   - **Client ID**
   - **Client Secret**  
   Keep the secret private and never commit it to git.

---

## Step 3: Add Client ID and Secret to your app

1. In your project root, create or edit **`.env.local`** and add:

   ```bash
   WHOOP_CLIENT_ID=your_client_id_here
   WHOOP_CLIENT_SECRET=your_client_secret_here
   ```

2. Restart your dev server:

   ```bash
   npm run dev
   ```

---

## Step 4: Get your access token (free, in-app)

1. In your browser, open: **http://localhost:3000/whoop-auth**

2. Click **Connect WHOOP**. You’ll be sent to WHOOP to sign in and grant access.

3. After you grant access, you’re redirected back to a page that shows your **access token** (and optionally a refresh token).

4. Click **Copy** next to the access token, then add it to `.env.local`:

   ```bash
   WHOOP_ACCESS_TOKEN=paste_the_copied_token_here
   ```

5. Restart the dev server again. The WHOOP card on your dashboard should now load.

**If you’ve already deployed:** Use your production URL for the WHOOP redirect URI (Step 2), then open **https://your-app.vercel.app/whoop-auth** to get a token. Add that token to your hosting provider’s environment variables as `WHOOP_ACCESS_TOKEN`.

---

## Step 5: If you deploy (e.g. Vercel)

- In Vercel → Project → Settings → Environment Variables, add:
  - `WHOOP_ACCESS_TOKEN` = the token you got from `/whoop-auth` (or a new one from running the flow again).
- Redeploy so the new variable is used.

---

## Token expiration and refresh

- WHOOP access tokens are **short-lived** (often around 1 hour). When the token expires, the WHOOP card will stop loading until you use a new token.
- To get a new token: go to **/whoop-auth** again and complete “Connect WHOOP”. Copy the new access token into `WHOOP_ACCESS_TOKEN` in `.env.local` (and in Vercel if you deploy), then restart/redeploy.
- The in-app flow also requests the `offline` scope and returns a **refresh token**. You can save that and use WHOOP’s [refresh endpoint](https://developer.whoop.com/docs/developing/oauth#refreshing-an-access-token) (e.g. with a small script or cron) to get new access tokens without signing in again. The dashboard itself does not perform refresh yet; it only reads `WHOOP_ACCESS_TOKEN`.

---

## Optional: Using Postman instead

If you prefer to use Postman (or another OAuth client) instead of the in-app flow:

1. In the WHOOP Developer Dashboard, add this Redirect URI: `https://oauth.pstmn.io/v1/callback`
2. In Postman, create a request with **OAuth 2.0**:
   - **Auth URL**: `https://api.prod.whoop.com/oauth/oauth2/auth`
   - **Access Token URL**: `https://api.prod.whoop.com/oauth/oauth2/token`
   - **Callback URL**: `https://oauth.pstmn.io/v1/callback`
   - **Scope**: `read:recovery read:cycles read:sleep read:workout offline`
3. Use **Get New Access Token**, sign in to WHOOP, then copy the access token into `WHOOP_ACCESS_TOKEN` in `.env.local`.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| “WHOOP_ACCESS_TOKEN is not configured” | `.env.local` has `WHOOP_ACCESS_TOKEN=...` and you restarted the dev server. |
| “WHOOP_CLIENT_ID is not set” on /whoop-auth | Add `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` to `.env.local` and restart. |
| Redirect URI mismatch after clicking Connect WHOOP | In the WHOOP dashboard, the redirect URI must be **exactly** `http://localhost:3000/api/whoop/oauth/callback` (same protocol, host, and path). |
| 401 Unauthorized from WHOOP | Token expired. Get a new token from /whoop-auth and update `WHOOP_ACCESS_TOKEN`. |
| “No cycle data available” | WHOOP account may have no recent data; check the WHOOP app. |

More detail: [WHOOP OAuth](https://developer.whoop.com/docs/developing/oauth), [Getting started](https://developer.whoop.com/docs/developing/getting-started).
