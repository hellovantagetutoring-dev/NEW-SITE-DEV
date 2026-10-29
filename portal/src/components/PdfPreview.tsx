"use client";

import { useEffect, useRef, useState } from "react";

type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};

export function PdfPreview({
  fileId,
  label,
}: {
  fileId: string;
  label: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PdfDoc | null>(null);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<"continuous" | "fit">("continuous");
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [renderKey, setRenderKey] = useState(0);
  const [fitPct, setFitPct] = useState(100);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPageCount(0);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // CDN worker avoids Next/Turbopack bundling issues with the pdf.js worker.
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const res = await fetch(`/api/download/${fileId}?inline=1`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("load failed");
        const data = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;

        if (docRef.current) await docRef.current.destroy().catch(() => undefined);
        const doc = (await pdfjs.getDocument({ data }).promise) as unknown as PdfDoc;
        if (cancelled) {
          await doc.destroy().catch(() => undefined);
          return;
        }
        docRef.current = doc;
        setPageCount(doc.numPages);
        setStatus("ready");
        setRenderKey((k) => k + 1);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      docRef.current?.destroy().catch(() => undefined);
      docRef.current = null;
    };
  }, [fileId]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRenderKey((k) => k + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (status !== "ready" || !docRef.current || !pagesRef.current || !stageRef.current) return;
    const doc = docRef.current;
    const host = pagesRef.current;
    const stage = stageRef.current;
    let cancelled = false;

    (async () => {
      host.replaceChildren();
      const first = await doc.getPage(1);
      const unit = first.getViewport({ scale: 1 });
      const available = Math.max(260, stage.clientWidth - 28);
      const fitScale = available / unit.width;
      const cssScale = mode === "fit" ? fitScale : zoom / 100;
      if (!cancelled) setFitPct(Math.round(fitScale * 100));

      const dpr = window.devicePixelRatio || 1;

      for (let n = 1; n <= doc.numPages; n++) {
        if (cancelled) return;
        const pdfPage = await doc.getPage(n);
        const layout = pdfPage.getViewport({ scale: cssScale });
        const renderVp = pdfPage.getViewport({ scale: cssScale * dpr });
        const canvas = document.createElement("canvas");
        canvas.className = "pdf-preview-page";
        canvas.width = Math.floor(renderVp.width);
        canvas.height = Math.floor(renderVp.height);
        canvas.style.width = `${Math.floor(layout.width)}px`;
        canvas.style.height = `${Math.floor(layout.height)}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        host.appendChild(canvas);
        await pdfPage.render({ canvasContext: ctx, viewport: renderVp }).promise;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, mode, zoom, renderKey, pageCount]);

  const shownZoom = mode === "fit" ? fitPct : zoom;

  return (
    <div className="pdf-preview">
      <div className="pdf-preview-toolbar">
        <span className="pdf-preview-label">
          {label}
          {pageCount ? ` · ${pageCount} pages` : ""}
        </span>
        <div className="pdf-preview-controls">
          <label className="pdf-zoom">
            <span className="muted">Zoom</span>
            <input
              type="range"
              min={60}
              max={180}
              step={5}
              value={mode === "fit" ? shownZoom : zoom}
              onChange={(e) => {
                setMode("continuous");
                setZoom(Number(e.target.value));
              }}
              aria-label="Zoom"
            />
            <span>{shownZoom}%</span>
          </label>
          <div className="tabs" role="tablist" aria-label="Preview mode">
            <button
              type="button"
              className="tab"
              data-active={mode === "continuous"}
              onClick={() => setMode("continuous")}
            >
              Continuous
            </button>
            <button
              type="button"
              className="tab"
              data-active={mode === "fit"}
              onClick={() => setMode("fit")}
            >
              Fit width
            </button>
          </div>
        </div>
      </div>

      <div ref={stageRef} className="pdf-preview-stage">
        {status === "loading" && <p className="muted pdf-preview-status">Loading preview…</p>}
        {status === "error" && (
          <div className="pdf-preview-fallback">
            <p className="muted">Preview could not load. Use Download above to open the PDF.</p>
          </div>
        )}
        <div ref={pagesRef} className="pdf-preview-pages" hidden={status !== "ready"} />
      </div>
    </div>
  );
}
