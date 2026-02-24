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

## Step 5: Production deployment (Vercel or other hosts)

To make WHOOP work on your live site:

### 1. Add the production redirect URI in WHOOP

1. Go to **https://developer-dashboard.whoop.com/** → your app → edit.
2. Under **Redirect URI(s)**, add your production URL’s callback (exact path matters):
   - **Vercel**: `https://<your-project>.vercel.app/api/whoop/oauth/callback`  
     (Replace `<your-project>` with your Vercel project URL, e.g. `my-dashboard`. If you use a custom domain, use that host instead.)
   - **Other hosts**: `https://your-domain.com/api/whoop/oauth/callback`
3. Save.

### 2. Add environment variables in your host

In your hosting dashboard (e.g. **Vercel** → Project → **Settings** → **Environment Variables**), add the same variables you use locally. For **Production** (and optionally Preview if you want WHOOP on preview URLs), set:

| Variable | Value | Required |
|----------|--------|----------|
| `WHOOP_CLIENT_ID` | Same as in .env.local | Yes |
| `WHOOP_CLIENT_SECRET` | Same as in .env.local | Yes |
| `WHOOP_ACCESS_TOKEN` | See step 3 below | Yes (or get in step 3) |
| `WHOOP_REFRESH_TOKEN` | From /whoop-auth success page | Recommended (auto-refresh) |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://my-dashboard.vercel.app` | Optional; use if you have a custom domain or OAuth redirect issues |

You can paste your local values for `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET`. Leave `WHOOP_ACCESS_TOKEN` and `WHOOP_REFRESH_TOKEN` empty for now if you prefer to get them from the live site (step 3).

### 3. Get a token on the live site

1. Deploy (or redeploy) so the new env vars are applied.
2. Open your **production** URL in the browser:  
   **https://&lt;your-site&gt;/whoop-auth**
3. Click **Connect WHOOP**, sign in, and approve. You’ll be redirected back to the success page on your live site.
4. Copy the **access token** (and the **refresh token** if shown).
5. In your host’s **Environment Variables**, set:
   - `WHOOP_ACCESS_TOKEN` = the access token you just copied  
   - `WHOOP_REFRESH_TOKEN` = the refresh token you copied (recommended)
6. **Redeploy** so the new tokens are used. The WHOOP card on the live site should then work.

### 4. Optional: Custom domain

If you use a custom domain (e.g. `https://dashboard.mycompany.com`):

- Add the redirect URI `https://dashboard.mycompany.com/api/whoop/oauth/callback` in the WHOOP app settings.
- Set `NEXT_PUBLIC_APP_URL=https://dashboard.mycompany.com` in your host’s env vars so the OAuth callback uses the correct URL.
- Redeploy, then run the flow again at `https://dashboard.mycompany.com/whoop-auth` and put the new tokens into env vars.

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
| 401 Unauthorized from WHOOP | Token expired. If `WHOOP_REFRESH_TOKEN` is set, the app will auto-refresh. Otherwise get a new token from /whoop-auth and update `WHOOP_ACCESS_TOKEN`. |
| “No cycle data available” | WHOOP account may have no recent data; check the WHOOP app. |

More detail: [WHOOP OAuth](https://developer.whoop.com/docs/developing/oauth), [Getting started](https://developer.whoop.com/docs/developing/getting-started).
