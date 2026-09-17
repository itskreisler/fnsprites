/**
 * @file clipboard.js
 * @description Shared clipboard operations and floating visual copy animation.
 */

import { showToast } from './toast.js';

/**
 * Display a floating text animation at the anchor element position.
 * @param {HTMLElement} anchorElement - DOM element where the animation originates.
 * @param {string} [text='Code copied to clipboard!'] - Floating text label.
 * @returns {void}
 */
export function showFloatingCopyText(anchorElement, text = 'Code copied to clipboard!') {
    if (!anchorElement) return;
    const textEl = document.createElement('div');
    textEl.className = 'floating-copy-text';
    textEl.textContent = text;

    const rect = anchorElement.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top;

    const randomAngleX = (Math.random() - 0.5) * 50;
    const endY = -40 - Math.random() * 20;

    textEl.style.setProperty('--target-x', `${randomAngleX}px`);
    textEl.style.setProperty('--target-y', `${endY}px`);
    textEl.style.left = `${startX}px`;
    textEl.style.top = `${startY}px`;

    document.body.appendChild(textEl);

    textEl.addEventListener('animationend', () => {
        textEl.remove();
    });
}

/**
 * Fallback copy method for browsers without native navigator.clipboard support.
 * @param {string} text - Text to copy.
 * @returns {boolean} True if execCommand succeeded.
 */
export function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
    return success;
}

/**
 * Copy text to clipboard with feedback animation and toast messages.
 * @param {string} text - Text content to copy.
 * @param {HTMLElement|null} [anchorElement=null] - Visual anchor for floating animation.
 * @param {string} [successMsg] - Optional toast message on success.
 * @param {string} [errorMsg] - Optional toast message on failure.
 * @returns {Promise<boolean>} Resolves to true if copy succeeded.
 */
export async function copyToClipboard(text, anchorElement = null, successMsg = '', errorMsg = '') {
    if (anchorElement) {
        showFloatingCopyText(anchorElement);
    }

    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            success = true;
        } catch {
            success = fallbackCopy(text);
        }
    } else {
        success = fallbackCopy(text);
    }

    if (success && successMsg) {
        showToast(successMsg, 'success');
    } else if (!success && errorMsg) {
        showToast(errorMsg, 'error');
    }

    return success;
}

/**
 * Copy support creator code when clicking code button.
 * @param {HTMLElement} buttonEl - Button element containing creator code.
 * @param {string} [copiedMessage] - Message to display on float.
 * @returns {void}
 */
export function copySupportCode(buttonEl, copiedMessage = 'Code copied to clipboard!') {
    const code = buttonEl.textContent ? buttonEl.textContent.trim() : 'KLEI';
    copyToClipboard(code, buttonEl, '', '');
}
