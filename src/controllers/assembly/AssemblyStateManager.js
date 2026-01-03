import { WEAPONS, DAMAGE_ELEMENTS, ENCHANTMENT_TIERS, SPECIAL_ABILITIES, EMBEDDABLE_SPELLS, EXTRA_DAMAGE_DICE } from '../../data/assembly-tokens.ts';
import { ARMOR, WONDROUS } from '../../data/assembly-armor.ts';

export class AssemblyStateManager {
    constructor() {
        this.currentBuild = {
            base: null,
            element: null,
            damageDice: null,
            rarity: null,
            abilities: [],
            modifiers: { attunement: false, cursed: false },
            totalCost: 0,
            maxBudget: 8
        };

        // Configuration
        this.RARITY_BUDGETS = {
            'Common': { max: 4 },
            'Uncommon': { max: 6 },
            'Rare': { max: 8 },
            'Very Rare': { max: 12 },
            'Legendary': { max: 16 }
        };
    }

    reset() {
        this.currentBuild = {
            base: null,
            element: null,
            damageDice: null,
            rarity: null,
            abilities: [],
            modifiers: { attunement: false, cursed: false },
            totalCost: 0,
            maxBudget: 8 // default
        };
    }

    setSocket(type, data) {
        switch (type) {
            case 'base':
                this.currentBuild.base = data;
                break;
            case 'element':
                // Element can include both dice and element type
                if (data.type === 'damage-dice') {
                    this.currentBuild.damageDice = data;
                } else {
                    this.currentBuild.element = data;
                }
                break;
            case 'rarity':
                this.currentBuild.rarity = data;
                break;
            case 'ability':
                if (!this.currentBuild.abilities.find(a => a.id === data.id)) {
                    this.currentBuild.abilities.push(data);
                }
                break;
        }
        this.recalculateBudget();
    }

    clearSocket(type) {
        switch (type) {
            case 'base':
                this.currentBuild.base = null;
                break;
            case 'element':
                this.currentBuild.element = null;
                this.currentBuild.damageDice = null;
                break;
            case 'rarity':
                this.currentBuild.rarity = null;
                break;
            case 'ability':
                this.currentBuild.abilities = [];
                break;
        }
        this.recalculateBudget();
    }

    removeAbility(index) {
        if (index >= 0 && index < this.currentBuild.abilities.length) {
            this.currentBuild.abilities.splice(index, 1);
            this.recalculateBudget();
        }
    }

    updateMaxBudget(selectedRarity) {
        const config = this.RARITY_BUDGETS[selectedRarity] || { max: 8 };
        let max = config.max;
        if (this.currentBuild.modifiers.attunement) max += 2;
        if (this.currentBuild.modifiers.cursed) max += 1;

        this.currentBuild.maxBudget = max;
        this.recalculateBudget();
    }

    recalculateBudget() {
        let cost = 0;

        if (this.currentBuild.rarity) cost += (this.currentBuild.rarity.cost || 0);
        if (this.currentBuild.damageDice) cost += (this.currentBuild.damageDice.cost || 0);
        if (this.currentBuild.element) cost += (this.currentBuild.element.cost || 0);

        this.currentBuild.abilities.forEach(a => cost += (a.cost || 0));

        this.currentBuild.totalCost = cost;
    }

    getBreakdown() {
        const breakdown = [];
        if (this.currentBuild.rarity) breakdown.push({ name: this.currentBuild.rarity.name, cost: this.currentBuild.rarity.cost });
        if (this.currentBuild.damageDice) breakdown.push({ name: this.currentBuild.damageDice.name, cost: this.currentBuild.damageDice.cost });
        if (this.currentBuild.element) {
            const c = this.currentBuild.element.cost;
            if (c > 0) breakdown.push({ name: this.currentBuild.element.name, cost: c });
        }
        this.currentBuild.abilities.forEach(a => breakdown.push({ name: a.name, cost: a.cost }));
        return breakdown;
    }

    canAfford(cost) {
        return (this.currentBuild.totalCost + cost) <= this.currentBuild.maxBudget;
    }

    getBaseItemData() {
        const base = this.currentBuild.base;
        if (!base) return null;

        if (base.category === 'weapon') {
            for (const cat of Object.values(WEAPONS)) {
                if (cat.items[base.id]) return { ...cat.items[base.id], category: 'weapon' };
            }
        } else if (base.category === 'armor' || base.category === 'shield') {
            for (const cat of Object.values(ARMOR)) {
                if (cat.items[base.id]) return { ...cat.items[base.id], category: base.category };
            }
        }
        return null;
    }

