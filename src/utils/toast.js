/**
 * @file toast.js
 * @description Toast notification utility.
 */

/**
 * Display a temporary floating toast message.
 * @param {string} message - Message text to display.
 * @param {'info' | 'success' | 'error'} [type='info'] - Notification style type.
 * @returns {void}
 */
export function showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
        el.classList.remove('visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => el.remove(), 500);
    }, 2500);
}
