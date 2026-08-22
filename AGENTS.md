# fnsprites — Maintenance Notes

## IMPORTANTE: Términos, Privacidad y Comunidad

> **PENDIENTE — prioridad alta.** El sitio ya incluye pie de página con aviso de
> "tracker no oficial" y dos páginas legales: `privacy.html` y `terms.html`
> (bilingües, se construyen con Vite multi-página; entradas en
> `vite.config.js` → `build.rollupOptions.input`).

- La traducción de estas páginas vive en `src/i18n/langs/es.js` y `en.js`
  bajo las claves `footer.*` y `pages.*`.
- **Antes de lanzar cualquier propuesta de comunidad se DEBE actualizar**
  `privacy.html` y `terms.html` (contenido y claves i18n) para cubrir las
  nuevas funcionalidades.
- **Próximo paso planificado:** explorar propuestas para crear una comunidad
  alrededor del tracker. Al hacerlo, revisar primero la sección de contenido
  legal/políticas.
- Al añadir más páginas, recordar registrarlas en `rollupOptions.input`.

## Sprite data

- **Date:** 2026-08-22
- **Sprites imported:** 165 total (150 released, 15 unreleased)
- **PNGs on disk:** 170 (incluye 5 extras no activos en data)
- **Source:** https://github.com/staticvacant/fnsprites

## Weekly check

Every ~7 days, check if the original repo has new commits:

```
git fetch upstream 2>/dev/null || git remote add upstream https://github.com/staticvacant/fnsprites.git
git fetch upstream
git log HEAD..upstream/main --oneline -- sprites-data.js codes-data.js
```

If new sprite data exists:

1. Merge **only** data files (paths already match ours at repo root, direct checkout):
   ```
   git checkout upstream/main -- sprites-data.js codes-data.js
   ```
   Both files load as **global scripts** (plain `const`, no ESM exports) — no line-1 fix needed.
   Validate with `node --check sprites-data.js && node --check codes-data.js`.
2. Add any new sprite PNGs from upstream's `public/sprites/`.
3. Do **not** merge: i18n files, app.js, HTML, CSS, or any branding. Only sprite data and UI structure improvements (new themes, layout fixes, design changes) that are independent of i18n and authorship.

## Rules for upstream merges

- Never overwrite `src/i18n/`, `src/klei.js`, `src/klei-codes.js`, `src/i18n/dom.js`.
- Do not reference the original author (`staticvacant`, `Rick`) in any UI text or comments.
- After merging, commit directly (no build step needed).
- Data files (`sprites-data.js`, `codes-data.js`) live at repo root in both repos and load as global scripts — merge them directly, never convert to ESM.

## Branding rules

- All references to `staticvacant.github.io/fnsprites` must be replaced with `itskreisler.github.io/fnsprites` in ALL files (app.js, HTML, JS, README, etc.).
- Creator code is `KLEI`, never `BATTER`. This applies to: footer buttons, `item-shop` links (`creator-code=klei`), fallback strings in JS, and any UI text.
- i18n translations for `creator.code` use `KLEI`. `support.*` keys reference creator code KLEI.
- The `removeStaticvacantBranding()` function in klei.js is a safety net — keep it even after replacing URLs in source files.

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

---

## PRODUCT REQUIREMENT DOCUMENT

**Proyecto:** fnsprites — Tracker de colección de sprites de Fortnite (fan project, no oficial).

### Problem
Los jugadores coleccionan sprites por temporada (variantes: gold, candy, galaxy, holofoil, gem, cube, rift, quack…). No existe forma sencilla de saber qué les falta, seguir el progreso por temporada ni localizar a otros jugadores para intercambiar.

### Target user
Jugadores de Fortnite que coleccionan sprites cosméticos. Usan el tracker en móvil y/o escritorio.

### Core value proposition
- **Colección personal**: marcar sprites obtenidos/masterizados con seguimiento por temporada.
- **Exportación**: PNG/JSON para compartir y respaldar.
- **Comunidad**: publicar "tengo/busco" sprites (posts masivos de hasta 200 sprites), intercambiar con otros jugadores, perfiles públicos y favoritos con contador.

