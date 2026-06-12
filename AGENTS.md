# fnsprites — Maintenance Notes

## Sprite data

- **Date:** 2026-06-11
- **Sprites imported:** 53 total (31 released, 22 unreleased)
- **Source:** https://github.com/staticvacant/fnsprites

## Weekly check

Every ~7 days, check if the original repo has new commits:

```
git fetch upstream 2>/dev/null || git remote add upstream https://github.com/staticvacant/fnsprites.git
git fetch upstream
git log HEAD..upstream/main --oneline -- src/sprites-data.js
```

If new sprite data exists:

1. Merge **only** `src/sprites-data.js`:
   ```
   git checkout -b merge-upstream upstream/main -- src/sprites-data.js
   git checkout main
   git merge merge-upstream
   ```
   The only diff from upstream is `export const` vs `const` on line 1 — resolve by keeping `export const`.
2. Add any new sprite PNGs from upstream's `public/sprites/`.
3. Do **not** merge: i18n files, app.js, HTML, CSS, or any branding. Only sprite data and UI structure improvements (new themes, layout fixes, design changes) that are independent of i18n and authorship.

## Rules for upstream merges

- Never overwrite `src/i18n/`, `src/app.js`, `src/share-utils.js`, `index.html`, `vite.config.js`, `package.json`.
- Do not reference the original author (`staticvacant`, `Rick`) in any UI text or comments.
- After merging data, rebuild: `npm run build && git add docs/ && git commit -m "Merge sprite updates from upstream"`
