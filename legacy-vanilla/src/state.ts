// @ts-nocheck
import './storage/StorageManager';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { I18nService } from './i18n';
import { SLIDER_DEFAULTS } from './config/SliderDefaults';
import { clampFontSize } from './config/FontSizeLimits';

// Define Interfaces

export interface FontSizes {
    [key: string]: number;
}

export interface Offsets {
    [key: string]: number;
}

export interface FontStyles {
    [key: string]: boolean;
}

export interface SideSettings {
    fontSizes: FontSizes;
    offsets: Offsets;
    fontStyles: FontStyles;
}

export interface StyleSettings {
    fontFamily: string;
    imageStyle: string;
    imageColor: string;
    textOutlineEnabled: boolean;
    textOutlineWidth: number;
    textShadowEnabled: boolean;
    textShadowBlur: number;
    textBackdropEnabled: boolean;
    textBackdropOpacity: number;
    [key: string]: unknown;
}

export interface AppSettings {
    front: SideSettings;
    back: SideSettings;
    style: StyleSettings;
}

export interface CardFaceFront {
    title: string;
    type: string;
    rarity: string;
    imageUrl: string | null;
    imageStyle: string;
    quickStats: string;
    gold: string;
    badges: string[];
    [key: string]: unknown;
}

export interface CardFaceBack {
    title: string;
    mechanics: string;
    lore: string;
    [key: string]: unknown;
}

export interface CardData {
    id?: number;
    timestamp?: number;
    front?: CardFaceFront;
    back?: CardFaceBack;

    // Legacy / Root stats
    name?: string;
    type?: string;
    rarity?: string;
    weaponDamage?: string;
    damageType?: string;
    armorClass?: string;
    versatileDamage?: string | null;
    weaponProperties?: string[];
    legacy?: boolean;

    // Legacy fields possibly present during migration
    typeHe?: string;
    rarityHe?: string;
    quickStats?: string;
    gold?: string;
    abilityName?: string;
    abilityDesc?: string;
    description?: string;
    imageUrl?: string | null;
    imageStyle?: string;

    [key: string]: unknown;
}

export interface AppState {
    cardData: CardData | null;
    isFlipped: boolean;
    settings: AppSettings;
    lastContext: unknown | null;
    lastVisualPrompt: string | null;
}

export interface HistoryItem {
    id: number;
    name: string;
    cardData: CardData;
    settings: AppSettings;
    thumbnail: string | null;
    savedAt: string;
}

// Declare global storageManager & i18n
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storageManager: any;
        i18n?: I18nService;
    }
}

type StateListener = (state: AppState, changedKey: string) => void;

/**
 * StateManager - Centralized state management for the D&D Card Creator
 * Handles application state, data updates, and event subscriptions.
 */
export class StateManager {
    public state: AppState;
    private listeners: StateListener[];

    constructor() {
        this.state = {
            cardData: null,
            isFlipped: false, // Track which side is displayed
            settings: {
                // ===== FRONT SIDE SETTINGS (from SliderDefaults) =====
                front: {
                    fontSizes: { ...SLIDER_DEFAULTS.front.fontSizes },
                    offsets: { ...SLIDER_DEFAULTS.front.offsets },
                    fontStyles: { ...SLIDER_DEFAULTS.front.fontStyles }
                },
                // ===== BACK SIDE SETTINGS (from SliderDefaults) =====
                back: {
                    fontSizes: { ...SLIDER_DEFAULTS.back.fontSizes },
                    offsets: { ...SLIDER_DEFAULTS.back.offsets },
                    fontStyles: { ...SLIDER_DEFAULTS.back.fontStyles }
                },
                // ===== SHARED SETTINGS =====
                style: {
                    fontFamily: 'Heebo',
                    imageStyle: 'natural',
                    imageColor: '#ffffff',
                    // Text effects
                    textOutlineEnabled: false,
                    textOutlineWidth: 2,
                    textShadowEnabled: false,
                    textShadowBlur: 4,
                    textBackdropEnabled: false,
                    textBackdropOpacity: 40
                }
            },
            lastContext: null,
            lastVisualPrompt: null // Store last used visual prompt for regeneration
        };

        this.listeners = [];

        // Initialize DB
        this.initStorage();
    }