### User stories (priorizadas)
1. Como coleccionista, quiero marcar mis sprites y que se guarde automáticamente en mi navegador. *(DONE)*
2. Como coleccionista, quiero restaurar mi colección en otro dispositivo. *(DONE — nube + cuenta email)*
3. Como jugador, quiero publicar qué sprites tengo y cuáles busco para negociar. *(DONE)*
4. Como jugador, quiero recibir solicitudes de intercambio y notificaciones. *(DONE)*
5. Como jugador, quiero ver el perfil público de otros y pedir sprites. *(DONE)*
6. Como usuario, quiero entrar con email desde cualquier dispositivo (contraseña o magic link). *(DONE)*

### Non-goals
- No vender ni monetizar.
- No afiliación oficial con Epic Games.
- No chat en tiempo real ni DMs (el contacto se coordina fuera del tracker; se pueden reportar publicaciones abusivas).

### Success metrics
- Usuarios activos con colección guardada en nube.
- Intercambios completados por semana.
- Reports abiertos y resueltos por moderadores.

## TECHNICAL REQUIREMENT DOCUMENT

### Stack
- **Build:** Vite (multi-página: `index.html`, `privacy.html`, `terms.html`, `profile.html`), base `/fnsprites/`, salida a `docs/` (GitHub Pages).
- **Lenguaje:** JavaScript plano (ESM). Sin framework.
- **i18n:** `@kreisler/i18n` con claves en `src/i18n/langs/es.js` y `en.js`.
- **Validación:** `zod` (`src/community/schema.js`).
- **Backend:** Supabase (Auth + Postgres con RLS).
- **Alias de import:** `@src` → `src/`.

