import { IconWell, PortalIcon, type PortalIconName } from "@/components/PortalIcon";
import { marketingEnrolUrl, type EnrolProgram } from "@/lib/enrol-links";

const GATE_META: Record<
  EnrolProgram,
  { icon: PortalIconName; tone: "sky" | "gold" | "violet" | "coral" }
> = {
  private: { icon: "private", tone: "sky" },
  masterclass: { icon: "masterclass", tone: "gold" },
  ucat: { icon: "ucat", tone: "violet" },
};

export function ProgramGate({
  title,
  body,
  program,
}: {
  title: string;
  body: string;
  program: EnrolProgram;
}) {
  const meta = GATE_META[program] || GATE_META.private;
  return (
    <div className={`program-gate program-gate-${program}`}>
      <div className="program-gate-head">
        <IconWell name={meta.icon} tone={meta.tone} size="lg" />
        <span className="pill pill-locked">
          <PortalIcon name="lock" size={14} />
          Restricted
        </span>
      </div>
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
