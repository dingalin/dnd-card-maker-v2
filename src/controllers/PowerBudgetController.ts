// @ts-nocheck
/**
 * PowerBudgetController
 * Manages the Power Budget UI for manual item ability selection
 */

import {
    RARITY_BUDGETS,
    ABILITY_COSTS,
    calculateTotalCost,
    getEffectiveBudget,
    validateBudget,
    determineRarity,
    calculateGoldPrice,
    getConflictingAbility,
    getAllAbilitiesFlat,
    buildItemProperties,
    generateRandomAbilities,
    isWeaponType,
    isResistanceType,
    getResistanceForElement,
    getElementForResistance,
    getSelectedElement,
    getSelectedResistance,
    getSelectedDamageDice
} from '../data/power-budget.ts';

import i18n from '../i18n.ts';

interface Modifiers {
    attunement: boolean;
    cursed: boolean;
    consumable: boolean;
}

interface ElementsCache {
    panel?: HTMLElement | null;
    budgetBarFill?: HTMLElement | null;
    budgetUsed?: HTMLElement | null;
    budgetMax?: HTMLElement | null;
    budgetRarity?: HTMLElement | null;
    rarityButtons?: HTMLElement | null;
    modeAuto?: HTMLElement | null;
    modeManual?: HTMLElement | null;
    abilityBuilder?: HTMLElement | null;
    elementSelector?: HTMLElement | null;
    selectedList?: HTMLElement | null;
    clearAbilitiesBtn?: HTMLElement | null;
    estimatedPrice?: HTMLElement | null;
    attunementCheckbox?: HTMLInputElement | null;
    cursedCheckbox?: HTMLInputElement | null;
}

export class PowerBudgetController {
    public selectedRarity: string;
    public selectedAbilities: string[];
    public modifiers: Modifiers;
    public mode: 'auto' | 'manual';
    public itemType: string;
    public elements: ElementsCache;

    constructor() {
        // State
        this.selectedRarity = 'Uncommon';
        this.selectedAbilities = [];
        this.modifiers = {
            attunement: false,
            cursed: false,
            consumable: false
        };
        this.mode = 'auto'; // 'auto' or 'manual'
        this.itemType = 'weapon';

        // DOM elements cache
        this.elements = {};

        // Bind methods
        this.handleRarityClick = this.handleRarityClick.bind(this);
        this.handleAbilityClick = this.handleAbilityClick.bind(this);
        this.handleElementClick = this.handleElementClick.bind(this);
        this.handleModeToggle = this.handleModeToggle.bind(this);
        this.handleModifierChange = this.handleModifierChange.bind(this);
        this.updateUI = this.updateUI.bind(this);
    }

    /**
     * Initialize the controller after DOM is ready
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateUI();

        console.log('PowerBudgetController initialized');
    }

    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            panel: document.getElementById('power-budget-panel'),
            budgetBarFill: document.getElementById('budget-bar-fill'),
            budgetUsed: document.getElementById('budget-used'),
            budgetMax: document.getElementById('budget-max'),
            budgetRarity: document.getElementById('budget-rarity'),
            rarityButtons: document.getElementById('rarity-buttons'),
            modeAuto: document.getElementById('mode-auto'),
            modeManual: document.getElementById('mode-manual'),
            abilityBuilder: document.getElementById('ability-builder'),
            elementSelector: document.getElementById('element-selector'),
            selectedList: document.getElementById('selected-list'),
            clearAbilitiesBtn: document.getElementById('clear-abilities-btn'),
            estimatedPrice: document.getElementById('estimated-price'),
            attunementCheckbox: document.getElementById('budget-attunement') as HTMLInputElement,
            cursedCheckbox: document.getElementById('budget-cursed') as HTMLInputElement
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Mode toggle
        this.elements.modeAuto?.addEventListener('click', () => this.handleModeToggle('auto'));
        this.elements.modeManual?.addEventListener('click', () => this.handleModeToggle('manual'));

        // Rarity buttons
        this.elements.rarityButtons?.querySelectorAll('.rarity-btn').forEach(btn => {
            btn.addEventListener('click', this.handleRarityClick);
        });

        // Modifiers
        this.elements.attunementCheckbox?.addEventListener('change', this.handleModifierChange);
        this.elements.cursedCheckbox?.addEventListener('change', this.handleModifierChange);

        // Ability buttons
        document.querySelectorAll('#ability-builder .ability-btn').forEach(btn => {
            btn.addEventListener('click', this.handleAbilityClick);
        });

        // Element buttons
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.addEventListener('click', this.handleElementClick);
        });

        // Clear button
        this.elements.clearAbilitiesBtn?.addEventListener('click', () => this.clearAllAbilities());

        // Item type selector - listen for changes
        const itemTypeSelect = document.getElementById('item-type');
        if (itemTypeSelect) {
            itemTypeSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.setItemType(target.value);
            });
        }
    }

    /**
     * Handle mode toggle (Auto/Manual)
     */
    handleModeToggle(mode: 'auto' | 'manual') {
        this.mode = mode;

        // Update button states
        this.elements.modeAuto?.classList.toggle('active', mode === 'auto');
        this.elements.modeManual?.classList.toggle('active', mode === 'manual');

        // Show/hide ability builder
        if (this.elements.abilityBuilder) {
            this.elements.abilityBuilder.classList.toggle('hidden', mode === 'auto');
        }

        // In auto mode, clear manual selections
        if (mode === 'auto') {
            this.selectedAbilities = [];
        }

        this.updateUI();
    }

