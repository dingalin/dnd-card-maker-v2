/// <reference types="vite/client" />
/**
 * Internationalization (i18n) Service
 * Manages language switching and translation loading for the D&D Card Creator
 */

// Define types for translations
export interface GenericTranslations {
    [key: string]: string | GenericTranslations;
}

export type Locale = 'he' | 'en';

declare global {
    interface Window {
        __i18n_instance?: I18nService;
        APP_BASE_PATH?: string;
    }
}

export class I18nService {
    private currentLocale: Locale;
    private translations: GenericTranslations;
    private fallbackTranslations: GenericTranslations;
    public isLoaded: boolean;
    private listeners: ((locale: Locale) => void)[];

    constructor() {
        this.currentLocale = 'he'; // Default to Hebrew (primary language for this app)
        this.translations = {};
        this.fallbackTranslations = {};
        this.isLoaded = false;
        this.listeners = [];
    }

    /**
     * Initialize the i18n service with saved preference
     */
    async init(): Promise<void> {
        console.log('[i18n] Starting initialization...');

        // Get base URL from Vite (handles GitHub Pages subpath)
        const baseUrl = import.meta.env.BASE_URL || '/';
        console.log('[i18n] Base URL:', baseUrl);

        // Load saved preference or default to Hebrew
        const savedLocale = localStorage.getItem('dnd-card-locale');
        this.currentLocale = (savedLocale === 'he' || savedLocale === 'en') ? savedLocale : 'he';
        console.log('[i18n] Saved locale:', this.currentLocale);

        // Load fallback (Hebrew) first
        try {
            const timestamp = new Date().getTime(); // Cache busting
            console.log('[i18n] Fetching Hebrew translations from /locales/he.json...');
            const heResponse = await fetch(`${baseUrl}locales/he.json?v=${timestamp}`);
            console.log('[i18n] Hebrew fetch response status:', heResponse.status);
            if (!heResponse.ok) {
                throw new Error(`HTTP ${heResponse.status}: ${heResponse.statusText}`);
            }
            this.fallbackTranslations = await heResponse.json();
            console.log('[i18n] Hebrew translations loaded, keys:', Object.keys(this.fallbackTranslations).length);
        } catch (e) {
            console.error('[i18n] Could not load Hebrew fallback:', e);
        }

        // Load current locale
        await this.loadLocale(this.currentLocale, false);
        this.isLoaded = true;

        // Update document direction and language
        this.updateDocumentAttributes();

        // Initial DOM update
        this.updateDOM();

        console.log(`[i18n] Initialized with locale: ${this.currentLocale}`);
    }

    /**
     * Load a specific locale
     * @param {Locale} locale - 'he' or 'en'
     * @param {boolean} updateDOM - Whether to update the DOM after loading
     */
    async loadLocale(locale: Locale, updateDOM: boolean = true): Promise<void> {
        try {
            const baseUrl = import.meta.env.BASE_URL || '/';
            const timestamp = new Date().getTime(); // Cache busting
            const response = await fetch(`${baseUrl}locales/${locale}.json?v=${timestamp}`);
            if (!response.ok) throw new Error(`Failed to load locale: ${locale}`);

            this.translations = await response.json();
            this.currentLocale = locale;
            localStorage.setItem('dnd-card-locale', locale);

            this.updateDocumentAttributes();

            if (updateDOM) {
                this.updateDOM();
                this.notifyListeners();
            }

            console.log(`[i18n] Loaded locale: ${locale}`);
        } catch (e) {
            console.error(`[i18n] Error loading locale ${locale}:`, e);
            // Fallback to Hebrew
            if (locale !== 'he') {
                this.translations = this.fallbackTranslations;
                this.currentLocale = 'he';
            }
        }
    }

    /**
     * Toggle between Hebrew and English
     */
    async toggleLocale(): Promise<void> {
        const newLocale: Locale = this.currentLocale === 'he' ? 'en' : 'he';
        await this.loadLocale(newLocale);
    }

