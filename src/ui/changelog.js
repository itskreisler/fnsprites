/**
 * @file changelog.js
 * @description Update notes modal. Shows the latest changelog entry to new
 * users and re-shows it whenever a new version is pushed (the modal key is
 * the entry `version`, so bumping it invalidates the seen flag).
 *
 * The seen-flag lives in sessionStorage: it survives page reloads inside the
 * same tab/session but resets per new session, so an update is not lost for
 * users who reload during a session.
 */

import { getCurrentLocale, getTranslator } from './commonUi.js';
import { storageGet, storageSet, TypesStorages } from '../utils/storage.js';

const SEEN_KEY = 'fnsprites_changelog_seen';
const MODAL_OVERLAY_ID = 'changelogOverlay';

/**
 * Latest changelog entries, newest first. Bilingual per item.
 * `version` must be unique per release; bump it to show the modal again.
 */
export const CHANGELOG = [
    {
        version: '2026-10-02-credits',
        date: '2026-10-02',
        title: { es: 'Créditos y licencia', en: 'Credits and license', de: 'Credits und Lizenz' },
        notes: [
            {
                es: 'Se añadieron los créditos del autor original del tracker y un aviso de que este proyecto es un fork hecho por fans.',
                en: 'Added credits for the original tracker author, plus a notice that this is an unofficial fan-made fork.',
                de: 'Credits für den ursprünglichen Autor des Trackers ergänzt, dazu ein Hinweis, dass dies ein inoffizieller Fan-Fork ist.',
            },
            {
                es: 'Los términos ahora aclaran quién es el dueño de cada imagen y cómo pedir que se borre una. Si te llega a molestar algo, solo hay que abrir un issue.',
                en: 'The terms now clarify who owns each image and how to request removal. If anything bothers you, just open an issue.',
                de: 'Die Bedingungen erklären jetzt, wem jedes Bild gehört und wie eine Entfernung beantragt wird. Wenn dich etwas stört, öffne einfach ein Issue.',
            },
        ],
    },
    {
        version: '2026-10-02-trade-image',
        date: '2026-10-02',
        title: { es: 'Imagen de intercambio corregida', en: 'Trade image fixed', de: 'Tauschbild repariert' },
        notes: [
            {
                es: 'La imagen de intercambio salía vacía, sin la tabla de sprites. Ya se ve la rejilla completa con tu lista de lo que tienes y lo que te falta.',
                en: 'The trade image came out empty, with no sprite grid. You now get the full grid with your have/need list.',
                de: 'Das Tauschbild war leer, ohne Sprite-Raster. Jetzt siehst du das vollständige Raster mit deiner Haben-/Brauchen-Liste.',
            },
            {
                es: 'Las barras de progreso de la imagen ya no se pisan con el título.',
                en: 'The progress bars in the image no longer overlap the title.',
                de: 'Die Fortschrittsbalken im Bild überlappen den Titel nicht mehr.',
            },
        ],
    },
    {
        version: '2026-10-02-sprites-fix',
        date: '2026-10-02',
        title: { es: 'Novedades', en: "What's new", de: 'Neuerungen' },
        notes: [
            {
                es: '¡21 sprites nuevos de la temporada Override! Incluye Spooky Dash, Vampire, The Deer, Dumpster Dive y el Trick or Treat Crown.',
                en: '21 brand new Override season sprites! Including Spooky Dash, Vampire, The Deer, Dumpster Dive and the Trick or Treat Crown.',
                de: '21 brandneue Sprites der Saison Override! Darunter Spooky Dash, Vampire, The Deer, Dumpster Dive und die Trick-or-Treat-Krone.',
            },
            {
                es: 'Se arregló la descarga de imágenes: a veces salía en blanco o no se guardaba, sobre todo en móvil. Ahora el filtro de temporada abre en Override (la actual) en vez de todas, y la imagen se ajusta sola para que nunca falle.',
                en: 'Fixed image downloads: they sometimes came out blank or did not save, especially on mobile. The season filter now opens on Override (the current season) instead of all seasons, and the image resizes itself automatically so it can never fail.',
                de: 'Bild-Downloads repariert: Sie waren manchmal leer oder wurden nicht gespeichert, besonders auf dem Handy. Der Saisonfilter öffnet jetzt standardmäßig Override (aktuelle Saison) statt aller Saisons, und das Bild skaliert sich automatisch, sodass es nie fehlschlagen kann.',
            },
            {
                es: 'Nuevo tema de color Trick or Treat para los sprites de Halloween.',
                en: 'New Trick or Treat colour theme for the Halloween sprites.',
                de: 'Neues Farbschema Trick or Treat für die Halloween-Sprites.',
            },
            {
                es: 'Las imágenes exportadas ahora usan siempre la tipografía correcta, sin esperar a que la letra esté lista.',
                en: 'Exported images now always use the correct font, without waiting for the typeface to be ready.',
                de: 'Exportierte Bilder verwenden jetzt immer die richtige Schriftart, ohne auf das Laden der Schrift zu warten.',
            },
        ],
    },
    {
        version: '2026-09-24-secure',
        date: '2026-09-24',
        title: { es: 'Notas de actualización', en: 'Update notes', de: 'Update-Hinweise' },
        notes: [
            {
                es: 'Sync de Google Drive con respaldo automático y modal de conflicto con detalles (fecha, tamaño y sprites de cada versión).',
                en: 'Google Drive sync with auto backup and a conflict modal with details (date, size and sprites per version).',
                de: 'Google-Drive-Sync mit automatischem Backup und Konflikt-Dialog mit Details (Datum, Größe und Sprites pro Version).',
            },
            {
                es: 'Almacenamiento seguro: el token de acceso se guarda cifrado (AES-256-GCM) y todo el storage pasa por un wrapper agnóstico.',
                en: 'Secure storage: the access token is stored encrypted (AES-256-GCM) and all storage goes through an agnostic wrapper.',
                de: 'Sicherer Speicher: Das Zugriffstoken wird verschlüsselt gespeichert (AES-256-GCM) und der gesamte Speicher läuft über einen agnostischen Wrapper.',
            },
            {
                es: 'Nuevas páginas legales (privacidad y términos), nuevo logo y mejoras del export y del service worker.',
                en: 'New legal pages (privacy & terms), new logo, and export/service-worker improvements.',
                de: 'Neue Rechtsseiten (Datenschutz & Bedingungen), neues Logo und Verbesserungen bei Export und Service Worker.',
            },
        ],
    },
    {
        version: '2026-09-24',
        date: '2026-09-24',
        title: { es: 'Notas de actualización', en: 'Update notes', de: 'Update-Hinweise' },
        notes: [
            {
                es: 'Sincronización opcional con Google Drive: respaldo automático de tu colección con un clic.',
                en: 'Optional Google Drive sync: automatic backup of your collection with one click.',
                de: 'Optionaler Google-Drive-Sync: automatisches Backup deiner Sammlung mit einem Klick.',
            },
            {
                es: 'Importados 101 sprites de la Temporada Override (C7S4) y nuevo tema Bounty.',
                en: 'Imported 101 Override Season (C7S4) sprites plus the new Bounty theme.',
                de: '101 Override-Saison (C7S4) Sprites und das neue Bounty-Thema wurden importiert.',
            },
        ],
    },
];