    /**
     * Handle rarity button click
     */
    handleRarityClick(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const rarity = btn.dataset.rarity;

        if (!rarity) return;

        // Update selection
        this.selectedRarity = rarity;

        // Update button states
        this.elements.rarityButtons?.querySelectorAll('.rarity-btn').forEach(b => {
            // @ts-ignore
            b.classList.toggle('active', b.dataset.rarity === rarity);
        });

        this.updateUI();
    }

    /**
     * Handle ability button click
     */
    handleAbilityClick(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const abilityId = btn.dataset.ability;
        // const cost = parseInt(btn.dataset.cost || '0', 10);

        if (!abilityId || btn.classList.contains('disabled')) return;

        const allAbilities = getAllAbilitiesFlat();
        const ability = allAbilities[abilityId];

        // Check if already selected
        const isSelected = this.selectedAbilities.includes(abilityId);

        if (isSelected) {
            // Deselect
            this.selectedAbilities = this.selectedAbilities.filter((id: string) => id !== abilityId);
            btn.classList.remove('selected');

            // If deselecting extra damage, also deselect element
            if (ability?.requiresElement) {
                this.selectedAbilities = this.selectedAbilities.filter((id: string) => !ABILITY_COSTS.elements[id]);
                this.elements.elementSelector?.classList.add('hidden');
                document.querySelectorAll('.element-btn').forEach(el => el.classList.remove('selected'));
            }
        } else {
            // Check for exclusive conflicts
            const conflict = getConflictingAbility(abilityId, this.selectedAbilities);
            if (conflict) {
                // Remove conflicting ability
                this.selectedAbilities = this.selectedAbilities.filter((id: string) => id !== conflict);
                document.querySelector(`[data-ability="${conflict}"]`)?.classList.remove('selected');
            }

            // Check if can afford
            const validation = validateBudget([...this.selectedAbilities, abilityId], this.selectedRarity, this.modifiers);
            if (!validation.valid) {
                // Show feedback that can't afford
                this.showBudgetOverflow();
                return;
            }

            // Select
            this.selectedAbilities.push(abilityId);
            btn.classList.add('selected');

            // If selecting extra damage, show element selector
            if (ability?.requiresElement) {
                this.elements.elementSelector?.classList.remove('hidden');
            }
        }

        this.updateUI();
    }

    /**
     * Handle element button click
     */
    handleElementClick(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const element = btn.dataset.element;
        // const cost = parseInt(btn.dataset.cost || '0', 10);

        if (!element) return;

        // Check if we have extra damage selected
        const hasExtraDamage = this.selectedAbilities.some((id: string) =>
            id.startsWith('damage_')
        );

        if (!hasExtraDamage) return;

        // Remove any previous element selection
        this.selectedAbilities = this.selectedAbilities.filter((id: string) => !ABILITY_COSTS.elements[id]);
        document.querySelectorAll('.element-btn').forEach(el => el.classList.remove('selected'));

        // Check if can afford
        const validation = validateBudget([...this.selectedAbilities, element], this.selectedRarity, this.modifiers);
        if (!validation.valid) {
            this.showBudgetOverflow();
            return;
        }

        // Select element
        this.selectedAbilities.push(element);
        btn.classList.add('selected');

        this.updateUI();
    }

    /**
     * Handle modifier checkbox change
     */
    handleModifierChange() {
        this.modifiers.attunement = this.elements.attunementCheckbox?.checked || false;
        this.modifiers.cursed = this.elements.cursedCheckbox?.checked || false;

        this.updateUI();
    }

