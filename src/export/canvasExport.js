/**
 * @file canvasExport.js
 * @description High-resolution Canvas image exporter for collection cards and trade graphics.
 */

import { EXPORT_LAYOUT, URLS } from '../constants.js';
import { showToast } from '../utils/toast.js';
import {
    getFamilyKey,
    getCharName,
    getDisplayName,
    getExportThemeLabel,
    isIOS,
} from '../utils/helpers.js';

/**
 * Get background gradient colors for card rarity.
 * @param {string} rarity - Sprite rarity.
 * @param {string} theme - Sprite theme.
 * @returns {[string, string]} Linear gradient stop colors.
 */

export function getRarityGradient(rarity, theme) {
    const map = {
        Rare: ['#104273', '#081a35'],
        Epic: ['#4d1566', '#1e052c'],
        Legendary: ['#743e0a', '#301702'],
        Mythic: ['#70531c', '#2e2107'],
    };
    if (rarity !== 'Special') return map[rarity] || map.Rare;

    const themes = {
        Basic: ['#1c2436', '#0c0f17'],
        Gold: ['#61460b', '#241a02'],
        Candy: ['#6b183f', '#260514'],
        Galaxy: ['#1f1145', '#080314'],
        Gem: ['#114c47', '#041a18'],
        Holofoil: ['#204454', '#09171f'],
        Cube: ['#4c1d95', '#1e0b3d'],
        Rift: ['#154b5e', '#04161c'],
        Quack: ['#322554', '#12091f'],
        Cheat: ['#003b00', '#000800'],
        Hacker: ['#4a1060', '#1c0429'],
        Bounty: ['#6b1d92', '#260a35'],
    };
    return themes[theme] || themes.Basic;
}

/**
 * Get tag background and text colors for card rarity.
 * @param {string} rarity - Sprite rarity.
 * @returns {[string, string]} Tag background and text colors.
 */
export function getRarityTagColors(rarity) {
    const map = {
        Rare: ['#004A8E', '#00FFFB'],
        Epic: ['#511D7F', '#ED2BFF'],
        Legendary: ['#8E4122', '#FBC568'],
        Mythic: ['#80622A', '#FFF1A9'],
        Special: ['#51f7cc', '#000000'],
    };
    return map[rarity] || map.Rare;
}

/**
 * Helper to draw rounded rectangle path on Canvas context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {number} x - Left X coordinate.
 * @param {number} y - Top Y coordinate.
 * @param {number} width - Rectangle width.
 * @param {number} height - Rectangle height.
 * @param {number} radius - Corner radius.
 */
function drawRoundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, radius);
    } else {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

/**
 * Draw crown icon on Canvas context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {number} cx - Center X coordinate.
 * @param {number} cy - Center Y coordinate.
 */
function drawCrown(ctx, cx, cy) {
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 5);
    ctx.lineTo(cx + 7, cy + 5);
    ctx.lineTo(cx + 7, cy - 2);
    ctx.lineTo(cx + 3, cy + 1.5);
    ctx.lineTo(cx, cy - 4.5);
    ctx.lineTo(cx - 3, cy + 1.5);
    ctx.lineTo(cx - 7, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

/**
 * Preload image async promise wrapper.
 * @param {{id: string, src: string}} item - Image asset descriptor.
 * @returns {Promise<{id: string, img: HTMLImageElement, success: boolean}>}
 */
function loadImage(item) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ id: item.id, img, success: true });
        img.onerror = () => resolve({ id: item.id, img, success: false });
        img.src = item.src;
    });
}

/**
 * Draw mini card on Canvas.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {Object} sprite - Sprite object.
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @param {number} w - Width.
 * @param {number} h - Height.
 * @param {string} cardState - Card state string ('owned', 'mastered', 'missing_gray', 'missing_color', 'unmastered', 'empty').
 * @param {Record<string, HTMLImageElement>} imageMap - Preloaded image map.
 */