    getGenerationData(itemName, flavorText, locale = 'en') {
        const isHebrew = locale === 'he';
        const baseData = this.getBaseItemData();

        const rarityMap = { moonTouched: 'Common', plus1: 'Uncommon', plus2: 'Rare', plus3: 'Very Rare' };
        const rarity = rarityMap[this.currentBuild.rarity?.id] || 'Uncommon';

        let elementInfo = null;
        if (this.currentBuild.damageDice && this.currentBuild.element) {
            const elemData = DAMAGE_ELEMENTS[this.currentBuild.element.id];
            const diceData = EXTRA_DAMAGE_DICE[this.currentBuild.damageDice.id];
            elementInfo = {
                dice: diceData?.dice,
                element: isHebrew ? elemData?.nameHe : elemData?.nameEn,
                elementId: this.currentBuild.element.id,
                icon: elemData?.icon
            };
        }

        return {
            base: baseData,
            baseToken: this.currentBuild.base,
            rarity,
            enchantmentBonus: this.currentBuild.rarity?.id === 'plus3' ? 3 :
                this.currentBuild.rarity?.id === 'plus2' ? 2 :
                    this.currentBuild.rarity?.id === 'plus1' ? 1 : 0,
            element: elementInfo,
            abilities: this.currentBuild.abilities.map(a => ({
                id: a.id,
                name: a.name,
                icon: a.icon
            })),
            modifiers: this.currentBuild.modifiers,
            itemName,
            flavorText,
            totalCost: this.currentBuild.totalCost,
            locale
        };
    }

    // ==========================================
    // DATA RETRIEVAL
    // ==========================================

    getBaseTokens(subcategory, isHebrew) {
        const tokens = [];

        if (subcategory === 'melee' || subcategory === 'ranged') {
            // Weapons
            const categoryData = WEAPONS[subcategory];
            if (categoryData) {
                Object.entries(categoryData.items).forEach(([id, item]) => {
                    tokens.push({
                        id,
                        type: 'base',
                        category: 'weapon',
                        name: isHebrew ? item.nameHe : item.name,
                        icon: item.icon,
                        cost: item.cost || 0
                    });
                });
            }
        } else if (subcategory === 'heavy' || subcategory === 'medium' || subcategory === 'light' || subcategory === 'shield') {
            // Armor
            const categoryData = ARMOR[subcategory];
            if (categoryData) {
                Object.entries(categoryData.items).forEach(([id, item]) => {
                    tokens.push({
                        id,
                        type: 'base',
                        category: subcategory === 'shield' ? 'shield' : 'armor',
                        name: isHebrew ? item.nameHe : item.name,
                        icon: item.icon,
                        cost: item.cost || 0
                    });
                });
            }
        } else if (subcategory === 'jewelry' || subcategory === 'held' || subcategory === 'worn') {
            // Wondrous
            const categoryData = WONDROUS?.[subcategory];
            if (categoryData) {
                Object.entries(categoryData.items).forEach(([id, item]) => {
                    tokens.push({
                        id,
                        type: 'base',
                        category: 'wondrous',
                        name: isHebrew ? item.nameHe : item.name,
                        icon: item.icon,
                        cost: item.cost || 0
                    });
                });
            }
        }

        return tokens;
    }

    getElementTokens(isHebrew) {
        const tokens = [];

        // 1. Elements
        Object.values(DAMAGE_ELEMENTS).forEach(elem => {
            tokens.push({
                id: elem.id,
                type: 'element',
                category: 'essence',
                name: isHebrew ? elem.nameHe : elem.nameEn,
                icon: elem.icon,
                cost: 1
            });
        });

        // 2. Dice
        Object.entries(EXTRA_DAMAGE_DICE).forEach(([id, dice]) => {
            tokens.push({
                id: id,
                type: 'damage-dice',
                category: 'dice',
                name: dice.dice,
                icon: '🎲',
                cost: dice.cost
            });
        });

        return tokens;
    }

    getRarityTokens(isHebrew) {
        return Object.entries(ENCHANTMENT_TIERS).map(([id, tier]) => ({
            id,
            type: 'rarity',
            category: 'enchantment',
            name: isHebrew ? tier.nameHe : tier.name,
            icon: tier.icon,
            cost: tier.cost
        }));
    }

    getAbilityTokens(subcategory, isHebrew) {
        const tokens = [];

        Object.entries(SPECIAL_ABILITIES).forEach(([id, ability]) => {
            tokens.push({
                id,
                type: 'ability',
                category: 'feature',
                name: isHebrew ? ability.nameHe : ability.name,
                icon: ability.icon,
                cost: ability.cost
            });
        });

        // Add Spells if applicable (simplified)
        if (subcategory === 'jewelry' || subcategory === 'held') {
            Object.entries(EMBEDDABLE_SPELLS || {}).forEach(([id, spell]) => {
                tokens.push({
                    id,
                    type: 'ability',
                    category: 'spell',
                    name: isHebrew ? spell.nameHe : spell.name,
                    icon: '📜',
                    cost: spell.cost
                });
            });
        }

        return tokens;
    }
}
