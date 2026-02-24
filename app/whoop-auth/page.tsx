import Link from "next/link";

export default function WhoopAuthPage() {
  const hasClientId = !!process.env.WHOOP_CLIENT_ID;
  const hasClientSecret = !!process.env.WHOOP_CLIENT_SECRET;

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 space-y-6">
      <h1 className="text-xl font-semibold">Connect WHOOP</h1>
      <p className="text-foreground/80 text-sm">
        Get an access token for your dashboard using WHOOP's OAuth — no Postman or other tools needed.
      </p>

      {!hasClientId || !hasClientSecret ? (
        <div className="bg-foreground/10 border border-card-border p-4 rounded">
          <p className="text-sm font-medium mb-2">Missing configuration</p>
          <p className="text-sm text-foreground/80">
            Add <code className="bg-foreground/10 px-1 rounded">WHOOP_CLIENT_ID</code> and{" "}
            <code className="bg-foreground/10 px-1 rounded">WHOOP_CLIENT_SECRET</code> to your{" "}
            <code className="bg-foreground/10 px-1 rounded">.env.local</code> file (from the WHOOP Developer Dashboard), then restart the dev server.
          </p>
          <p className="text-sm text-foreground/70 mt-2">
            In the WHOOP dashboard, set your app's <strong>Redirect URI</strong> to:
          </p>
          <p className="text-xs font-mono mt-1 break-all bg-foreground/10 p-2 rounded">
            http://localhost:3000/api/whoop/oauth/callback
          </p>
          <p className="text-xs text-foreground/60 mt-2">
            If you deploy, add your production URL too (e.g. https://your-app.vercel.app/api/whoop/oauth/callback).
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground/70">
            Click below to sign in with WHOOP and grant this app access. You'll get an access token to paste into <code className="bg-foreground/10 px-1 rounded">.env.local</code>.
          </p>
          <Link
            href="/api/whoop/oauth/authorize"
            className="inline-block px-4 py-2 bg-foreground text-background font-medium rounded hover:opacity-90"
          >
            Connect WHOOP
          </Link>
        </>
      )}

      <p className="text-xs text-foreground/50">
        <Link href="/" className="underline">Back to dashboard</Link>
      </p>
    </div>
  );
}
