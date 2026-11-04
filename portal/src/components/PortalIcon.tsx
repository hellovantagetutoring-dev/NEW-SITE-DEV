import type { ReactNode } from "react";

/** Soft SF Symbols–style glyphs for portal chrome (inline SVG, currentColor). */

export type PortalIconName =
  | "home"
  | "calendar"
  | "admin"
  | "private"
  | "masterclass"
  | "library"
  | "ucat"
  | "progress"
  | "lock"
  | "book"
  | "pack"
  | "session"
  | "consult"
  | "dropbox"
  | "spark";

const PATHS: Record<PortalIconName, ReactNode> = {
  home: (
    <path
      d="M4.5 10.2 12 3.8l7.5 6.4V19a1.2 1.2 0 0 1-1.2 1.2h-4.1v-5.2h-4.4V20.2H5.7A1.2 1.2 0 0 1 4.5 19Z"
      fill="currentColor"
    />
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2.5" fill="currentColor" opacity="0.2" />
      <path
        d="M7 4.5v3M17 4.5v3M4.5 9.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="4" y="6" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="8" r="3.2" fill="currentColor" />
      <path d="M5 19.2c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  private: (
    <>
      <circle cx="8.5" cy="9" r="2.6" fill="currentColor" />
      <circle cx="15.5" cy="9" r="2.6" fill="currentColor" />
      <path
        d="M3.8 18.5c.7-2.8 2.7-4.3 5.2-4.3 1.3 0 2.4.4 3.3 1.1.9-.7 2-1.1 3.3-1.1 2.5 0 4.5 1.5 5.2 4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  masterclass: (
    <>
      <path d="M4 8.5 12 4.5 20 8.5 12 12.5 4 8.5Z" fill="currentColor" />
      <path d="M6.5 10.2V15c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.8" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </>
  ),
  library: (
    <>
      <rect x="4" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" />
      <rect x="9.9" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" opacity="0.7" />
      <rect x="15.8" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" opacity="0.45" />
    </>
  ),
  ucat: (
    <>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M12 7.5v5l3.2 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  progress: (
    <>
      <path d="M5 16.5 9.2 11l3.2 3.1L19 7.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14.5 7.5H19V12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  lock: (
    <>
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" fill="currentColor" />
      <path d="M8.8 10.5V8.2a3.2 3.2 0 0 1 6.4 0v2.3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  book: (
    <path
      d="M5 6.2A2.2 2.2 0 0 1 7.2 4h4.3v14.5H7.4A2.4 2.4 0 0 0 5 20.9V6.2Zm14 0A2.2 2.2 0 0 0 16.8 4H12.5v14.5h4.1a2.4 2.4 0 0 1 2.4 2.4V6.2Z"
      fill="currentColor"
    />
  ),
  pack: (
    <>
      <rect x="5" y="7" width="14" height="11.5" rx="2.2" fill="currentColor" />
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </>
  ),
  session: (
    <>
      <circle cx="12" cy="12" r="7.6" stroke="currentColor" strokeWidth="1.8" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="7.6" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M12 8.2v4.2l2.8 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  consult: (
    <>
      <path
        d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v5A2.5 2.5 0 0 1 16.5 15H13l-3.2 3.2V15H7.5A2.5 2.5 0 0 1 5 12.5v-5Z"
        fill="currentColor"
      />
    </>
  ),
  dropbox: (
    <>
      <path d="M12 4.5 6.5 8 12 11.5 17.5 8 12 4.5Z" fill="currentColor" />
      <path d="M6.5 12.2 12 15.7l5.5-3.5L12 8.7 6.5 12.2Z" fill="currentColor" opacity="0.55" />
      <path d="M6.5 15.2 12 19.5l5.5-4.3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  spark: (
    <path
      d="M12 3.5 13.6 9.2 19.5 11 13.6 12.8 12 18.5 10.4 12.8 4.5 11 10.4 9.2 12 3.5Z"
      fill="currentColor"
    />
  ),
};

export function PortalIcon({
  name,
  size = 20,
  className,
}: {
  name: PortalIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export function IconWell({
  name,
  tone = "gold",
  size = "md",
}: {
  name: PortalIconName;
  tone?: "gold" | "navy" | "sky" | "rose" | "mint" | "violet" | "coral";
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  return (
    <span className={`icon-well icon-well-${tone} icon-well-${size}`} aria-hidden="true">
      <PortalIcon name={name} size={px} />
    </span>
  );
}