    /**
     * Clear all selected abilities
     */
    clearAllAbilities() {
        this.selectedAbilities = [];

        // Reset all ability button states
        document.querySelectorAll('#ability-builder .ability-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Hide element selector
        this.elements.elementSelector?.classList.add('hidden');

        this.updateUI();
    }

    /**
     * Show budget overflow feedback
     */
    showBudgetOverflow() {
        this.elements.budgetBarFill?.classList.add('overflow');

        setTimeout(() => {
            this.elements.budgetBarFill?.classList.remove('overflow');
        }, 500);
    }

    /**
     * Update the entire UI based on current state
     */
    updateUI() {
        const budget = getEffectiveBudget(this.selectedRarity, this.modifiers);
        const totalCost = calculateTotalCost(this.selectedAbilities, this.modifiers);
        const validation = validateBudget(this.selectedAbilities, this.selectedRarity, this.modifiers);

        // Update budget bar
        const percent = Math.min(100, (totalCost / budget) * 100);
        if (this.elements.budgetBarFill) {
            this.elements.budgetBarFill.style.width = `${percent}%`;
            this.elements.budgetBarFill.classList.remove('warning', 'danger');
            if (percent >= 90) {
                this.elements.budgetBarFill.classList.add('danger');
            } else if (percent >= 70) {
                this.elements.budgetBarFill.classList.add('warning');
            }
        }

        // Update budget numbers
        if (this.elements.budgetUsed) {
            this.elements.budgetUsed.textContent = totalCost.toString();
        }
        if (this.elements.budgetMax) {
            this.elements.budgetMax.textContent = budget.toString();
        }

        // Update rarity display
        const effectiveRarity = this.mode === 'manual' ? determineRarity(totalCost) : this.selectedRarity;
        if (this.elements.budgetRarity) {
            const rarityData = RARITY_BUDGETS[effectiveRarity];
            const iconEl = this.elements.budgetRarity.querySelector('.rarity-icon');
            if (iconEl) iconEl.textContent = rarityData?.icon || '⚪';
            const nameEl = this.elements.budgetRarity.querySelector('.rarity-name');
            if (nameEl) nameEl.textContent = i18n.t(`rarity.${effectiveRarity.toLowerCase().replace(' ', '')}`) || effectiveRarity;
        }

        // Update affordability of ability buttons
        this.updateAbilityStates(validation.remaining);

        // Update selected abilities list
        this.updateSelectedList();

        // Update price estimate
        this.updatePriceEstimate(totalCost, effectiveRarity);
    }

    /**
     * Update ability button enabled/disabled states based on remaining budget
     */
    updateAbilityStates(remaining: number) {
        const allAbilities = getAllAbilitiesFlat();

        document.querySelectorAll('#ability-builder .ability-btn').forEach(btn => {
            // @ts-ignore
            const abilityId = btn.dataset.ability;
            const ability = allAbilities[abilityId];

            if (!ability) return;

            const isSelected = this.selectedAbilities.includes(abilityId);
            const canAfford = ability.cost <= remaining;

            // Check for exclusive conflicts
            const hasConflict = !isSelected && getConflictingAbility(abilityId, this.selectedAbilities);

            btn.classList.toggle('disabled', !isSelected && (!canAfford || hasConflict));
        });

        // Update element buttons
        document.querySelectorAll('.element-btn').forEach(btn => {
            // @ts-ignore
            const element = btn.dataset.element;
            const elementData = ABILITY_COSTS.elements[element];

            if (!elementData) return;

            const isSelected = this.selectedAbilities.includes(element);
            const canAfford = elementData.cost <= remaining;

            btn.classList.toggle('disabled', !isSelected && !canAfford);
        });
    }

    /**
     * Update the selected abilities list in the summary
     */
    updateSelectedList() {
        if (!this.elements.selectedList) return;

        if (this.selectedAbilities.length === 0) {
            this.elements.selectedList.innerHTML = `
                <p class="empty-message" data-i18n="powerBudget.noAbilities">אין יכולות נבחרות</p>
            `;
            return;
        }

        const allAbilities = getAllAbilitiesFlat();
        const isHebrew = i18n.getLocale() === 'he';

        let html = '';
        for (const id of this.selectedAbilities) {
            const ability = allAbilities[id];
            if (ability) {
                const name = isHebrew ? (ability.nameHe || id) : (ability.nameEn || id);
                html += `
                    <span class="selected-tag" data-ability="${id}">
                        ${ability.icon || ''} ${name}
                        <button type="button" class="remove-btn" data-remove="${id}">×</button>
                    </span>
                `;
            }
        }

        this.elements.selectedList.innerHTML = html;

        // Bind remove buttons
        this.elements.selectedList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // @ts-ignore
                const abilityId = btn.dataset.remove;
                this.selectedAbilities = this.selectedAbilities.filter((id: string) => id !== abilityId);
                document.querySelector(`[data-ability="${abilityId}"]`)?.classList.remove('selected');
                this.updateUI();
            });
        });
    }

    /**
     * Update the price estimate display
     */
    updatePriceEstimate(totalCost: number, rarity: string) {
        if (!this.elements.estimatedPrice) return;

        const price = calculateGoldPrice(totalCost, rarity, this.modifiers);
        const budget = RARITY_BUDGETS[rarity];

        if (budget) {
            const [min, max] = budget.gold;
            this.elements.estimatedPrice.textContent = `${min.toLocaleString()}-${max.toLocaleString()} gp`;
        } else {
            this.elements.estimatedPrice.textContent = `~${price.toLocaleString()} gp`;
        }
    }

    /**
     * Show the Power Budget panel
     */
    show() {
        this.elements.panel?.classList.remove('hidden');
    }

    /**
     * Hide the Power Budget panel
     */
    hide() {
        this.elements.panel?.classList.add('hidden');
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        this.elements.panel?.classList.toggle('hidden');
    }

    /**
     * Set the item type (affects available abilities)
     * Handles auto-conversion between elements and resistances
     */
    setItemType(type: string) {
        const previousType = this.itemType;
        this.itemType = type;

        // If changing between weapon and non-weapon types, convert selections
        const wasWeapon = isWeaponType(previousType);
        const isNowWeapon = isWeaponType(type);
        const canHaveResist = isResistanceType(type);

        if (wasWeapon && !isNowWeapon && canHaveResist) {
            // Converting from weapon to non-weapon: element → resistance
            this.convertElementSelectionToResistance();
        } else if (!wasWeapon && isNowWeapon) {
            // Converting from non-weapon to weapon: resistance → element
            this.convertResistanceSelectionToElement();
        } else if (!wasWeapon && !isNowWeapon) {
            // Non-weapon to non-weapon - keep resistance if applicable
            // No conversion needed
        }

        // Update UI to reflect changes
        this.updateUI();

        console.log(`Item type changed: ${previousType} → ${type}`);
    }

    /**
     * Convert element selection to resistance (for switching to non-weapon)
     */
    private convertElementSelectionToResistance() {
        const selectedElement = getSelectedElement(this.selectedAbilities);
        if (!selectedElement) return;

        const resistanceId = getResistanceForElement(selectedElement);
        if (!resistanceId) return;

        // Remove element and damage dice
        this.selectedAbilities = this.selectedAbilities.filter((id: string) =>
            !ABILITY_COSTS.elements[id] && !ABILITY_COSTS.extraDamage[id]
        );

        // Add resistance
        this.selectedAbilities.push(resistanceId);

        // Update UI elements
        document.querySelectorAll('.element-btn').forEach(el => el.classList.remove('selected'));
        this.elements.elementSelector?.classList.add('hidden');

        console.log(`Converted element ${selectedElement} to resistance ${resistanceId}`);
    }

    /**
     * Convert resistance selection to element (for switching to weapon)
     */
    private convertResistanceSelectionToElement() {
        const selectedResistance = getSelectedResistance(this.selectedAbilities);
        if (!selectedResistance) return;

        const elementId = getElementForResistance(selectedResistance);
        if (!elementId) return;

        // Remove resistance
        this.selectedAbilities = this.selectedAbilities.filter((id: string) =>
            !ABILITY_COSTS.resistances[id]
        );

        // Add element (but user will need to select damage dice separately)
        this.selectedAbilities.push(elementId);

        // Show element selector and highlight the element
        this.elements.elementSelector?.classList.remove('hidden');
        document.querySelectorAll('.element-btn').forEach(el => {
            el.classList.toggle('selected', (el as HTMLElement).dataset.element === elementId);
        });

        console.log(`Converted resistance ${selectedResistance} to element ${elementId}`);
    }

    /**
     * Get the current item properties for generation
     * @returns {Object} Item properties built from selections
     */
    getItemProperties() {
        if (this.mode === 'auto') {
            // Generate random abilities within budget
            const abilities = generateRandomAbilities(this.selectedRarity, this.itemType, this.modifiers);
            return buildItemProperties(abilities, this.selectedRarity, this.modifiers);
        }

        return buildItemProperties(this.selectedAbilities, this.selectedRarity, this.modifiers);
    }

    /**
     * Get just the selected abilities (for prompt building)
     * @returns {Array<string>} Selected ability IDs
     */
    getSelectedAbilities() {
        if (this.mode === 'auto') {
            return generateRandomAbilities(this.selectedRarity, this.itemType, this.modifiers);
        }
        return [...this.selectedAbilities];
    }

    /**
     * Get current modifiers state
     * @returns {Object}
     */
    getModifiers() {
        return { ...this.modifiers };
    }

    /**
     * Get selected rarity
     * @returns {string}
     */
    getRarity() {
        return this.selectedRarity;
    }

    /**
     * Get current mode
     * @returns {string} 'auto' or 'manual'
     */
    getMode() {
        return this.mode;
    }
}

// Export singleton instance
const powerBudgetController = new PowerBudgetController();
export default powerBudgetController;