### Entorno / config
- `.env.local` (gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Plantilla en `.env.example`.
- El cliente Supabase usa la **anon key** (pública). La seguridad real la da **RLS**, nunca la key.
- `supabase.js`: `persistSession: true`, `autoRefreshToken: true`, **`detectSessionInUrl: true`** (imprescindible para magic link).

### Módulos (`src/community/`)
| Módulo | Responsabilidad |
|---|---|
| `supabase.js` | Cliente + flag `isSupabaseConfigured` |
| `db.js` | Capa de datos: auth, posts, favorites, exchanges, reports, notifications, collections |
| `schema.js` | Schemas zod (inputs + respuestas) |
| `ui.js` | Pestaña Comunidad: feed, publicar, mis posts, intercambios, perfil, notifs, mod, UI button |
| `collection-sync.js` | Botones guardar/restaurar nube + upgrade a email |
| `profile-page.js` | Página pública `profile.html?u=<id>` |
| `modal.js` | Modal reutilizable |
| `index.js` | Re-exporta schema/supabase/db |

### Datos (esquema Supabase — ver `supabase/migrations/`)
Tablas: `profiles`, `posts` (con `sprites text[]`), `favorites`, `exchanges` (con `sprite_id`), `notifications`, `reports`, `mod_log`, `collections`.

### Migraciones (`supabase/migrations/`)
- `0001_community.sql` — base: profiles, posts, favorites, exchanges, notifications, reports, mod_log
- `0002_collections.sql` — collections (sync multi-dispositivo)
- `0003_public_profile.sql` — perfil público
- `0004_bulk_posts.sql` — posts masivos (`sprites[]`), intercambios con sprite, triggers
- `0005_delete_account.sql` — `delete_my_account()` (security definer): borra todas las tablas + auth.users

### Requisitos no funcionales
- **Seguridad:** RLS en todas las tablas; rate limits en inserts (subquery); solo mods pueden cambiar `is_moderator` (trigger `guard_moderator`); datos privados (favorites, collections, notifications) con select solo dueño.
- **XSS:** todo contenido de usuario pasa por `esc()` en `ui.js`.
- **Idempotencia:** las migraciones usan `create ... if not exists` / `drop policy if exists` — se pueden re-ejecutar.
- **Compatibilidad:** móvil y escritorio; sin framework de UI.

## FLUJO DE APP

```
inicio (index.html)
 ├─ cargar estado local (localStorage) + sincronizar con nube si hay sesión
 ├─ configurar i18n (es/en)
 └─ añadir botón Comunidad + botones de nube (guardar/restaurar/usar en otro dispositivo)

Pestaña Comunidad (ui.js)
 ├─ tabs: Feed | Publicar | Mis posts | Mis intercambios | Perfil | Notificaciones | Mod
 ├─ Feed: lista de posts con sprites, tipo (tengo/busco), autor, nota, fav, pedir, reportar
 ├─ Publicar: seleccionar sprites (multi), tipo have/want, nota ≤280, crear post
 ├─ Mis posts: editar estado (activo/cumplido/borrado), ver intercambios asociados
 ├─ Mis intercambios: aceptar/completar/cancelar; el sprite sale del post al completar
 ├─ Perfil: gamer_tag, plataforma, visibilidad; sección cuenta (upgrade a email / login / logout)
 ├─ Notificaciones: trade_request/accepted/completed/cancelled; marcar leídas
 └─ Mod (solo moderadores): reportes abiertos, resolver/desechar, log

Auth
 ├─ sin sesión → signInAnonymously() (ensureAnonSession)
 ├─ crear cuenta → updateUser({ email, password }) + confirmar por email
 ├─ si email ya registrado → aviso y redirigir a login
 ├─ login → signInWithPassword({ email, password })
 ├─ magic link → signInWithOtp({ email, shouldCreateUser:false, redirectTo: origin+pathname })
 └─ al recibir el enlace, detectSessionInUrl procesa #access_token en el hash

Sincronización de colección (collection-sync.js)
 ├─ Guardar en la nube: push estado local → tabla collections
 ├─ Restaurar de la nube: pull → en conflicto, modal elegir navegador/nube/merge
 └─ upgrade a email: modal email+contraseña → updateUser → confirmar
```

## UI UX DESIGN BRIEF

### Principios
- Bilingüe (es/en) con toggle; el idioma se guarda.
- Estilo oscuro de Fortnite (colores base del proyecto); consistente con el tracker principal.
- Acciones destructivas en rojo (`.danger`), primarias resaltadas (`.btn-primary`).
- Feedback inmediato con `toast` (success/error/info) en vez de modales para operaciones rutinarias.
- Formularios con `autocomplete` correcto (`email`, `current-password`, `new-password`).

### Pestaña Comunidad
- Tabs en la parte superior; el contenido cambia por tab.
- Cards de post: sprites (chips si son varios), badge "tengo/busco", autor enlaza al perfil público, nota, botones de acción contextuales.
- El contador de favoritos se muestra en el botón ❤️/🤍 y se refresca por suscripción en vivo.

### Perfil
- Una sola vista: formulario de perfil (gamer_tag, plataforma, visibilidad) + sección de cuenta.
- Cuenta anónima → botones "Crear cuenta" y "¿Ya tienes cuenta? Inicia sesión".
- Login: email + contraseña + botón "Enviar magic link" (recuperación sin contraseña).
- Upgrade: email + contraseña + confirmación (sin `prompt()`, sin usar el email como contraseña).
- Error "correo ya registrado" → muestra el bloque de login con el email precargado.

### Nube
- Botones en la barra de acciones: "Guardar en la nube", "Restaurar de la nube", "Usar en otro dispositivo".
- Conflicto de sincronización → modal con 3 opciones: usar navegador / usar nube / combinar.

### Accesibilidad
- Botones con `type="button"`, labels visibles, inputs con placeholder + autocomplete.
- No se usa `prompt()`/`alert()` del navegador para flujos principales (usar modal o inline).

## ESQUEMA BACKEND

### Supabase (Postgres + RLS). Migraciones en `supabase/migrations/`.

```
profiles
  id uuid PK → auth.users (on delete cascade)
  gamer_tag text 3..32
  platform text (epic|psn|xbox)
  is_public bool
  is_moderator bool   [trigger guard_moderator: solo mods pueden cambiarlo]
  created_at / updated_at   [trigger set_updated_at]

posts
  id uuid PK
  user_id uuid → profiles
  sprites text[] 1..200   [GIN index; regex ^[a-z0-9_]+$]
  type text (have|want)
  note text ≤280 nullable
  status text (active|fulfilled|deleted)
  [RLS: select público salvo deleted; insert rate limit 5/min; update/delete solo dueño]

favorites
  user_id + sprite_id PK   [rate limit 20/min]
  count público vía RPC favorite_count() (security definer)

exchanges
  id PK, post_id → posts, requester_id, owner_id, sprite_id
  status (pending|accepted|completed|cancelled)
  [insert: sprite ∈ post, no auto-intercambio, rate 3/min]
  [trigger notify_exchange → notificaciones]
  [trigger pull_sprite_from_post: al completar, quita sprite del post; vacío → fulfilled]

notifications  [insert solo desde triggers security definer]
  user_id, type, payload jsonb, read_at

reports
  post_id, reporter_id (unique), reason ≤280, status (open|resolved|dismissed)
  [no reportar el propio post; rate 5/min]

mod_log   [auditoría: mod_id, action, post_id, exchange_id]
collections  [sync multi-dispositivo: obtained[], mastered[]]
```

### Roles y seguridad
- `anon` y `authenticated` tienen grants explícitos (insert/select/update/delete) pero **todo pasa por RLS**.
- Funciones `security definer`: `is_moderator()`, `favorite_count()`, `completed_exchanges_for()`, `notify_exchange()`, `pull_sprite_from_post()`.
- Regla de oro de RLS: escritura de usuario → rate limit en policy; datos privados → select solo dueño; datos públicos → select anon.

### Auth (Supabase Auth)
- Flujo principal: **anónimo → email** (sin alta previa). Se usa `updateUser({ email, password })` para convertir la sesión anónima en cuenta real (no `signUp`).
- Login por contraseña: `signInWithPassword`.
- Login sin contraseña: **magic link** `signInWithOtp({ email, options: { shouldCreateUser: false, redirectTo } })` con `detectSessionInUrl: true` en el cliente.
- Borrado de cuenta: `delete_my_account()` (security definer) + `signOut`; confirmación en UI con email escrito.

### Mecánica de sprites en Fortnite (importante para la comunidad)
- Al entregar un sprite a otro jugador, **queda indexado en la colección del receptor Y el donante puede volver a invocarlo**; el receptor también puede devolverlo pero ya lo conserva indexado.
- Consecuencia: el mismo sprite puede existir en la colección de varios jugadores a la vez. No es un objeto único que se transfiere.
- Implicación para el tracker: el estado "have/want" de un post es una intención de trade, NO un inventario exclusivo. Al completar un intercambio, `pull_sprite_from_post` quita el sprite del post del donante (porque ya no necesita ofrecerlo), pero NO debe asumir que el sprite dejó de existir para nadie.
- `completed_exchanges_for` muestra los intercambios completados por usuario para el perfil público.

## PLAN DE IMPLANTACIÓN

### Estado actual (2026-08)
- [x] Colección local + exportación PNG/JSON
- [x] i18n es/en
- [x] Páginas legales (privacy/terms) + aviso "tracker no oficial" en footer
- [x] Nube multi-dispositivo (guardar/restaurar/merge) con sesión anónima
- [x] Upgrade anónimo → email con contraseña (ambos flujos: pestaña Comunidad y botón "Usar en otro dispositivo")
- [x] Login por contraseña y **magic link**
- [x] Comunidad: posts masivos, intercambios, notificaciones, favoritos, perfiles públicos, reports, mod
- [x] Detección de "correo ya registrado" → guía a login
- [x] Audit de seguridad: RLS, rate limits, XSS (esc), zod, zod-env, sin secrets en repo
- [x] Botones rápidos publicar: "Añadir todo lo que tengo" / "Añadir lo que me falta" (basados en estado real de la colección)
- [x] Eliminar cuenta completa: `delete_my_account()` borra posts, favoritos, intercambios, notifs, reports, mod_log, colección y `auth.users`
- [x] Limpieza de datos de prueba en Supabase (solo queda cuenta de desarrollo)

### Pendiente — prioridad alta (bloqueante para lanzar comunidad)
- [x] **Actualizar `privacy.html` y `terms.html`** (+ claves i18n `pages.*`): ahora documentan cuentas con email, subida a la nube (Supabase), datos de comunidad visibles, cómo borrar la cuenta (`Comunidad > Perfil`), conducta de la comunidad e intercambios. La sección "no se envía nada a servidores" fue reemplazada por "Datos que se suben a la nube (opcional)".

### Pendiente — funcional
- [ ] Verificar el flujo completo de magic link en producción (deploy + clic en el email → vuelve a la app con sesión).
- [ ] Revisar qué pasa al borrar caché estando ya con cuenta email (login directo, no upgrade).
- [ ] Confirmar el alta en Supabase Dashboard está habilitada con email confirmation (necesario para upgrade anónimo→email).

### Pendiente — comunidad
- [ ] Moderadores reales (set `is_moderator` por SQL manual).
- [x] Política de contenido (sprites duplicados, spam, intercambios) reflejada en `terms.html` (secciones "Comunidad y conducta" e "Intercambios").

### Deploy (GitHub Pages, carpeta `docs/`)
```bash
./scripts/deploy.sh   # build + git add docs/ + commit + push
```

### Regla para merges upstream
Nunca sobrescribir `src/i18n/`, `src/app.js`, `src/share-utils.js`, `index.html`, `vite.config.js`, `package.json`. Solo `src/sprites-data.js` y PNGs nuevos.