    /**
     * Subscribe to state changes
     * @param listener - Callback function receiving (newState, changedKey)
     * @returns Unsubscribe function
     */
    subscribe(listener: StateListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all listeners of state changes
     * @param changedKey - The key that changed (e.g., 'cardData', 'settings.offsets')
     */
    notify(changedKey: string): void {
        this.listeners.forEach(listener => listener(this.state, changedKey));

        // Auto-save on meaningful changes
        if (changedKey === 'cardData' || changedKey.startsWith('cardData.') || changedKey.startsWith('settings.')) {
            this.saveCurrentCard();
        }
    }

    /**
     * Ensure data follows V2 structure (Front/Back)
     * @param data - Raw card data
     * @returns V2 Compliant Data
     */
    migrateToV2(data: CardData): CardData {
        if (data.front && data.back) {
            return data; // Already V2
        }

        console.log("📦 Migrating Card Data to V2 (Double-Sided)...");

        // V1 -> V2 Migration
        return {
            id: data.id || Date.now(),
            timestamp: data.timestamp || Date.now(),
            front: {
                title: data.name || '',
                type: data.type || data.typeHe || '',
                rarity: data.rarity || data.rarityHe || '', // Fallback to provided defaults if needed
                imageUrl: data.imageUrl || null,
                imageStyle: data.imageStyle || 'natural',
                quickStats: data.quickStats || '',
                gold: data.gold || '',
                badges: data.gold ? [data.gold] : []
            },
            back: {
                title: data.abilityName || '',
                mechanics: data.abilityDesc || '',
                lore: data.description || '' // Fluff maps to Lore
            },
            // ✅ CRITICAL: Preserve ALL weapon/armor stats at root for renderer access
            // These fields MUST be preserved or they won't display on the card!
            weaponDamage: data.weaponDamage || '',
            damageType: data.damageType || '',
            armorClass: data.armorClass || '',
            versatileDamage: data.versatileDamage || null,
            weaponProperties: data.weaponProperties || [],
            // ✅ Preserve Hebrew naming fields
            typeHe: data.typeHe || '',
            rarityHe: data.rarityHe || '',
            // ✅ Preserve quick-glance fields (critical for frontend display!)
            quickStats: data.quickStats || '',
            specialDamage: data.specialDamage || '',
            spellAbility: data.spellAbility || '',
            // ✅ Preserve ability fields for back card
            abilityName: data.abilityName || '',
            abilityDesc: data.abilityDesc || '',
            description: data.description || '',
            // ✅ Preserve visualization fields
            visualPrompt: data.visualPrompt || '',
            // ✅ Preserve pricing
            gold: data.gold || '',
            // Keep specific legacy fields if needed for direct access
            legacy: true
        };
    }

    /**
     * Set the entire card data
     * @param data - New card data
     */
    setCardData(data: CardData): void {
        this.state.cardData = this.migrateToV2(data);
        // NOTE: Do NOT merge fontSizes/offsets from cardData here
        // New cards should use the default layout values from resetToDefaults()
        // The layout is applied separately via onAutoLayout() after card generation
        this.notify('cardData');
    }

    /**
     * Update a specific field in card data
     * Supports dot notation: 'front.title', 'back.mechanics'
     * @param path - Field path
     * @param value - New value
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateCardField(path: string, value: any): void {
        if (!this.state.cardData) return;

        // Handle Dot Notation for nested updates
        if (path.includes('.')) {
            const keys = path.split('.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let current: any = this.state.cardData;

            // Traverse to parent
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}; // Create if missing
                current = current[keys[i]];
            }

            // Set value
            current[keys[keys.length - 1]] = value;
        } else {
            // Fallback for flat keys
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.state.cardData as any)[path] = value;
        }

        this.notify(`cardData.${path}`);
    }

    // Helper to batch update multiple fields
    updateCardData(updates: Partial<CardData>): void {
        if (!this.state.cardData) return;
        this.state.cardData = { ...this.state.cardData, ...updates };
        this.notify('cardData');
    }

    /**
     * Determine which side (front/back) an offset key belongs to
     */
    _getSideForKey(key: string): 'front' | 'back' {
        // Back-side specific keys
        const backKeys = ['abilityName', 'mech', 'lore', 'mechWidth', 'loreWidth'];
        if (backKeys.includes(key)) return 'back';

        // Front-side keys (default)
        return 'front';
    }

    /**
     * Update a specific offset setting
     */
    updateOffset(key: string, value: number): void {
        // Debug: Log when gold is being set (to catch override after resetToDefaults)
        if (key === 'gold') {
            console.warn(`⚠️ updateOffset('gold', ${value}) called!`, new Error().stack);
        }

        const side = this._getSideForKey(key);
        // Ensure structure exists
        if (!this.state.settings[side]) {
            // Should verify side is 'front' or 'back' before assignment if strict, but strict typing handles it
        }

        this.state.settings[side].offsets[key] = value;
        this.notify(`settings.${side}.offsets.${key}`);
    }

    /**
     * Get a specific offset value
     */
    getOffset(key: string): number | undefined {
        const side = this._getSideForKey(key);
        return this.state.settings[side]?.offsets?.[key];
    }

    /**
     * Determine which side a font size key belongs to
     */
    _getSideForFontSizeKey(key: string): 'front' | 'back' {
        // Back-side specific font sizes
        const backKeys = ['abilityNameSize', 'mechSize', 'loreSize'];
        if (backKeys.includes(key)) return 'back';

        return 'front';
    }

    /**
     * Update a specific font size
     * Uses centralized FontSizeLimits from config
     */
    updateFontSize(key: string, change: number): void {
        const side = this._getSideForFontSizeKey(key);
        const current = this.state.settings[side].fontSizes[key] || 24;
        const rawSize = current + (change * 2);

        // Use centralized font size limits from config
        const newSize = clampFontSize(key, rawSize);

        this.state.settings[side].fontSizes[key] = newSize;
        this.notify(`settings.${side}.fontSizes.${key}`);
    }

    /**
     * Update style settings
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateStyle(key: string, value: any): void {
        // Ensure style object exists
        if (!this.state.settings.style) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.state.settings.style = {} as any;
        }
        console.log('StateManager.updateStyle:', key, value, 'before:', this.state.settings.style[key]);
        this.state.settings.style[key] = value;
        console.log('StateManager.updateStyle:', key, 'after:', this.state.settings.style[key]);
        this.notify(`settings.style.${key}`);
    }

    /**
     * Determine which side a font style key belongs to
     */
    _getSideForFontStyleKey(key: string): 'front' | 'back' {
        // Back-side specific font styles (prefix-based)
        const backPrefixes = ['abilityName', 'mech', 'lore'];
        for (const prefix of backPrefixes) {
            if (key.startsWith(prefix)) return 'back';
        }
        return 'front';
    }

    /**
     * Update font style (bold/italic)
     */
    updateFontStyle(key: string, value: boolean): void {
        const side = this._getSideForFontStyleKey(key);
        this.state.settings[side].fontStyles[key] = value;
        this.notify(`settings.${side}.fontStyles.${key}`);
    }

    /**
     * Set the last context (e.g., background image URL)
     */
    setLastContext(context: unknown): void {
        this.state.lastContext = context;
        this.notify('lastContext');
    }

    /**
     * Set the last visual prompt (for image regeneration)
     */
    setLastVisualPrompt(prompt: string | null): void {
        this.state.lastVisualPrompt = prompt;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        console.log('💾 Saved lastVisualPrompt:', prompt?.substring(0, 50) + '...');
        // No notify needed - this is just for internal use
    }

    /**
     * Reset all settings (offsets, font sizes, font styles) to their default values
     * Uses centralized SLIDER_DEFAULTS as the single source of truth
     */
    resetToDefaults(): void {
        console.log('🔄 resetToDefaults called, BEFORE: gold=', this.state.settings.front?.offsets?.gold);

        // Reset front side settings from centralized config
        this.state.settings.front = {
            fontSizes: { ...SLIDER_DEFAULTS.front.fontSizes },
            offsets: { ...SLIDER_DEFAULTS.front.offsets },
            fontStyles: { ...SLIDER_DEFAULTS.front.fontStyles }
        };

        // Reset back side settings from centralized config
        this.state.settings.back = {
            fontSizes: { ...SLIDER_DEFAULTS.back.fontSizes },
            offsets: { ...SLIDER_DEFAULTS.back.offsets },
            fontStyles: { ...SLIDER_DEFAULTS.back.fontStyles }
        };

        console.log('🔄 resetToDefaults AFTER: gold=', this.state.settings.front?.offsets?.gold);
        console.log('🔄 Settings reset to defaults (from SliderDefaults.ts)');
        this.notify('settings');
    }

    /**
     * Get current state
     */
    getState(): AppState {
        return this.state;
    }

    // ==================== localStorage Persistence ====================

    saveCurrentCard(): void {
        if (!this.state.cardData) return;

        const saveData = {
            cardData: { ...this.state.cardData },
            settings: this.state.settings,
            savedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem('dnd_current_card', JSON.stringify(saveData));
            console.log('💾 Card saved to localStorage');
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((e as any).name === 'QuotaExceededError') {
                console.warn('💾 localStorage quota exceeded, attempting cleanup...');

                // 1. Clear image data
                if (saveData.cardData.front) saveData.cardData.front.imageUrl = null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((saveData.cardData as any).imageUrl) (saveData.cardData as any).imageUrl = null;

                // 2. Clear legacy history from localStorage (should be in IndexedDB by now)
                if (localStorage.getItem('dnd_card_history')) {
                    console.log('🧹 Clearing legacy dnd_card_history to free space');
                    localStorage.removeItem('dnd_card_history');
                }

                try {
                    localStorage.setItem('dnd_current_card', JSON.stringify(saveData));
                    console.log('✅ Saved card without image data after cleanup');
                } catch (e2) {
                    console.warn('⚠️ Could not save current card even after cleanup (Storage full)');
                }
            }
        }
    }


    loadCurrentCard(): boolean {
        try {
            const saved = localStorage.getItem('dnd_current_card');
            if (!saved) return false;

            const data = JSON.parse(saved);
            if (data.cardData) {
                // Clear blob URLs as they don't survive page refresh
                // Legacy check
                if (data.cardData.imageUrl && data.cardData.imageUrl.startsWith('blob:')) {
                    console.log('📂 Clearing stale blob URL from saved card');
                    data.cardData.imageUrl = null;
                }
                // V2 check
                if (data.cardData.front?.imageUrl && data.cardData.front.imageUrl.startsWith('blob:')) {
                    console.log('📂 Clearing stale blob URL from saved card (front)');
                    data.cardData.front.imageUrl = null;
                }

                // Ensure data is V2 compliant (Migrate on load)
                this.state.cardData = this.migrateToV2(data.cardData);

                // Deep merge settings to preserve nested objects
                if (data.settings) {
                    this.state.settings = {
                        ...this.state.settings,
                        ...data.settings,
                        front: {
                            ...this.state.settings.front,
                            ...(data.settings.front || {}),
                            offsets: { ...this.state.settings.front.offsets, ...(data.settings.front?.offsets || {}) },
                            fontSizes: { ...this.state.settings.front.fontSizes, ...(data.settings.front?.fontSizes || {}) },
                            fontStyles: { ...this.state.settings.front.fontStyles, ...(data.settings.front?.fontStyles || {}) }
                        },
                        back: {
                            ...this.state.settings.back,
                            ...(data.settings.back || {}),
                            offsets: { ...this.state.settings.back.offsets, ...(data.settings.back?.offsets || {}) },
                            fontSizes: { ...this.state.settings.back.fontSizes, ...(data.settings.back?.fontSizes || {}) },
                            fontStyles: { ...this.state.settings.back.fontStyles, ...(data.settings.back?.fontStyles || {}) }
                        },
                        style: {
                            ...this.state.settings.style,
                            ...(data.settings.style || {})
                        }
                    };
                }
                this.notify('cardData');
                console.log('📂 Card loaded from localStorage');
                return true;
            }
        } catch (e) {
            console.error('Failed to load card from localStorage:', e);
        }
        return false;
    }

    // ==================== StorageManager Integration (IndexedDB) ====================

    async initStorage(): Promise<void> {
        if (!window.storageManager) return;

        // Check if migration is needed (if localStorage has items but DB is empty-ish)
        const localHistory = localStorage.getItem('dnd_card_history');
        if (localHistory) {
            try {
                const items = JSON.parse(localHistory);
                if (items.length > 0) {
                    console.log(`📦 Migrating ${items.length} items from localStorage to IndexedDB...`);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    for (const item of items) {
                        await window.storageManager.saveCard(item);
                    }
                    // Clear localStorage after successful migration
                    localStorage.removeItem('dnd_card_history');
                    console.log("✅ Migration complete. LocalStorage history cleared.");
                }
            } catch (e) {
                console.error("Migration failed:", e);
            }
        }
    }

    async saveToHistory(thumbnail: string | null = null): Promise<void> {
        if (!this.state.cardData) return;

        // Get base name from card data
        let baseName = this.state.cardData.front?.title ||
            this.state.cardData.name ||
            this.state.cardData.type ||
            this.state.cardData.front?.rarity ||
            (window.i18n?.t('toasts.unnamed') || 'Unnamed Item');

        // Remove any existing number suffix
        baseName = baseName.replace(/\s*\d+$/, '').trim();

        // Get all existing cards to find duplicates
        const existingCards = await window.storageManager.getAllCards();

        // Find cards with the same base name
        let maxNumber = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingCards.forEach((card: any) => {
            if (card.name) {
                // Extract base name and number from existing card names
                const match = card.name.match(/^(.+?)\s*(\d+)?$/);
                if (match) {
                    const existingBase = match[1].trim();
                    const existingNum = parseInt(match[2]) || 1;

                    if (existingBase === baseName) {
                        maxNumber = Math.max(maxNumber, existingNum);
                    }
                }
            }
        });

        // Create unique name with incremented counter
        const uniqueName = maxNumber > 0 ? `${baseName} ${maxNumber + 1}` : baseName;

        const historyItem: HistoryItem = {
            id: Date.now(),
            name: uniqueName,
            cardData: this.state.cardData,
            settings: this.state.settings,
            thumbnail: thumbnail,
            savedAt: new Date().toISOString()
        };

        await window.storageManager.saveCard(historyItem);
        this.notify('historyUpdated');
        console.log(`📚 Card saved to DB as "${uniqueName}"`);
    }

    async getHistory(): Promise<HistoryItem[]> {
        return await window.storageManager.getAllCards();
    }

    async loadFromHistory(id: number): Promise<boolean> {
        // We need to fetch all or find specific. getAll is fine for now.
        const history = await this.getHistory();
        const card = history.find(item => item.id === id);

        if (card) {
            // Clear blob URLs (they don't survive page refresh)
            if (card.cardData.imageUrl && card.cardData.imageUrl.startsWith('blob:')) {
                card.cardData.imageUrl = null;
            }
            if (card.cardData.front?.imageUrl && card.cardData.front.imageUrl.startsWith('blob:')) {
                card.cardData.front.imageUrl = null;
            }

            this.state.cardData = card.cardData;

            // Deep merge settings to preserve nested objects (front, back, style)
            if (card.settings) {
                this.state.settings = {
                    ...this.state.settings,
                    ...card.settings,
                    front: {
                        ...this.state.settings.front,
                        ...(card.settings.front || {}),
                        offsets: { ...this.state.settings.front.offsets, ...(card.settings.front?.offsets || {}) },
                        fontSizes: { ...this.state.settings.front.fontSizes, ...(card.settings.front?.fontSizes || {}) },
                        fontStyles: { ...this.state.settings.front.fontStyles, ...(card.settings.front?.fontStyles || {}) }
                    },
                    back: {
                        ...this.state.settings.back,
                        ...(card.settings.back || {}),
                        offsets: { ...this.state.settings.back.offsets, ...(card.settings.back?.offsets || {}) },
                        fontSizes: { ...this.state.settings.back.fontSizes, ...(card.settings.back?.fontSizes || {}) },
                        fontStyles: { ...this.state.settings.back.fontStyles, ...(card.settings.back?.fontStyles || {}) }
                    },
                    style: {
                        ...this.state.settings.style,
                        ...(card.settings.style || {})
                    }
                };
            }
            this.notify('cardData');
            console.log('📂 Card loaded from DB:', card.name);
            return true;
        }
        return false;
    }

    async deleteFromHistory(id: number): Promise<void> {
        await window.storageManager.deleteCard(id);
        this.notify('historyUpdated');
        console.log('🗑️ Card deleted from DB');
    }

    async clearHistory(): Promise<void> {
        await window.storageManager.clearAll();
        this.notify('historyUpdated');
        console.log('🗑️ DB History cleared');
    }

    clearCurrentCard(): void {
        localStorage.removeItem('dnd_current_card');
        this.state.cardData = null;
        this.notify('cardData');
        console.log('🗑️ Current card cleared');
    }
}

// Export singleton
export const stateManager = new StateManager();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).stateManager = stateManager; // For debugging
