"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReleaseSolutionsButton({ fileId }: { fileId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function release() {
    setBusy(true);
    await fetch("/api/admin/release-solutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}
      disabled={busy}
      onClick={release}
    >
      {busy ? "Releasing…" : "Release solutions"}
    </button>
  );
}