function drawMiniCard(ctx, sprite, x, y, w, h, cardState, imageMap) {
    if (cardState === 'empty') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        drawRoundRect(ctx, x, y, w, h, 8);
        ctx.stroke();
        ctx.restore();
        return;
    }

    const rarity = sprite.rarity || 'Rare';
    const theme = sprite.theme || 'Basic';
    const innerH = h - 22;

    const isMastered = cardState === 'mastered';
    const isGrayed = cardState === 'missing_gray';
    const isMissing = cardState === 'missing_gray' || cardState === 'missing_color';

    ctx.fillStyle = '#0f141d';
    ctx.beginPath();
    drawRoundRect(ctx, x, y, w, h, 8);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    drawRoundRect(ctx, x, y, w, innerH, 8);
    ctx.clip();

    const grad = ctx.createLinearGradient(x, y, x, y + innerH);
    const [c1, c2] = getRarityGradient(rarity, theme);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, innerH);

    if (rarity === 'Special') {
        const rainbow = ctx.createLinearGradient(x, y, x + w, y + innerH);
        rainbow.addColorStop(0, 'rgba(81,247,204,0.25)');
        rainbow.addColorStop(0.5, 'rgba(227,116,238,0.35)');
        rainbow.addColorStop(1, 'rgba(181,246,158,0.25)');
        ctx.fillStyle = rainbow;
        ctx.fillRect(x, y, w, innerH);
    }

    const shine = ctx.createLinearGradient(x, y, x, y + innerH);
    shine.addColorStop(0, 'rgba(255,255,255,0.12)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(x, y, w, innerH);

    if (isGrayed) {
        ctx.fillStyle = 'rgba(11, 13, 20, 0.45)';
        ctx.fillRect(x, y, w, innerH);
    }
    ctx.restore();

    const img = imageMap[sprite.id];
    if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        drawRoundRect(ctx, x, y, w, innerH, 8);
        ctx.clip();

        if (isGrayed) {
            try {
                ctx.filter = 'grayscale(100%) brightness(48%)';
            } catch {}
        }
        const maxDim = w * 0.82;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        ctx.drawImage(img, x + (w - nw) / 2, y + (innerH - nh) / 2, nw, nh);
        ctx.restore();

        if (isGrayed) {
            ctx.fillStyle = 'rgba(15, 20, 30, 0.15)';
            ctx.beginPath();
            drawRoundRect(ctx, x, y, w, innerH, 8);
            ctx.fill();
        }
    }

    ctx.save();
    ctx.font = '900 8.5px "Oswald", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let labelText = 'COLLECTED';
    let labelColor = '#22c55e';
    if (isMastered) {
        labelText = 'MASTERED';
        labelColor = '#ffd700';
    } else if (isMissing) {
        labelText = 'MISSING';
        labelColor = '#ef4444';
    }

    ctx.fillStyle = labelColor;
    ctx.fillText(labelText, x + 5, y + 5);
    ctx.restore();

    const [tagBg, tagText] = getRarityTagColors(rarity);
    ctx.save();
    ctx.beginPath();
    drawRoundRect(ctx, x, y, w, innerH, 8);
    ctx.clip();

    if (rarity === 'Special') {
        const tg = ctx.createLinearGradient(x, y + innerH - 12, x + w * 0.6, y + innerH - 12);
        tg.addColorStop(0, '#51f7cc');
        tg.addColorStop(0.5, '#e374ee');
        tg.addColorStop(1, '#b5f69e');
        ctx.fillStyle = tg;
    } else {
        ctx.fillStyle = tagBg;
    }
    ctx.beginPath();
    ctx.moveTo(x, y + innerH - 12);
    ctx.lineTo(x + w * 0.48, y + innerH - 12);
    ctx.lineTo(x + w * 0.58, y + innerH);
    ctx.lineTo(x, y + innerH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = tagText;
    ctx.font = '900 8.5px "Oswald", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(rarity === 'Mythic' ? 'MYTHIC' : rarity.toUpperCase(), x + 4, y + innerH - 6);

    ctx.fillStyle = 'rgba(15,20,29,0.9)';
    ctx.fillRect(x, y + innerH, w, 22);

    ctx.fillStyle = isMissing ? '#ef4444' : '#ffffff';
    let fontSize = 14.25;
    const name = sprite.name.toUpperCase();
    ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    while (ctx.measureText(name).width > w - 6 && fontSize > 9.75) {
        fontSize -= 0.5;
        ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
    }
    ctx.fillText(name, x + w / 2, y + innerH + 11);

    let bottomAccentColor = tagBg;
    let borderColor = '#1a2233';
    if (isMastered) {
        bottomAccentColor = '#ffd700';
        borderColor = '#ffd700';
    } else if (isMissing) {
        bottomAccentColor = '#ef4444';
    } else if (cardState === 'unmastered') {
        bottomAccentColor = '#00f0ff';
    }

    ctx.fillStyle = bottomAccentColor;
    ctx.fillRect(x, y + h - 3, w, 3);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isMastered ? 2 : 1;
    ctx.beginPath();
    drawRoundRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    if (isMastered) {
        drawCrown(ctx, x + w / 2, y - 2);
    }
}

