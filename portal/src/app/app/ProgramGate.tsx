import { marketingEnrolUrl, type EnrolProgram } from "@/lib/enrol-links";

export function ProgramGate({
  title,
  body,
  program,
}: {
  title: string;
  body: string;
  program: EnrolProgram;
}) {
  return (
    <div className="program-gate">
      <span className="pill pill-locked">Restricted</span>
      <h2>{title}</h2>
      <p className="muted">{body}</p>
      <div className="program-gate-actions">
        <a
          className="btn btn-primary"
          href={marketingEnrolUrl(program)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enrol today
        </a>
        <a className="btn btn-ghost" href="mailto:hello@vantagetutoring.com.au">
          Email us
        </a>
      </div>
    </div>
  );
}
