"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReleaseSolutionsButton({
  fileId,
  released,
}: {
  fileId: string;
  released: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch("/api/admin/release-solutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, release: !released }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      className={`btn btn-compact ${released ? "btn-ghost" : "btn-primary"}`}
      disabled={busy}
      onClick={toggle}
      title={
        released
          ? "Hide worked solutions again (Private 1-1 stays locked until tutor release)"
          : "Make worked solutions available to enrolled students"
      }
    >
      {busy
        ? released
          ? "Unreleasing…"
          : "Releasing…"
        : released
          ? "Unrelease solutions"
          : "Release solutions"}
    </button>
  );
}
