/**
 * Items Config Index
 * ==================
 * Central export point for all item configuration
 * 
 * Usage:
 * import { ITEM_CATEGORIES, RARITIES, BASE_PRICES } from './config/items';
 */

// Item Types
export {
    ITEM_CATEGORIES,
    ITEM_TYPE_ICONS,
    ITEM_TYPE_LABELS,
    getItemCategory,
    getItemIcon,
    getItemLabel,
    getAllSubcategoryItems,
    type ItemCategory,
    type ItemSubcategory
} from './ItemTypes';

// Rarities
export {
    RARITIES,
    RARITY_ORDER,
    RARITY_LABELS,
    CR_RARITY_MAP,
    getRarity,
    getRarityColor,
    getRarityLabel,
    getRarityByTier,
    getCRRarityMapping,
    selectRandomRarity,
    type Rarity,
    type RarityLabel,
    type CRRarityMapping
} from './Rarities';

// Pricing
export {
    BASE_PRICES,
    ITEM_TYPE_MODIFIERS,
    calculatePrice,
    getPriceRange,
    formatGold,
    type PriceRange,
    type ItemTypeModifier
} from './PriceRanges';

// Generation Parameters
export {
    VISUAL_STYLES,
    RARITY_THEME_KEYWORDS,
    ITEM_TYPE_THEME_KEYWORDS,
    GENERATION_DEFAULTS,
    getVisualStyle,
    getThemeKeywords,
    buildPromptModifiers,
    type VisualStyle,
    type ThemeKeywords
} from './GenerationParams';

// Power Budget System (unified abilities + points)
export {
    RARITY_BUDGETS,
    DAMAGE_ELEMENTS,
    ABILITIES,
    BUDGET_MODIFIERS,
    getAllAbilitiesFlat,
    calculateTotalCost,
    getEffectiveBudget,
    determineRarity,
    calculateGoldPrice,
    validateBudget,
    type Ability,
    type RarityBudget,
    type DamageElement,
    type BudgetModifier
} from './PowerBudget';
