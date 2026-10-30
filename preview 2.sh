#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8765}"
HOST="${HOST:-127.0.0.1}"

cd "$ROOT"

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Preview already running at http://${HOST}:${PORT}/"
  exit 0
fi

echo "Starting Vantage local preview…"
echo "  Home:    http://${HOST}:${PORT}/"
echo "  Tutors:  http://${HOST}:${PORT}/tutors/"
echo "  Contact: http://${HOST}:${PORT}/contact/"
echo ""
echo "Stop with Ctrl+C"

# Serve with no-cache so HTML edits show up when navigating between pages
exec python3 - <<PY
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

httpd = ThreadingHTTPServer(("${HOST}", ${PORT}), partial(NoCacheHandler, directory=r"${ROOT}"))
print(f"Serving HTTP on ${HOST} port ${PORT} (no-cache)…")
httpd.serve_forever()
PY