function pickLocalized(item) {
    if (item && typeof item === 'object') {
        const locale = getCurrentLocale();
        return item[locale] || item.es || item.en || Object.values(item)[0] || '';
    }
    return String(item ?? '');
}

function buildModal(entry) {
    const t = getTranslator();
    const overlay = document.createElement('div');
    overlay.id = MODAL_OVERLAY_ID;
    overlay.className = 'changelog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t('changelog.header'));

    const modal = document.createElement('div');
    modal.className = 'changelog-modal';
    overlay.appendChild(modal);

    const header = document.createElement('div');
    header.className = 'changelog-header';

    const title = document.createElement('h2');
    title.className = 'changelog-title';
    title.textContent = pickLocalized(entry.title);
    header.appendChild(title);

    const version = document.createElement('span');
    version.className = 'changelog-meta';
    version.textContent = [entry.date, entry.version].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ');
    header.appendChild(version);

    modal.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'changelog-list';
    for (const note of entry.notes || []) {
        const li = document.createElement('li');
        li.textContent = pickLocalized(note);
        list.appendChild(li);
    }
    modal.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'changelog-footer';
    const gotIt = document.createElement('button');
    gotIt.type = 'button';
    gotIt.className = 'btn btn-accent';
    gotIt.textContent = t('changelog.gotIt');
    footer.appendChild(gotIt);
    modal.appendChild(footer);

    function close() {
        overlay.classList.add('closing');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        setTimeout(() => overlay.remove(), 300);
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
        if (e.key === 'Escape') close();
    }
    gotIt.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);

    return { overlay, close };
}

/**
 * Show the changelog modal once per version within the current session.
 * Marks it as seen as soon as it is rendered so reloads don't re-trigger it.
 */
export function initChangelogModal() {
    const current = CHANGELOG[0];
    if (!current) return;

    let seen = null;
    try {
        seen = storageGet(null, SEEN_KEY, TypesStorages.SESSION_STORAGE);
    } catch (_) {
        // storage unavailable (private mode): still show on first paint
        return;
    }
    if (seen === current.version) return;

    const { overlay } = buildModal(current);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    try {
        storageSet(null, SEEN_KEY, current.version, TypesStorages.SESSION_STORAGE);
    } catch (_) {
        /* ignore */
    }
}