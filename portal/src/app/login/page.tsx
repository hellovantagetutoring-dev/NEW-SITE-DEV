"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function signInGoogle() {
    setBusy(true);
    setStatus("");
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setStatus(error.message);
      setBusy(false);
    }
  }

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!url || !key || url.includes("YOUR_PROJECT") || key.includes("your_anon")) {
      setBusy(false);
      setStatus(
        "Supabase keys are missing. Open portal/.env.local and paste your Project URL and anon key from Supabase → Project Settings → API, then restart npm run dev."
      );
      return;
    }
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      setBusy(false);
      setStatus(
        error
          ? error.message
          : "Check your email for a one-time login link (and spam). Links expire quickly."
      );
    } catch (err) {
      setBusy(false);
      setStatus(err instanceof Error ? err.message : "Login failed. Check .env.local keys.");
    }
  }

  return (
    <div className="shell" style={{ maxWidth: 480, paddingTop: "3rem" }}>
      <div className="brand" style={{ marginBottom: "1.25rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={28} height={28} />
        <span>Vantage Tutoring</span>
      </div>
      <h1 className="section-title">Log in</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Use your enrolled Google or school email. No new password.
      </p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={signInGoogle}>
        Continue with Google
      </button>
      <div style={{ margin: "1.25rem 0", color: "var(--muted)", fontSize: "0.85rem" }}>or</div>
      <form onSubmit={signInEmail} style={{ display: "grid", gap: "0.85rem" }}>
        <label className="field">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu.au"
          />
        </label>
        <button type="submit" className="btn btn-ghost" disabled={busy}>
          Email me a login link
        </button>
      </form>
      {status && (
        <p className="muted" style={{ marginTop: "1rem", lineHeight: 1.45 }}>
          {status}
        </p>
      )}
    </div>
  );
}
