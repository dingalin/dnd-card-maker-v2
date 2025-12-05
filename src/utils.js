/**
 * Shared utility functions for D&D Card Creator
 */

/**
 * Get rarity based on character level range
 * @param {string} level - Level range (e.g., '1-4', '5-10', '11-16', '17+')
 * @returns {string} - Rarity string
 */
export function getRarityFromLevel(level) {
    if (level === '1-4') return 'common';
    if (level === '5-10') return 'uncommon';
    if (level === '11-16') return 'rare';
    if (level === '17+') return 'legendary';
    return 'common';
}

/**
 * Debounce function to limit rapid calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format gold value with commas
 * @param {number|string} gold - Gold value
 * @returns {string} - Formatted gold string
 */
export function formatGold(gold) {
    const num = parseInt(gold, 10);
    if (isNaN(num)) return gold;
    return num.toLocaleString('he-IL');
}
