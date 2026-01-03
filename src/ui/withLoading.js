/**
 * Loading State Utilities
 * Provides consistent loading state management for async operations
 */

import { UI } from '../config/index.js';

/**
 * Wrap a button's async action with loading state management
 * @param {HTMLButtonElement} button - Button element
 * @param {Function} asyncFn - Async function to execute
 * @param {object} options - Configuration options
 * @param {string} options.loadingText - Text to show during loading
 * @param {boolean} options.showSpinner - Whether to add spinner class
 * @returns {Promise<*>} Result of asyncFn
 */
export async function withLoading(button, asyncFn, options = {}) {
    const {
        loadingText = window.i18n?.t('common.loading') || 'Loading...',
        showSpinner = true
    } = options;

    if (!button) {
        return asyncFn();
    }

    const originalText = button.textContent;
    const originalDisabled = button.disabled;

    try {
        button.disabled = true;
        button.textContent = loadingText;
        if (showSpinner) {
            button.classList.add('loading');
        }

        return await asyncFn();
    } finally {
        button.disabled = originalDisabled;
        button.textContent = originalText;
        if (showSpinner) {
            button.classList.remove('loading');
        }
    }
}

/**
 * Create a loading state manager for a specific element
 * @param {string} elementId - ID of the button/element
 * @returns {object} Loading state controller
 */
export function createLoadingState(elementId) {
    const element = document.getElementById(elementId);
    let originalState = null;

    return {
        start(text) {
            if (!element) return;
            originalState = {
                text: element.textContent,
                disabled: element.disabled
            };
            element.disabled = true;
            element.textContent = text || 'Loading...';
            element.classList.add('loading');
        },

        update(text) {
            if (element) {
                element.textContent = text;
            }
        },

        stop() {
            if (!element || !originalState) return;
            element.disabled = originalState.disabled;
            element.textContent = originalState.text;
            element.classList.remove('loading');
            originalState = null;
        }
    };
}

/**
 * Show global loading overlay
 * @param {boolean} show - Whether to show or hide
 * @param {string} message - Optional loading message
 */
export function setGlobalLoading(show, message = null) {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');

    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
            if (text && message) {
                text.textContent = message;
            }
        } else {
            overlay.classList.add('hidden');
        }
    }
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = UI.DEBOUNCE_MS) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export default {
    withLoading,
    createLoadingState,
    setGlobalLoading,
    debounce
};
