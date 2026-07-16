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

## Download sprites from fortnite.gg

Source: `https://fortnite.gg/sprites?id=2288688` (Paxo's Sprites)

### Step 1: Scrape sprite data

```bash
node -e "
const { RequestService, jQuery } = require('@kreisler/js-scraper');
(async () => {
  const html = await RequestService.fetchData({
    url: 'https://fortnite.gg/sprites?id=2288688',
    method: 'GET', timeout: 30000, retries: 3
  });
  const doc = jQuery(html).document;
  const cards = doc.querySelectorAll('.sprite-card');
  cards.forEach(card => {
    const parent = card.getAttribute('data-parent');
    const variant = card.getAttribute('data-variant');
    const rarity = card.getAttribute('data-rarity');
    const img = card.querySelector('img');
    const src = img ? img.getAttribute('src') : '';
    console.log(parent + '|' + variant + '|' + rarity + '|' + src);
  });
})();
" > /tmp/sprites_list.txt
```

### Step 2: Download and convert images

```bash
BASE="https://fortnite.gg/img/x/sprites/icons"
# Format: output_name|fortnite_filename.webp
SPRITES=(
  "batman_basic|T_Icon_BR_FossilMeal_Default_L.webp"
  "batman_gold|T_Icon_BR_FossilMeal_Gold_L.webp"
  # ... add more
)

mkdir -p /tmp/sprite_download
for entry in \"\${SPRITES[@]}\"; do
  IFS='|' read -r name file <<< \"\$entry\"
  curl -sL -o \"/tmp/sprite_download/\${name}.webp\" \"\$BASE/\$file\"
  HEADER=$(xxd -l 4 -p \"/tmp/sprite_download/\${name}.webp\")
  if [ \"\$HEADER\" = \"52494646\" ]; then
    dwebp \"/tmp/sprite_download/\${name}.webp\" -o \"public/sprites/\${name}.png\" -quiet
    echo \"OK: \$name\"
  else
    echo \"INVALID: \$name\"
  fi
done
```

### Step 3: Update sprites-data.js

Add entries with naming convention: `{name}_{theme}` (e.g., `batman_basic`, `batman_gold`).

Rarity mapping from fortnite.gg:
- `mythic` → Mythic
- `legendary` → Legendary
- `epic` → Epic
- `rare` → Rare
- `special` → Special (variants: Gold, Candy/Gummy, Galaxy, Holofoil, Gem, etc.)

### Notes

- `RequestService.fetchData` returns string (HTML), not buffer. Use `curl` for binary downloads.
- Validate WebP header: first 4 bytes must be `52494646` (RIFF).
- Convert webp → png with `dwebp` (libwebp tools).
- Fortnite.gg has 148 sprites total (as of 2026-07-16).

## Deploy to GitHub Pages

GitHub Pages serves from `docs/` folder on `main` branch.

### Quick deploy

```bash
./scripts/deploy.sh
```

### Manual deploy

```bash
# 1. Build
npm run build

# 2. Stage docs/
git add docs/

# 3. Commit
git commit -m "Build: update GitHub Pages"

# 4. Push
git push origin main
```

### Deploy script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Staging docs/"
git add docs/

if git diff --cached --quiet; then
  echo "No changes to deploy"
  exit 0
fi

echo "Committing..."
git commit -m "Build: update GitHub Pages"

echo "Pushing..."
git push origin main

echo "Deployed! https://itskreisler.github.io/fnsprites/"
```

Make executable: `chmod +x scripts/deploy.sh`
