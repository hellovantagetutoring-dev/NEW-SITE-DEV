# Revert: restore Assignment Review as a service

Backup taken before removing Assignment Review from public marketing and enquiry flows.

## What Assignment Review was

Standalone written feedback on any assessment piece:

- **$30** for 72-hour turnaround
- **$50** for 24-hour turnaround
- Feedback from a tutor who scored full marks on that assignment type
- 30-minute post-feedback call included

## Restore all files

From the repository root:

```bash
BACKUP="_preview-backups/assignment-review-before-hide"
rsync -a --exclude 'REVERT.md' "$BACKUP"/ ./
```

## What was backed up

- `index.html` — homepage Extras plan card + services teaser card
- `services/index.html` — full Assignment Review service card + meta
- `contact/index.html` — enquiry type + `routeAssignment` form panel
- `about/index.html` — FAQ answer mentioning Assignment Review pricing
- `legal/index.html` — privacy/terms mentions + refund bullet
- `assets/main.js` — enquiry routing maps for Assignment review / `?type=assignment`

## After restore

Bump `main.js?v=` on contact (and any other pages that load the form) so browsers pick up the restored routing.
