import Link from "next/link";
import { AuthAsideFloats } from "@/components/AuthAsideFloats";

export default function NotEnrolledPage() {
  return (
    <main className="auth-page tech-stage">
      <div className="auth-decor" aria-hidden="true">
        <span className="auth-blob auth-blob-gold" />
        <span className="auth-blob auth-blob-navy" />
        <span className="auth-blob auth-blob-sky" />
      </div>

      <div className="auth-card auth-card-compact">
        <aside className="auth-aside">
          <AuthAsideFloats />
          <div className="auth-aside-inner">
            <p className="auth-aside-kicker">Student Portal</p>
            <h2 className="auth-aside-title">Almost there</h2>
            <p className="auth-aside-copy">
              Once enrolment adds your email, your classes and resources will appear here.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-brand auth-brand-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Vantage Tutoring" className="logo" width={44} height={37} />
            </div>
            <h1 className="auth-title auth-title-center">Not enrolled yet</h1>
            <p className="auth-lead auth-lead-center">
              This email is not on a Vantage class list. Contact us and we will add you.
            </p>
            <a href="mailto:hello@vantagetutoring.com.au" className="btn btn-primary btn-block">
              Email enrolment
              <span aria-hidden="true">→</span>
            </a>
            <div style={{ marginTop: "0.85rem" }}>
              <Link href="/login" className="btn btn-ghost btn-block">
                Try another account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