    /**
     * Get translation by dot-notation key
     * @param {string} key - Translation key (e.g., 'nav.gallery')
     * @param {Record<string, string>} params - Optional parameters for interpolation
     * @returns {string} Translated text or key if not found
     */
    t(key: string, params: Record<string, string> = {}): string {
        let value = this.getNestedValue(this.translations, key);

        // Fallback to Hebrew if not found
        if (value === undefined || value === null) {
            value = this.getNestedValue(this.fallbackTranslations, key);
        }

        // Return key if still not found
        if (value === undefined || value === null) {
            console.warn(`[i18n] Missing translation: ${key}`);
            return key;
        }

        // Simple parameter interpolation: {{param}}
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            let result = value;
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
            });
            return result;
        }

        return String(value);
    }

    /**
     * Get nested value from object using dot notation
     * @param {GenericTranslations} obj - Source object
     * @param {string} path - Dot-notation path
     */
    private getNestedValue(obj: GenericTranslations, path: string): string | GenericTranslations | undefined {
        if (!obj || !path) return undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return path.split('.').reduce((current: any, key) => current?.[key], obj);
    }

    /**
     * Update document-level attributes (lang, dir)
     */
    private updateDocumentAttributes(): void {
        const html = document.documentElement;
        html.lang = this.currentLocale;
        html.dir = this.currentLocale === 'he' ? 'rtl' : 'ltr';
        document.body.classList.toggle('ltr', this.currentLocale === 'en');
        document.body.classList.toggle('rtl', this.currentLocale === 'he');
    }

    /**
     * Update all DOM elements with data-i18n attributes
     */
    public updateDOM(): void {
        // Update elements with data-i18n attribute
        document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;

            const translation = this.t(key);

            // Handle different element types
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                if (el.hasAttribute('placeholder')) {
                    el.placeholder = translation;
                } else {
                    el.value = translation;
                }
            } else if (el instanceof HTMLOptionElement) {
                el.textContent = translation;
            } else {
                el.textContent = translation;
            }
        });

        // Update elements with data-i18n-placeholder
        document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                    el.placeholder = this.t(key);
                }
            }
        });

        // Update elements with data-i18n-title (tooltips)
        document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.title = this.t(key);
            }
        });

        // Update document title
        const titleEl = document.querySelector('title[data-i18n]');
        if (titleEl) {
            const key = titleEl.getAttribute('data-i18n');
            if (key) {
                document.title = this.t(key);
            }
        }
    }

    /**
     * Register a listener for locale changes
     * @param callback - Function to call on locale change
     */
    onLocaleChange(callback: (locale: Locale) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners of locale change
     */
    private notifyListeners(): void {
        console.log(`[i18n] notifyListeners() called - ${this.listeners.length} listeners registered`);
        this.listeners.forEach(callback => {
            try {
                callback(this.currentLocale);
            } catch (e) {
                console.error('[i18n] Listener error:', e);
            }
        });
    }

    /**
     * Get current locale
     * @returns {Locale} Current locale code
     */
    getLocale(): Locale {
        return this.currentLocale;
    }

    /**
     * Check if current locale is RTL
     * @returns {boolean} True if RTL
     */
    isRTL(): boolean {
        return this.currentLocale === 'he';
    }

    /**
     * Get direction string
     * @returns {string} 'rtl' or 'ltr'
     */
    getDirection(): 'rtl' | 'ltr' {
        return this.isRTL() ? 'rtl' : 'ltr';
    }
}

// Create singleton instance - use window to survive HMR (Hot Module Replacement)
// This ensures listeners are preserved across Vite dev server updates
let i18n: I18nService;
if (typeof window !== 'undefined' && window.__i18n_instance) {
    i18n = window.__i18n_instance;
    console.log('[i18n] Reusing existing instance (HMR safe)');
} else {
    i18n = new I18nService();
    if (typeof window !== 'undefined') {
        window.__i18n_instance = i18n;
    }
}

// Export for module usage
export default i18n;
export { i18n };
