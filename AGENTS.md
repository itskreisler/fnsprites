# fnsprites — Maintenance Notes

## IMPORTANTE: Términos, Privacidad

> El sitio incluye pie de página con aviso de "tracker no oficial" y dos páginas
> legales: `privacy.html` y `terms.html` (bilingües).

- La traducción de estas páginas vive en `src/i18n/langs/es.js` y `en.js`.
- Nuestro fork usa **código de creador `KLEI`** (nunca `BATTER`): botones del
  footer, links de `item-shop` (`creator-code=klei`), cadenas fallback en JS y
  texto de UI. `support.*` y `creator.code` en i18n usan `KLEI`.

## Sprite data

- **Date:** 2026-09-24
- **Sprites released:** 218 total
- **Temporada Override (C7S4):** 101 sprites (101 released, 0 unreleased)
- **PNGs on disk:** 223 en `sprites/{id}.png` (un PNG por `id`, coincide con `sprites-data.js`)
- **Fuente upstream:** `https://rickventure.com` (Rick's Tracker) — no usar fortnite.gg para scraping.

## Fuente upstream (rickventure.com)

Es la fuente primaria de sprites y códigos:

- Data: `https://rickventure.com/sprites-data.js` y `https://rickventure.com/codes-data.js`
- Imágenes: `https://rickventure.com/sprites/{id}.png` (PNG directo, ya no requiere conversión webp)

### Temas conocidos upstream

Basic, Gold, Candy, Galaxy, Gem, Holofoil, Cube, Rift, Quack, Cheat, **Hacker**, **Bounty**
(a estas les llamamos "variantes"). En season 3 upstream usa además `reaper` y
`tricktreat`. IDs de variante usan sufijo (ej. `bush_hacker`).

## Weekly check

Revisar cada ~7 días si rickventure agregó sprites o códigos nuevos:

```
curl -s https://rickventure.com/sprites-data.js -o /tmp/rick_sprites.js   # comparar vs sprites-data.js
curl -s https://rickventure.com/codes-data.js  -o /tmp/rick_codes.js      # comparar vs codes-data.js
node --check /tmp/rick_sprites.js && node --check /tmp/rick_codes.js
```

## Cómo importar sprites nuevos

1. **Descargar imágenes** desde `https://rickventure.com/sprites/{id}.png`
   a `sprites/{id}.png`. Validar la firma PNG (`89504e470d0a1a0a`) antes de guardarlas.
2. **Actualizar `sprites-data.js`** (repo root, script global `const baseSprites`, sin ESM).
   - Seguir nuestra convención de nombres: variantes con nombre descriptivo
     ("Gold X", "Cheat Master X", "Loot Hacker X"), basic solo el nombre.
   - Variantes no-basic usan `rarity: "Special"` (el tema define el color). El
     basic lleva su rarity real (Rare/Epic/Legendary/Mythic).
   - Campo `season` con el nombre de temporada. La temporada actual es `"Override"`.
   - Los no lanzados llevan `unreleased: true`.
3. **Cuando el upstream trae un tema nuevo** (ej. `Hacker`) hay que registrarlo en 4 lugares:
   - `app.js`: `THEME_ORDER` (orden), `UI_THEME_LABELS` + `EXPORT_THEME_LABELS` +
     `TRADE_THEME_LABELS` (etiqueta visible), y el mapa `themes` de `getRarityGradient`.
   - `styles.css`: `.rarity-Special.theme-X .card-display` (gradiente), su versión
     `body.low-fidelity ...`, y opcionalmente un bloque `.card.theme-X`.
   - `src/i18n/langs/es.js` y `en.js`: clave `theme.X` (y `de.js` si existe).
   - Recordar que `klei.js` lee `t('theme.' + themeKey)` para las opciones del filtro,
     así que si falta la clave i18n el select queda vacío.
4. **Verificar gap de imágenes**: todo `sprite.id` debe tener `sprites/{id}.png`.
5. **Validar**: `node --check` de los archivos JS y un conteo por temporada
   (released/total) tras aplicar los cambios.

### Rarities: si upstream y nosotros discrepamos

Preferir el rarity de rickventure (ej. killswitch/xray = Legendary). Para
variantes seguir usando `Special` con el tema, es nuestra convención.

## Cómo importar códigos nuevos

1. Descargar `codes-data.js` de rickventure y fusionar a `codes-data.js` (repo root, global script).
2. **Dedupe**: rickventure a veces trae códigos duplicados (`ChatWhereDoYouFindTheKey`
   apareció 2 veces) — eliminar duplicados, su app no los filtra.
3. Validar `node --check` y que cada `internalreward` exista en `sprites-data.js`.

## Reglas generales

- Nunca convertir los archivos de datos a ESM; cargan como scripts globales.
- No sobrescribir: `src/i18n/`, `src/klei.js`, `src/klei-codes.js`, `src/i18n/dom.js`.
- No citar al autor original (`staticvacant`, `Rick`) en UI ni comentarios.
- Reemplazar `staticvacant.github.io/fnsprites` por `itskreisler.github.io/fnsprites`
  en todos los archivos (agregado de branding). Mantener `removeStaticvacantBranding()`
  en `klei.js` como red de seguridad.
- Después de importar, commit directo (sin build local).

## Deploy a GitHub Pages

**No hay build local ni carpeta `docs/`.** El deploy lo hace el workflow
`.github/workflows/deploy.yml` con cada push a `main`:

```bash
git push origin main
```

También se puede disparar manual (Actions → Deploy to GitHub Pages → Run workflow).
No ejecutar `npm run build`, no crear `scripts/deploy.sh`.

## Dev local (móvil/termux)

```
pm2 start uv --name fnsprites -- run python -m http.server 8080 --bind 0.0.0.0 --directory /root/Dev/fnsprites
# abrir desde el mismo dispositivo: http://127.0.0.1:8080  (termux-open-url)
# estado/stop: pm2 status | pm2 stop fnsprites
```

No usar `servor` (muere por `uv_interface_addresses`/error 13 en proot).