# Revert Contour-inspired homepage pass

One command from the repo root restores the homepage to the state before this pass:

```bash
BACKUP="_preview-backups/contour-pass"
cp -a "$BACKUP/index.html" ./index.html
cp -a "$BACKUP/assets/home-landing.css" ./assets/home-landing.css
cp -a "$BACKUP/assets/main.js" ./assets/main.js
rm -f ./assets/contour-pass.css
```

Then hard-refresh the homepage.

## What this pass added
- Announcement pill under the nav (free consultation CTA)
- Contour-style trust strip (sentence labels under big numbers)
- “Where effort meets excellence” ecosystem band
- “The Vantage offering” pathway cards (replaces the old 01/02/03 services strip)
- Dark “How Vantage students progress” survey band
- Sticky mobile CTA bar (Book a call / Enrol)
- Styles in `assets/contour-pass.css` (homepage only via `body.contour-pass`)
