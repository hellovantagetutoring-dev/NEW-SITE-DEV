Landing page redesign preview — undo instructions
================================================

Branch: landing/premium-edu-preview

Local preview:
  python3 -m http.server 8765
  open http://127.0.0.1:8765/

Undo this landing redesign only:
  cp _preview-backups/landing-before-edu/index.html index.html
  rm -f assets/home-landing.css

Full CSS restore (only if needed):
  cp _preview-backups/landing-before-edu/styles.css assets/styles.css

Switch back to previous branch:
  git checkout cursor/tutor-avail-and-filters
