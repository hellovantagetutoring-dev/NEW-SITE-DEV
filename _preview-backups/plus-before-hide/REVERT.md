# Revert: restore Vantage Plus marketing

Backup taken before hiding Vantage Plus from the public site and folding its benefits into Platinum.

## Restore all files

From the repository root:

```bash
BACKUP="_preview-backups/plus-before-hide"
rsync -a --exclude 'REVERT.md' "$BACKUP"/ ./
```

## What was backed up

- `index.html`
- `404.html`, `404/index.html`
- `about/index.html`
- `bring-a-friend/index.html`
- `careers/index.html`
- `contact/index.html`
- `legal/index.html`
- `past-papers/index.html`
- `plus/index.html`
- `rates/index.html`
- `reviews/index.html`
- `services/index.html`
- `tutors/index.html`
- `vantage-ai/index.html`
- `assets/main.js`

## After hide (current state summary)

- Plus removed from site navigation
- Standalone Plus pricing/card/section removed from rates & services
- Platinum messaging includes Vantage AI, Chemistry masterclasses (watch anytime), and retrieval
- `/plus` page left in place but CTAs steered to Platinum
