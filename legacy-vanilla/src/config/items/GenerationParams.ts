/**
 * GenerationParams.ts
 * ====================
 * Single source of truth for AI generation parameters
 * 
 * Contains:
 * - Visual style options
 * - Theme keywords per item type
 * - AI prompt templates
 * - Generation defaults
 */

export interface VisualStyle {
    id: string;
    labelHe: string;
    labelEn: string;
    promptModifier: string;
}

export interface ThemeKeywords {
    he: string[];
    en: string[];
}

// ==================== VISUAL STYLES ====================
export const VISUAL_STYLES: VisualStyle[] = [
    {
        id: 'realistic',
        labelHe: 'ריאליסטי',
        labelEn: 'Realistic',
        promptModifier: 'photorealistic, detailed, high quality'
    },
    {
        id: 'fantasy_art',
        labelHe: 'אמנות פנטזיה',
        labelEn: 'Fantasy Art',
        promptModifier: 'fantasy art style, painterly, vibrant colors'
    },
    {
        id: 'watercolor',
        labelHe: 'צבעי מים',
        labelEn: 'Watercolor',
        promptModifier: 'watercolor painting, soft edges, artistic'
    },
    {
        id: 'pixel_art',
        labelHe: 'פיקסל ארט',
        labelEn: 'Pixel Art',
        promptModifier: '16-bit pixel art style, retro gaming'
    },
    {
        id: 'dark_fantasy',
        labelHe: 'פנטזיה אפלה',
        labelEn: 'Dark Fantasy',
        promptModifier: 'dark fantasy, gritty, ominous, dramatic lighting'
    },
    {
        id: 'anime',
        labelHe: 'אנימה',
        labelEn: 'Anime',
        promptModifier: 'anime style, cel shaded, vibrant'
    }
];

// ==================== THEME KEYWORDS BY RARITY ====================
export const RARITY_THEME_KEYWORDS: Record<string, ThemeKeywords> = {
    mundane: {
        he: ['פשוט', 'רגיל', 'יומיומי', 'מעשי'],
        en: ['simple', 'plain', 'everyday', 'practical']
    },
    common: {
        he: ['נפוץ', 'בסיסי', 'סטנדרטי'],
        en: ['common', 'basic', 'standard']
    },
    uncommon: {
        he: ['מיוחד', 'ייחודי', 'משופר', 'קסום קלות'],
        en: ['special', 'unique', 'enhanced', 'slightly magical']
    },
    rare: {
        he: ['נדיר', 'עוצמתי', 'קסום', 'זוהר'],
        en: ['rare', 'powerful', 'magical', 'glowing']
    },
    veryRare: {
        he: ['נדיר מאוד', 'אגדי', 'עתיק', 'עוצמתי ביותר'],
        en: ['very rare', 'legendary', 'ancient', 'extremely powerful']
    },
    legendary: {
        he: ['אגדי', 'מיתי', 'אלוהי', 'אינסופי'],
        en: ['legendary', 'mythical', 'divine', 'infinite']
    }
};

// ==================== THEME KEYWORDS BY ITEM TYPE ====================
export const ITEM_TYPE_THEME_KEYWORDS: Record<string, ThemeKeywords> = {
    weapon: {
        he: ['חד', 'קטלני', 'מאוזן', 'קרבי'],
        en: ['sharp', 'deadly', 'balanced', 'battle-ready']
    },
    armor: {
        he: ['מגן', 'חזק', 'עמיד', 'מעוצב'],
        en: ['protective', 'sturdy', 'durable', 'crafted']
    },
    potion: {
        he: ['נוזלי', 'זוהר', 'מבעבע', 'צבעוני'],
        en: ['liquid', 'glowing', 'bubbling', 'colorful']
    },
    ring: {
        he: ['אלגנטי', 'מעודן', 'קסום', 'יקר'],
        en: ['elegant', 'refined', 'enchanted', 'precious']
    },
    wondrous: {
        he: ['מסתורי', 'קסום', 'ייחודי', 'פלאי'],
        en: ['mysterious', 'magical', 'unique', 'wondrous']
    },
    scroll: {
        he: ['עתיק', 'כתוב', 'קסום', 'מסתורי'],
        en: ['ancient', 'inscribed', 'magical', 'mysterious']
    },
    staff: {
        he: ['עוצמתי', 'עתיק', 'רוני', 'קסום'],
        en: ['powerful', 'ancient', 'runic', 'magical']
    },
    wand: {
        he: ['עדין', 'קסום', 'זוהר', 'אלגנטי'],
        en: ['delicate', 'magical', 'glowing', 'elegant']
    }
};

// ==================== GENERATION DEFAULTS ====================
export const GENERATION_DEFAULTS = {
    defaultVisualStyle: 'realistic',
    defaultImageSize: { width: 512, height: 512 },
    maxAbilityLength: 200,
    maxDescriptionLength: 500,
    defaultFontFamily: 'Heebo'
};

// ==================== HELPER FUNCTIONS ====================
export function getVisualStyle(id: string): VisualStyle | undefined {
    return VISUAL_STYLES.find(style => style.id === id);
}

export function getThemeKeywords(
    rarityId: string,
    itemTypeId: string,
    locale: 'he' | 'en' = 'he'
): string[] {
    const rarityKeywords = RARITY_THEME_KEYWORDS[rarityId]?.[locale] || [];
    const typeKeywords = ITEM_TYPE_THEME_KEYWORDS[itemTypeId]?.[locale] || [];
    return [...rarityKeywords, ...typeKeywords];
}

export function buildPromptModifiers(
    rarityId: string,
    itemTypeId: string,
    visualStyleId: string
): string {
    const style = getVisualStyle(visualStyleId);
    const keywords = getThemeKeywords(rarityId, itemTypeId, 'en');

    return [
        style?.promptModifier || '',
        ...keywords
    ].filter(Boolean).join(', ');
}

export default VISUAL_STYLES;