/**
 * Export collection image or trade card to PNG download or tab.
 * @param {Object} options
 * @param {string} options.mode - Export mode ('collected', 'missing', 'unmastered', 'mastered', 'trade').
 * @param {Object} options.config - Config parameters (items, titleL1, titleL2, color, filename, emptyMsg).
 * @param {Array<Object>} options.releasedSprites - Full released sprites.
 * @param {string[]} options.activeThemes - Active theme keys.
 * @param {boolean} options.openInNewTab - Open export image in new tab if true.
 * @param {(sprite: Object, mode: string) => string} options.getExportCardState - Card state evaluator callback.
 * @param {() => {total: number, collected: number, mastered: number}} options.getCollectionCounts - Counts callback.
 * @param {Record<string, string>} [options.i18nLabels] - Translated toast messages.
 * @returns {void}
 */
export function exportCanvasImage({
    mode,
    config,
    releasedSprites,
    activeThemes,
    openInNewTab,
    getExportCardState,
    getCollectionCounts,
    i18nLabels = {},
}) {
    if (!config) return;

    const imagesToLoad = [
        { id: 'mascot', src: 'siteimages/staticsprite.png' },
        ...releasedSprites.map(sprite => ({ id: sprite.id, src: `sprites/${encodeURIComponent(sprite.id)}.png` })),
    ];

    showToast(i18nLabels.generating || 'Generating image export...', 'info');

    Promise.all(imagesToLoad.map(loadImage)).then(loadedImages => {
        const imageMap = {};
        loadedImages.forEach(res => {
            if (res.success) {
                imageMap[res.id] = res.img;
            }
        });

        const layout = EXPORT_LAYOUT;
        let canvasW, canvasH, headerH, useCompactHeader;
        let cols = 0, rows = 0, startGridY = 0, gridWidth = 0;

        let charKeys, familyThemeMap, themeColumns, leftColumnKeys, rightColumnKeys, tableColumnCount, colW, tableW;

        if (mode === 'trade') {
            charKeys = getFamilyKeys(releasedSprites);
            familyThemeMap = getFamilyThemeMap(releasedSprites);
            themeColumns = activeThemes.map(theme => ({
                name: getExportThemeLabel(theme),
                themeName: theme,
            }));

            const activeCharKeys = charKeys.filter(charKey => {
                return [...(familyThemeMap.get(charKey)?.values() || [])]
                    .some(sprite => getExportCardState(sprite, mode) !== 'empty');
            });

            themeColumns = themeColumns.filter(t => {
                return activeCharKeys.some(charKey => {
                    const sprite = familyThemeMap.get(charKey)?.get(t.themeName);
                    return sprite && getExportCardState(sprite, mode) !== 'empty';
                });
            });

            tableColumnCount = activeCharKeys.length > layout.maxSingleColumnRows ? 2 : 1;
            const half = tableColumnCount === 1 ? activeCharKeys.length : Math.ceil(activeCharKeys.length / 2);
            leftColumnKeys = activeCharKeys.slice(0, half);
            rightColumnKeys = activeCharKeys.slice(half);

            const maxRows = Math.max(leftColumnKeys.length, rightColumnKeys.length);
            const rowH = layout.cardH + layout.rowGap;
            const rowsH = maxRows * rowH;
            const cardBlockW = themeColumns.length * layout.cardW + Math.max(0, themeColumns.length - 1) * layout.cardGap;
            colW = layout.labelW + cardBlockW;
            tableW = colW * tableColumnCount + layout.colGap * Math.max(0, tableColumnCount - 1);
            canvasW = Math.max(layout.minCanvasW, tableW + layout.border * 2 + layout.sidePad * 2);
            useCompactHeader = canvasW < layout.compactHeaderW;
            headerH = useCompactHeader ? layout.compactHeaderH : layout.headerH;
            canvasH = layout.border * 2 + headerH + layout.colHeaderH + rowsH + layout.footerH;
        } else {
            const totalItems = config.items.length;
            const cardAspect = (layout.cardW + layout.cardGap) / (layout.cardH + layout.rowGap);

            cols = Math.max(1, Math.round(Math.sqrt(totalItems / cardAspect)));
            rows = Math.ceil(totalItems / cols);

            gridWidth = cols * layout.cardW + (cols - 1) * layout.cardGap;
            const gridHeight = rows * layout.cardH + (rows - 1) * layout.rowGap;

            canvasW = Math.max(layout.minCanvasW, gridWidth + layout.border * 2 + layout.sidePad * 2);
            useCompactHeader = canvasW < layout.compactHeaderW;
            headerH = useCompactHeader ? layout.compactHeaderH : layout.headerH;

            canvasH = layout.border * 2 + headerH + layout.sidePad + gridHeight + layout.sidePad + layout.footerH;
            startGridY = layout.border + headerH + layout.sidePad;
        }

        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = canvasW * scale;
        canvas.height = canvasH * scale;

        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        let borderGrad;
        if (mode === 'trade') {
            borderGrad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
            borderGrad.addColorStop(0, '#ffd700');
            borderGrad.addColorStop(1, '#22c55e');
            ctx.fillStyle = borderGrad;
        } else {
            ctx.fillStyle = config.color;
            borderGrad = config.color;
        }
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.fillStyle = '#0b0d13';
        ctx.fillRect(layout.border, layout.border, canvasW - layout.border * 2, canvasH - layout.border * 2);

        ctx.fillStyle = '#181c25';
        ctx.fillRect(layout.border, layout.border, canvasW - layout.border * 2, headerH);

        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(layout.border, layout.border + headerH);
        ctx.lineTo(canvasW - layout.border, layout.border + headerH);
        ctx.stroke();

        const { total: totalCount, collected: ownedCount, mastered: masteredCount } = getCollectionCounts(releasedSprites);
        const colPct = totalCount > 0 ? ownedCount / totalCount : 0;
        const masPct = totalCount > 0 ? masteredCount / totalCount : 0;

        const bw = 110;
        const statGap = 25;
        const mascotImg = imageMap['mascot'];
        const fullTitle = `${config.titleL1} ${config.titleL2}`;

        const fitFont = (text, maxWidth, startSize, minSize, style) => {
            let size = startSize;
            ctx.font = `${style} ${size}px "Oswald", sans-serif`;
            while (ctx.measureText(text).width > maxWidth && size > minSize) {
                size -= 0.5;
                ctx.font = `${style} ${size}px "Oswald", sans-serif`;
            }
            return size;
        };

        const drawProgressBlock = (label, count, total, pct, x, y, color) => {
            ctx.font = '900 12px "Oswald", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color;
            ctx.fillText(`${label}: ${count}/${total}`, x, y);
            ctx.fillStyle = '#0e1117';
            ctx.fillRect(x, y + 15, bw, 12);
            ctx.strokeStyle = '#3b4253';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y + 15, bw, 12);
            ctx.fillStyle = color;
            ctx.fillRect(x, y + 16, bw * pct, 10);
        };

        if (useCompactHeader) {
            const topY = layout.border + 24;
            const mascotSize = 24;
            const mascotGap = mascotImg ? 8 : 0;
            fitFont(config.titleL1, canvasW - layout.border * 2 - 60, 14, 10, 'italic 900');
            const titleL1W = ctx.measureText(config.titleL1).width;
            const titleGroupW = titleL1W + (mascotImg ? mascotSize + mascotGap : 0);
            let groupX = (canvasW - titleGroupW) / 2;
            if (mascotImg) {
                ctx.drawImage(mascotImg, groupX, topY - mascotSize / 2, mascotSize, mascotSize);
                groupX += mascotSize + mascotGap;
            }
            ctx.fillStyle = borderGrad;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.titleL1, groupX, topY);

            fitFont(config.titleL2, canvasW - layout.border * 2 - 36, 20, 13, 'italic 900');
            ctx.fillStyle = borderGrad;
            ctx.textAlign = 'center';
            ctx.fillText(config.titleL2, canvasW / 2, layout.border + 52);

            if (mode === 'trade') {
                const statsW = bw * 2 + statGap;
                const statsX = (canvasW - statsW) / 2;
                const statsY = layout.border + 86;
                drawProgressBlock(i18nLabels.collection || 'COLLECTION', ownedCount, totalCount, colPct, statsX, statsY, '#22c55e');
                drawProgressBlock(i18nLabels.mastery || 'MASTERY', masteredCount, totalCount, masPct, statsX + bw + statGap, statsY, '#ffd700');
            }
        } else {
            const statsRight = canvasW - layout.border - layout.sidePad;
            const collectionX = statsRight - bw * 2 - statGap;
            const masteryX = statsRight - bw;
            const titleX = layout.border + layout.sidePad;
            const mascotSize = 32;
            const mascotGap = mascotImg ? 10 : 0;
            const titleMaxW = (mode === 'trade') ? (collectionX - titleX - 20) : (canvasW - titleX - layout.border - layout.sidePad);

            fitFont(fullTitle, titleMaxW - (mascotImg ? mascotSize + mascotGap : 0), 26, 16, 'italic 900');
            ctx.fillStyle = borderGrad;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            let textLeft = titleX;
            if (mascotImg) {
                ctx.drawImage(mascotImg, textLeft, layout.border + headerH / 2 - mascotSize / 2, mascotSize, mascotSize);
                textLeft += mascotSize + mascotGap;
            }
            ctx.fillText(fullTitle, textLeft, layout.border + headerH / 2);

            if (mode === 'trade') {
                drawProgressBlock(i18nLabels.collection || 'COLLECTION', ownedCount, totalCount, colPct, collectionX, layout.border + 28, '#22c55e');
                drawProgressBlock(i18nLabels.mastery || 'MASTERY', masteredCount, totalCount, masPct, masteryX, layout.border + 28, '#ffd700');
            }
        }

        if (mode === 'trade') {
            const startTableY = layout.border + headerH + layout.colHeaderH;

            const drawColHeaders = (startX) => {
                ctx.fillStyle = '#8891a5';
                ctx.font = 'bold 12px "Oswald", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                themeColumns.forEach((t, i) => {
                    const cx = startX + layout.labelW + i * (layout.cardW + layout.cardGap) + layout.cardW / 2;
                    ctx.fillText(t.name, cx, startTableY - 8);
                });
            };

            const leftTableX = layout.border + (canvasW - layout.border * 2 - tableW) / 2;
            const rightTableX = leftTableX + colW + layout.colGap;

            drawColHeaders(leftTableX);
            if (rightColumnKeys.length > 0) {
                drawColHeaders(rightTableX);
            }

            const drawRow = (charKey, startX, y) => {
                const name = getCharName(charKey, releasedSprites);
                const displayName = getDisplayName(name);

                ctx.fillStyle = '#ffffff';
                let fontSize = 14;
                ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                while (ctx.measureText(displayName).width > layout.labelW - 12 && fontSize > 8) {
                    fontSize -= 0.5;
                    ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
                }
                ctx.fillText(displayName, startX + layout.labelW - 10, y + layout.cardH / 2);

                const rowCards = themeColumns.map(t => familyThemeMap.get(charKey)?.get(t.themeName));

                rowCards.forEach((s, colIndex) => {
                    const cx = startX + layout.labelW + colIndex * (layout.cardW + layout.cardGap);

                    if (s) {
                        const cardState = getExportCardState(s, mode);
                        drawMiniCard(ctx, s, cx, y, layout.cardW, layout.cardH, cardState, imageMap);
                    } else {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([4, 4]);
                        ctx.beginPath();
                        drawRoundRect(ctx, cx, y, layout.cardW, layout.cardH, 8);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            };

            leftColumnKeys.forEach((charKey, idx) => {
                const y = startTableY + idx * (layout.cardH + layout.rowGap);
                drawRow(charKey, leftTableX, y);
            });

            rightColumnKeys.forEach((charKey, idx) => {
                const y = startTableY + idx * (layout.cardH + layout.rowGap);
                drawRow(charKey, rightTableX, y);
            });
        } else {
            const startGridX = (canvasW - gridWidth) / 2;

            config.items.forEach((sprite, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);

                const x = startGridX + col * (layout.cardW + layout.cardGap);
                const y = startGridY + row * (layout.cardH + layout.rowGap);

                const cardState = getExportCardState(sprite, mode);
                drawMiniCard(ctx, sprite, x, y, layout.cardW, layout.cardH, cardState, imageMap);
            });
        }

        ctx.fillStyle = '#0e1117';
        ctx.fillRect(layout.border, canvasH - layout.footerH - layout.border, canvasW - layout.border * 2, layout.footerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Oswald", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('itskreisler.github.io/fnsprites/', canvasW / 2, canvasH - layout.border - layout.footerH / 2);

        const shouldOpenInNewTab = isIOS() || openInNewTab;

        if (shouldOpenInNewTab) {
            canvas.toBlob((blob) => {
                if (!blob) {
                    showToast(i18nLabels.failedExport || 'Failed to generate image', 'error');
                    return;
                }
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                showToast(i18nLabels.openedInTab || 'Image opened in new tab!', 'success');
            }, 'image/png');
        } else {
            const link = document.createElement('a');
            link.download = `${config.filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast(i18nLabels.exportSuccess || 'Image exported successfully!', 'success');
        }
    });
}
