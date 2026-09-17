/**
 * @file tradeText.js
 * @description Generator for trade text representations (plain text & markdown grid).
 */

import { URLS } from '../constants.js';
import {
    getFamilyKey,
    getCharName,
    getTradeThemeLabel,
    getExportThemeLabel,
} from '../utils/helpers.js';

/**
 * Generate plain text trade list for clipboard.
 * @param {Object} options
 * @param {Array<Object>} options.releasedSprites - Filtered released sprites.
 * @param {string[]} options.familyKeys - List of character family keys.
 * @param {Map<string, Map<string, Object>>} options.familyThemeMap - Family -> Theme -> Sprite map.
 * @param {{total: number, collected: number, mastered: number}} options.counts - Collection stats.
 * @param {(id: string) => boolean} options.isObtained - Callback checking if sprite is obtained.
 * @param {(id: string) => boolean} options.isMastered - Callback checking if sprite is mastered.
 * @param {Record<string, string>} [options.i18nTitles] - Optional translated section titles.
 * @returns {string} Plain text trade list.
 */
export function generateTradeText({
    releasedSprites,
    familyKeys,
    familyThemeMap,
    counts,
    isObtained,
    isMastered,
    i18nTitles = {},
}) {
    const buildSection = (title, selectSprites) => {
        const lines = [];

        familyKeys.forEach(charKey => {
            const name = getCharName(charKey, releasedSprites);
            const themeSprites = [...(familyThemeMap.get(charKey)?.values() || [])];
            const selected = selectSprites(themeSprites);
            if (selected.length === 0) return;

            const list = selected.map(sprite => getTradeThemeLabel(sprite.theme)).join(', ');
            lines.push(`  ▸ ${name} ➔ ${list}`);
        });

        return lines.length > 0 ? `【 ${title} 】\n${lines.join('\n')}` : '';
    };

    const titleLookingFor = i18nTitles.lookingFor || 'LOOKING FOR';
    const titleHave = i18nTitles.have || 'HAVE';
    const titleUnmastered = i18nTitles.stillNeedToMaster || 'STILL NEED TO MASTER';
    const labelCollected = i18nTitles.collected || 'Collected';
    const labelMastered = i18nTitles.mastered || 'Mastered';
    const labelTrackYours = i18nTitles.trackYours || 'Track yours';

    const sections = [
        buildSection(titleLookingFor, sprites => sprites.filter(sprite => !isObtained(sprite.id))),
        buildSection(titleHave, sprites => sprites.filter(sprite => isObtained(sprite.id))),
        buildSection(titleUnmastered, sprites => sprites.filter(sprite => isObtained(sprite.id) && !isMastered(sprite.id))),
        [
            `${labelCollected}: ${counts.collected}/${counts.total}`,
            `${labelMastered}: ${counts.mastered}/${counts.total}`,
            `${labelTrackYours}: ${URLS.tracker}`,
        ].join('\n'),
    ].filter(Boolean);

    return sections.join('\n\n');
}

/**
 * Generate markdown grid trade representation.
 * @param {Object} options
 * @param {Array<Object>} options.releasedSprites - Filtered released sprites.
 * @param {string[]} options.activeThemes - Active theme keys.
 * @param {string[]} options.familyKeys - List of character family keys.
 * @param {Map<string, Map<string, Object>>} options.familyThemeMap - Family -> Theme -> Sprite map.
 * @param {{total: number, collected: number, mastered: number}} options.counts - Collection stats.
 * @param {(id: string) => boolean} options.isObtained - Callback checking if sprite is obtained.
 * @param {(id: string) => boolean} options.isMastered - Callback checking if sprite is mastered.
 * @param {Record<string, string>} [options.i18nTitles] - Optional translated titles.
 * @returns {string} Markdown table code block.
 */
export function generateTradeGridText({
    releasedSprites,
    activeThemes,
    familyKeys,
    familyThemeMap,
    counts,
    isObtained,
    isMastered,
    i18nTitles = {},
}) {
    const labelCollected = i18nTitles.collected || 'Collected';
    const labelMastered = i18nTitles.mastered || 'Mastered';
    const labelTrackYours = i18nTitles.trackYours || 'Track yours';

    const lines = [
        '```',
        '✅ Owned  👑 Mastered  ❌ Missing',
        '',
        `| ${activeThemes.map(getExportThemeLabel).join(' | ')} | Sprite`,
        '-----------------------',
    ];

    familyKeys.forEach(charKey => {
        const rowStates = activeThemes.map(theme => {
            const s = familyThemeMap.get(charKey)?.get(theme);
            if (!s) return '⬛';
            if (isMastered(s.id)) return '👑';
            return isObtained(s.id) ? '✅' : '❌';
        });

        lines.push(`| ${rowStates.join(' | ')} | ${getCharName(charKey, releasedSprites)}`);
    });

    lines.push(
        '',
        `${labelCollected}: ${counts.collected}/${counts.total}`,
        `${labelMastered}: ${counts.mastered}/${counts.total}`,
        `${labelTrackYours}: ${URLS.tracker}`,
        '```'
    );

    return lines.join('\n');
}
