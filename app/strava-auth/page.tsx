import Link from "next/link";

export default function StravaAuthPage() {
  const hasClientId = !!process.env.STRAVA_CLIENT_ID;
  const hasClientSecret = !!process.env.STRAVA_CLIENT_SECRET;

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 space-y-6">
      <h1 className="text-xl font-semibold">Connect Strava</h1>
      <p className="text-foreground/80 text-sm">
        Get fresh Strava access and refresh tokens using OAuth in this app.
      </p>

      {!hasClientId || !hasClientSecret ? (
        <div className="bg-foreground/10 border border-card-border p-4 rounded">
          <p className="text-sm font-medium mb-2">Missing configuration</p>
          <p className="text-sm text-foreground/80">
            Add <code className="bg-foreground/10 px-1 rounded">STRAVA_CLIENT_ID</code> and{" "}
            <code className="bg-foreground/10 px-1 rounded">STRAVA_CLIENT_SECRET</code> to your{" "}
            <code className="bg-foreground/10 px-1 rounded">.env.local</code> file, then restart the dev server.
          </p>
          <p className="text-sm text-foreground/70 mt-2">
            In the Strava dashboard, set your app callback URL to:
          </p>
          <p className="text-xs font-mono mt-1 break-all bg-foreground/10 p-2 rounded">
            http://localhost:3000/api/strava/oauth/callback
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground/70">
            Click below to sign in with Strava and grant <code className="bg-foreground/10 px-1 rounded">activity:read_all</code>.
            Then copy tokens into <code className="bg-foreground/10 px-1 rounded">.env.local</code>.
          </p>
          <Link
            href="/api/strava/oauth/authorize"
            className="inline-block px-4 py-2 bg-foreground text-background font-medium rounded hover:opacity-90"
          >
            Connect Strava
          </Link>
        </>
      )}

      <p className="text-xs text-foreground/50">
        <Link href="/" className="underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
