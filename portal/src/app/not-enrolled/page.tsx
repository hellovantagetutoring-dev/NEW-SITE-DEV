import Link from "next/link";

export default function NotEnrolledPage() {
  return (
    <div className="shell" style={{ maxWidth: 520, paddingTop: "3rem" }}>
      <h1 className="section-title">Not enrolled</h1>
      <p className="muted" style={{ lineHeight: 1.5, marginBottom: "1.25rem" }}>
        This email is not on a Vantage class list yet. Contact us and we will add you.
      </p>
      <p style={{ marginBottom: "1.25rem" }}>
        <a href="mailto:hello@vantagetutoring.com.au">hello@vantagetutoring.com.au</a>
      </p>
      <Link href="/login" className="btn btn-ghost">
        Try another account
      </Link>
    </div>
  );
}
