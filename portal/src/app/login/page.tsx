"use client";

import { useState } from "react";
import { AuthAsideFloats } from "@/components/AuthAsideFloats";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg className="auth-provider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"ok" | "error">("ok");
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
      setStatusTone("error");
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
      setStatusTone("error");
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
      if (error) {
        setStatusTone("error");
        setStatus(error.message);
      } else {
        setStatusTone("ok");
        setStatus("Check your email for a one-time login link (and spam). Links expire quickly.");
      }
    } catch (err) {
      setBusy(false);
      setStatusTone("error");
      setStatus(err instanceof Error ? err.message : "Login failed. Check .env.local keys.");
    }
  }

  return (
    <main className="auth-page tech-stage">
      <div className="auth-decor" aria-hidden="true">
        <span className="auth-blob auth-blob-gold" />
        <span className="auth-blob auth-blob-navy" />
        <span className="auth-blob auth-blob-sky" />
      </div>

      <div className="auth-card">
        <aside className="auth-aside">
          <AuthAsideFloats />
          <div className="auth-aside-inner">
            <p className="auth-aside-kicker">Student Portal</p>
            <h2 className="auth-aside-title">Welcome back</h2>
            <p className="auth-aside-copy">
              Masterclass resources, private sessions, and your calendar are ready whenever you are.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-brand auth-brand-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Vantage Tutoring" className="logo" width={44} height={37} />
            </div>

            <h1 className="auth-title auth-title-center">Sign in</h1>
            <p className="auth-lead auth-lead-center">
              Use your enrolled Google or school email. No password needed.
            </p>

            <form onSubmit={signInEmail} className="auth-form">
              <label className="field">
                Email address
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu.au"
                />
              </label>
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                Send login link
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="auth-divider">or</div>

            <div className="auth-oauth">
              <button
                type="button"
                className="btn btn-ghost btn-oauth btn-block"
                disabled={busy}
                onClick={signInGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>

            {status && (
              <p className="auth-status" data-tone={statusTone}>
                {status}
              </p>
            )}

            <p className="auth-help">
              Having trouble signing in?
              <br />
              <a href="mailto:hello@vantagetutoring.com.au">hello@vantagetutoring.com.au</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
