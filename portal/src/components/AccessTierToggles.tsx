"use client";

import { useId } from "react";
import { type AccessToggles, tierFromToggles } from "@/lib/access-tier";

export function AccessTierToggles({
  value,
  onChange,
  name = "tier",
  legend = "Gated access",
  compact = false,
}: {
  value: AccessToggles;
  /** Partial patch so parents can merge against latest state (multi-toggle safe). */
  onChange: (patch: Partial<AccessToggles>) => void;
  /** Hidden input name for form posts that still expect a tier string */
  name?: string;
  legend?: string;
  compact?: boolean;
}) {
  const id = useId();
  const tier = tierFromToggles(value);

  return (
    <fieldset className={`access-tier-toggles${compact ? " access-tier-toggles-compact" : ""}`}>
      {legend ? <legend>{legend}</legend> : null}
      {name ? <input type="hidden" name={name} value={tier || ""} /> : null}
      <div className="access-tier-row">
        <label className="switch-field" htmlFor={`${id}-mc`}>
          <span className="switch">
            <input
              id={`${id}-mc`}
              type="checkbox"
              checked={value.masterclass}
              onChange={(e) => onChange({ masterclass: e.target.checked })}
            />
            <span className="switch-track" aria-hidden="true" />
          </span>
          <span className="switch-copy">
            <strong>Masterclass</strong>
            {!compact && <span className="muted">Subject libraries, solutions, recordings</span>}
          </span>
        </label>
        <label className="switch-field" htmlFor={`${id}-p11`}>
          <span className="switch">
            <input
              id={`${id}-p11`}
              type="checkbox"
              checked={value.private11}
              onChange={(e) => onChange({ private11: e.target.checked })}
            />
            <span className="switch-track" aria-hidden="true" />
          </span>
          <span className="switch-copy">
            <strong>Private 1-1</strong>
            {!compact && (
              <span className="muted">Pairs + Resource Library; Masterclass stays separate</span>
            )}
          </span>
        </label>
      </div>
    </fieldset>
  );
}
