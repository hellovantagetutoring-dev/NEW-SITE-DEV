"use client";

import { useEffect, useState } from "react";

export function PdfPreview({
  fileId,
  label,
}: {
  fileId: string;
  label: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<"continuous" | "fit">("continuous");
  const [failed, setFailed] = useState(false);
  const src = `/api/download/${fileId}?inline=1#toolbar=0&navpanes=0`;

  useEffect(() => {
    setFailed(false);
    setZoom(100);
  }, [fileId]);

  return (
    <div className="pdf-preview">
      <div className="pdf-preview-toolbar">
        <span className="pdf-preview-label">{label}</span>
        <div className="pdf-preview-controls">
          <label className="pdf-zoom">
            <span className="muted">Zoom</span>
            <input
              type="range"
              min={70}
              max={160}
              step={5}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
            />
            <span>{zoom}%</span>
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
          <a
            className="btn btn-ghost"
            href={`/api/download/${fileId}`}
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}
            title="Download"
          >
            Download
          </a>
        </div>
      </div>

      <div className={`pdf-preview-stage${mode === "fit" ? " is-fit" : ""}`}>
        {!failed ? (
          <div
            className="pdf-preview-frame-wrap"
            style={{ width: mode === "fit" ? "100%" : `${zoom}%` }}
          >
            <iframe
              key={fileId}
              className="pdf-preview-frame"
              title={label}
              src={src}
              onError={() => setFailed(true)}
            />
          </div>
        ) : (
          <div className="pdf-preview-fallback">
            <p className="muted">
              Preview could not load in this browser. Use Download to open the PDF.
            </p>
            <a className="btn btn-primary" href={`/api/download/${fileId}`}>
              Download {label}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
