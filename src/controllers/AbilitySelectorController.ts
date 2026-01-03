// @ts-nocheck
/**
 * AbilitySelectorController.ts
 * ============================
 * Manages the ability scroll selector UI
 * 
 * Features:
 * - Category switching (10 scroll images)
 * - Clickable icon areas on each scroll
 * - Budget tracking with PowerBudget system
 * - Selection state management
 */

import {
    ABILITIES,
    DAMAGE_ELEMENTS,
    RARITY_BUDGETS,
    calculateTotalCost,
    determineRarity,
    getAllAbilitiesFlat
} from '../config/items';

// Icon positions on each scroll image (percentage-based)
// These define where clickable areas should be placed
interface IconPosition {
    id: string;
    x: number;  // % from left
    y: number;  // % from top
    width: number;  // % width
    height: number; // % height
}

interface ScrollConfig {
    scrollFile: string;
    category: string;
    icons: IconPosition[];
}

// Scroll configurations with icon positions
// Positions are based on the 2-column and 1-column scroll layouts
const SCROLL_CONFIGS: Record<string, ScrollConfig> = {
    elements: {
        scrollFile: 'j.png',
        category: 'elements',
        icons: [
            // Precisely positioned using edit mode
            { id: 'fire', x: 25.5, y: 18.3, width: 19.5, height: 12.0 },
            { id: 'cold', x: 55.5, y: 18.7, width: 18.0, height: 11.3 },
            { id: 'lightning', x: 25.0, y: 31.0, width: 20.5, height: 12.7 },
            { id: 'acid', x: 54.0, y: 31.0, width: 20.5, height: 12.0 },
            { id: 'poison', x: 26.0, y: 44.0, width: 19.5, height: 12.7 },
            { id: 'thunder', x: 55.0, y: 44.0, width: 19.0, height: 12.0 },
            { id: 'necrotic', x: 25.5, y: 57.7, width: 19.5, height: 12.3 },
            { id: 'radiant', x: 55.0, y: 57.7, width: 19.0, height: 12.0 },
            { id: 'force', x: 25.5, y: 71.3, width: 20.0, height: 12.0 },
            { id: 'psychic', x: 54.5, y: 71.0, width: 20.0, height: 12.0 }
        ]
    },
    bonuses: {
        scrollFile: 'i.png',
        category: 'bonuses',
        icons: [
            // Precisely positioned using edit mode
            { id: 'magical', x: 21.0, y: 26.7, width: 26.0, height: 18.7 },
            { id: 'bonus_1', x: 53.5, y: 26.7, width: 25.5, height: 19.0 },
            { id: 'bonus_2', x: 20.0, y: 54.3, width: 26.5, height: 20.0 },
            { id: 'bonus_3', x: 52.5, y: 54.7, width: 26.0, height: 19.7 }
        ]
    },
    special: {
        scrollFile: 'g.png',
        category: 'specialFeatures',
        icons: [
            // Precisely positioned using edit mode
            { id: 'returning', x: 41.0, y: 18.0, width: 18.0, height: 12.0 },
            { id: 'warning', x: 40.5, y: 31.0, width: 18.0, height: 12.0 },
            { id: 'light', x: 40.0, y: 44.0, width: 19.0, height: 13.3 },
            { id: 'thrown', x: 41.0, y: 57.0, width: 18.0, height: 12.0 },
            { id: 'reach', x: 41.0, y: 71.0, width: 18.5, height: 12.0 }
        ]
    },
    combat: {
        scrollFile: 'h.png',
        category: 'combatEffects',
        icons: [
            // Precisely positioned using edit mode
            { id: 'vicious', x: 37.5, y: 18.3, width: 26.0, height: 19.3 },
            { id: 'keen', x: 35.5, y: 39.7, width: 29.0, height: 19.3 },
            { id: 'vorpal', x: 36.5, y: 62.0, width: 28.0, height: 19.3 }
        ]
    },
    conditions: {
        scrollFile: 'e.png',
        category: 'conditionEffects',
        icons: [
            // Precisely positioned using edit mode
            { id: 'push_5ft', x: 20.5, y: 35.7, width: 15.0, height: 19.0 },
            { id: 'push_10ft', x: 40.0, y: 19.7, width: 20.0, height: 34.7 },
            { id: 'prone', x: 59.0, y: 32.7, width: 21.0, height: 20.7 },
            { id: 'frightened', x: 21.5, y: 56.3, width: 27.5, height: 17.3 },
            { id: 'stunned', x: 50.5, y: 57.0, width: 27.0, height: 17.0 }
        ]
    },
    spells1: {
        scrollFile: 'f.png',
        category: 'spellsLevel1',
        icons: [
            // Precisely positioned using edit mode
            { id: 'bless', x: 41.5, y: 18.3, width: 17.5, height: 12.0 },
            { id: 'command', x: 41.0, y: 31.0, width: 18.0, height: 12.0 },
            { id: 'cureWounds', x: 41.0, y: 44.3, width: 18.0, height: 11.7 },
            { id: 'faerieFire', x: 41.0, y: 57.3, width: 18.5, height: 12.0 },
            { id: 'shield', x: 41.5, y: 70.3, width: 17.5, height: 12.0 }
        ]
    },
    spells2: {
        scrollFile: 'd.png',
        category: 'spellsLevel2',
        icons: [
            // Precisely positioned using edit mode
            { id: 'invisibility', x: 23.0, y: 24.3, width: 24.5, height: 19.0 },
            { id: 'mistyStep', x: 52.5, y: 24.0, width: 26.5, height: 19.7 },
            { id: 'holdPerson', x: 22.5, y: 54.3, width: 24.5, height: 18.7 },
            { id: 'scorchingRay', x: 52.0, y: 54.3, width: 27.0, height: 18.0 }
        ]
    },
    spells3: {
        scrollFile: 'c.png',
        category: 'spellsLevel3',
        icons: [
            // Precisely positioned using edit mode
            { id: 'fireball', x: 23.0, y: 31.7, width: 23.5, height: 15.7 },
            { id: 'fly', x: 53.0, y: 32.0, width: 23.5, height: 15.7 },
            { id: 'haste', x: 23.5, y: 53.0, width: 24.0, height: 15.3 },
            { id: 'lightningBolt', x: 53.5, y: 52.7, width: 23.0, height: 15.0 }
        ]
    },
    materials: {
        scrollFile: 'b.png',
        category: 'materials',
        icons: [
            // Precisely positioned using edit mode
            { id: 'silvered', x: 35.0, y: 18.7, width: 31.0, height: 20.7 },
            { id: 'adamantine', x: 34.0, y: 39.0, width: 32.5, height: 21.0 },
            { id: 'mithral', x: 34.0, y: 60.7, width: 32.0, height: 21.3 }
        ]
    },
    damage: {
        scrollFile: 'a.png',
        category: 'extraDamage',
        icons: [
            { id: 'damage_1d4', x: 39, y: 20, width: 22, height: 16 },
            { id: 'damage_1d6', x: 39, y: 42, width: 22, height: 16 },
            { id: 'damage_1d8', x: 39, y: 64, width: 22, height: 16 }
        ]
    }
};

export class AbilitySelectorController {
    private container: HTMLElement | null = null;
    private selectedAbilities: Set<string> = new Set();
    private currentCategory: string = 'elements';
    private maxBudget: number = 8; // Default to Rare
    private currentRarity: string = 'rare';
    private onChangeCallback: ((abilities: string[]) => void) | null = null;

    // Edit mode properties
    private editMode: boolean = false;
    private editedPositions: Record<string, Record<string, IconPosition>> = {};
    private dragTarget: HTMLElement | null = null;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private dragStartLeft: number = 0;
    private dragStartTop: number = 0;

    // State management for inline flow
    private currentState: 'initial' | 'rarity' | 'categories' = 'initial';

    constructor() {
        this.init();
        this.initEditMode();
        // Initialize inline state flow
        this.initInlineFlow();
    }

    private init(): void {
        console.log('[AbilitySelector] Initializing...');

        // First, populate the preview-panel buttons (this is the main location)
        this.populateScrollPanel();

        // Create global tooltip element (appended to body for proper z-index)
        this.createGlobalTooltip();

        // Now find buttons ONLY in the preview-panel (not sidebar)
        const previewButtonsContainer = document.getElementById('ability-category-buttons');

        console.log('[AbilitySelector] Preview buttons container found:', !!previewButtonsContainer);

        if (!previewButtonsContainer) {
            console.warn('[AbilitySelector] No preview buttons container found!');
            return;
        }

        this.container = previewButtonsContainer;

        // Get buttons from the preview panel ONLY
        const buttons = previewButtonsContainer.querySelectorAll('.ability-category-btn');
        console.log('[AbilitySelector] Found', buttons.length, 'buttons in preview panel');

        if (buttons.length === 0) {
            console.warn('[AbilitySelector] No buttons found in preview panel!');
            return;
        }

        // Bind click events to preview panel buttons
        buttons.forEach((btn, index) => {
            const category = btn.getAttribute('data-category');
            console.log(`[AbilitySelector] Binding button ${index}: ${category}`);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const cat = btn.getAttribute('data-category');
                console.log('[AbilitySelector] CLICK! Category:', cat);

                if (cat) {
                    this.switchCategory(cat);

                    // Update active state for all buttons
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Initialize the first category display
        this.switchCategory('elements');
        this.updateBudgetDisplay();

        console.log('[AbilitySelector] ✅ Initialized successfully');
    }

    /**
     * Populate the ability-category-buttons container with category buttons
     */
    private populateScrollPanel(): void {
        const buttonsContainer = document.getElementById('ability-category-buttons');
        if (!buttonsContainer || buttonsContainer.children.length > 0) return;

        // Create buttons with navigation controls
        buttonsContainer.innerHTML = `
            <button class="ability-nav-btn back-btn" title="חזור לבחירת נדירות">◀</button>
            <button class="ability-category-btn active" data-category="elements" data-scroll="a.png" title="יסודות">🔥</button>
            <button class="ability-category-btn" data-category="bonuses" data-scroll="b.png" title="בונוסים">⚔️</button>
            <button class="ability-category-btn" data-category="combat" data-scroll="c.png" title="קרב">💢</button>
            <button class="ability-category-btn" data-category="special" data-scroll="d.png" title="מיוחד">✨</button>
            <button class="ability-category-btn" data-category="conditions" data-scroll="e.png" title="מצבים">💫</button>
            <button class="ability-category-btn" data-category="spells1" data-scroll="f.png" title="לחשים 1">📿</button>
            <button class="ability-category-btn" data-category="spells2" data-scroll="g.png" title="לחשים 2">🪄</button>
            <button class="ability-category-btn" data-category="spells3" data-scroll="h.png" title="לחשים 3">⚡</button>
            <button class="ability-category-btn" data-category="materials" data-scroll="i.png" title="חומרים">🥈</button>
            <button class="ability-category-btn" data-category="damage" data-scroll="j.png" title="נזק נוסף">🎲</button>
            <button class="ability-nav-btn reset-btn" title="איפוס הכל">✕</button>
        `;

        // Bind navigation buttons
        const backBtn = buttonsContainer.querySelector('.back-btn');
        const resetBtn = buttonsContainer.querySelector('.reset-btn');

        backBtn?.addEventListener('click', () => {
            this.switchToState('rarity');
        });

        resetBtn?.addEventListener('click', () => {
            this.resetToInitialState();
            if ((window as any).showToast) {
                (window as any).showToast('הבחירות אופסו', 'info');
            }
        });

        // Set container for event handling
        this.container = buttonsContainer;
        console.log('✅ Ability category buttons populated');
    }

    private setupCategoryButtons(): void {
        const buttons = this.container?.querySelectorAll('.ability-category-btn');
        if (!buttons) return;

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                if (category) {
                    this.switchCategory(category);

                    // Update active state
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
    }

    private switchCategory(category: string): void {
        console.log('[AbilitySelector] switchCategory:', category);

        this.currentCategory = category;
        const config = SCROLL_CONFIGS[category];

        if (!config) {
            console.warn('[AbilitySelector] No config for category:', category);
            return;
        }

        // Update scroll image - try multiple selectors
        let scrollImage = document.getElementById('scroll-image') as HTMLImageElement;
        if (!scrollImage) {
            scrollImage = document.querySelector('.scroll-image') as HTMLImageElement;
        }

        if (scrollImage) {
            const newSrc = `assets/icons/${config.scrollFile}`;
            console.log('[AbilitySelector] Changing image from', scrollImage.src, 'to', newSrc);
            scrollImage.src = newSrc;
        } else {
            console.warn('[AbilitySelector] No scroll-image element found!');
        }

        // Generate icon overlay buttons
        this.generateIconButtons(config);
    }

    private generateIconButtons(config: ScrollConfig): void {
        const overlay = document.getElementById('ability-icons-overlay');
        if (!overlay) return;

        overlay.innerHTML = '';

        const allAbilities = getAllAbilitiesFlat();

        config.icons.forEach(icon => {
            const ability = allAbilities[icon.id] || DAMAGE_ELEMENTS[icon.id];
            if (!ability) {
                console.warn(`Ability not found: ${icon.id}`);
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'ability-icon-btn';
            btn.setAttribute('data-ability-id', icon.id);

            // Build compact tooltip: "שם (X נק') - תיאור קצר"
            let tooltipText = ability.nameHe;
            if (ability.cost > 0) {
                tooltipText += ` (${ability.cost})`;
            }
            if (ability.description) {
                // Take first sentence or first 40 chars
                const shortDesc = ability.description.split('.')[0].substring(0, 40);
                tooltipText += ` - ${shortDesc}`;
            }
            btn.setAttribute('data-tooltip', tooltipText);

            // Position based on percentages
            btn.style.left = `${icon.x}%`;
            btn.style.top = `${icon.y}%`;
            btn.style.width = `${icon.width}%`;
            btn.style.height = `${icon.height}%`;

            // Check if selected
            if (this.selectedAbilities.has(icon.id)) {
                btn.classList.add('selected');
            }

            // Check if can afford
            const currentCost = this.calculateCurrentCost();
            const abilityCost = ability.cost || 0;
            if (currentCost + abilityCost > this.maxBudget && !this.selectedAbilities.has(icon.id)) {
                btn.classList.add('disabled');
            }

            // Edit mode: add drag handlers
            if (this.editMode) {
                btn.classList.add('editable');
                btn.style.cursor = 'grab';
                btn.addEventListener('mousedown', (e) => this.handleDragStart(e, btn, icon));
            } else {
                btn.addEventListener('click', () => this.toggleAbility(icon.id));
            }

            // Tooltip handlers (using global tooltip element)
            btn.addEventListener('mouseenter', () => this.showTooltip(tooltipText));
            btn.addEventListener('mouseleave', () => this.hideTooltip());

            overlay.appendChild(btn);
        });
    }

    private toggleAbility(abilityId: string): void {
        const allAbilities = { ...getAllAbilitiesFlat(), ...DAMAGE_ELEMENTS };
        const ability = allAbilities[abilityId];
        if (!ability) return;

        if (this.selectedAbilities.has(abilityId)) {
            // Remove
            this.selectedAbilities.delete(abilityId);
        } else {
            // Check budget
            const currentCost = this.calculateCurrentCost();
            const abilityCost = ability.cost || 0;
            if (currentCost + abilityCost > this.maxBudget) {
                // Can't afford - show feedback
                this.showFeedback('אין מספיק נקודות!');
                return;
            }

            // Check for exclusive abilities
            if (ability.exclusive) {
                // Remove other abilities from same category
                const category = ability.category;
                for (const selectedId of this.selectedAbilities) {
                    const selected = allAbilities[selectedId];
                    if (selected && selected.exclusive && selected.category === category) {
                        this.selectedAbilities.delete(selectedId);
                        break;
                    }
                }
            }

            this.selectedAbilities.add(abilityId);
        }

        // Refresh display
        this.switchCategory(this.currentCategory);
        this.updateBudgetDisplay();
        this.updateSelectedDisplay();
        this.updateStickyNote();

        // Emit event for card integration
        this.emitAbilitiesChanged();

        // Notify callback
        if (this.onChangeCallback) {
            this.onChangeCallback(Array.from(this.selectedAbilities));
        }
    }

    private calculateCurrentCost(): number {
        const allAbilities = { ...getAllAbilitiesFlat(), ...DAMAGE_ELEMENTS };
        let total = 0;

        for (const id of this.selectedAbilities) {
            const ability = allAbilities[id];
            if (ability) {
                total += ability.cost || 0;
            }
        }

        return total;
    }

    private updateBudgetDisplay(): void {
        const cost = this.calculateCurrentCost();
        const percentage = Math.min((cost / this.maxBudget) * 100, 100);
        const rarity = determineRarity(cost);

        // Update bar
        const fill = document.getElementById('ability-budget-fill');
        if (fill) {
            fill.style.width = `${percentage}%`;
            fill.className = `budget-fill ${rarity}`;
        }

        // Update text
        const used = document.getElementById('ability-budget-used');
        const max = document.getElementById('ability-budget-max');
        const rarityEl = document.getElementById('ability-budget-rarity');

        if (used) used.textContent = String(cost);
        if (max) max.textContent = String(this.maxBudget);
        if (rarityEl) {
            const rarityData = RARITY_BUDGETS[rarity];
            if (rarityData) {
                rarityEl.textContent = `${rarityData.nameHe} ${rarityData.icon}`;
                rarityEl.style.color = rarityData.color;
            }
        }
    }

    private updateSelectedDisplay(): void {
        const list = document.getElementById('ability-selected-list');
        if (!list) return;

        if (this.selectedAbilities.size === 0) {
            list.innerHTML = '<span class="no-selection">לא נבחרו יכולות</span>';
            return;
        }

        const allAbilities = { ...getAllAbilitiesFlat(), ...DAMAGE_ELEMENTS };
        list.innerHTML = '';

        for (const id of this.selectedAbilities) {
            const ability = allAbilities[id];
            if (!ability) continue;

            const tag = document.createElement('span');
            tag.className = 'selected-ability';
            tag.setAttribute('data-ability-id', id);
            tag.innerHTML = `
                ${ability.nameHe}
                <span class="cost">(${ability.cost || 0})</span>
                <span class="remove">✕</span>
            `;
            tag.addEventListener('click', () => this.toggleAbility(id));

            list.appendChild(tag);
        }
    }

    private showFeedback(message: string): void {
        // Use existing toast system if available
        if ((window as any).showToast) {
            (window as any).showToast(message, 'warning');
        } else {
            console.log(message);
        }
    }

    // ==================== GLOBAL TOOLTIP ====================

    private tooltipElement: HTMLElement | null = null;

    /**
     * Create global tooltip element appended to body
     */
    private createGlobalTooltip(): void {
        if (document.getElementById('ability-tooltip')) return;

        const tooltip = document.createElement('div');
        tooltip.id = 'ability-tooltip';
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;
    }

    /**
     * Show tooltip with text
     */
    private showTooltip(text: string): void {
        if (!this.tooltipElement) {
            this.tooltipElement = document.getElementById('ability-tooltip');
        }
        if (this.tooltipElement) {
            this.tooltipElement.textContent = text;
            this.tooltipElement.classList.add('visible');
        }
    }

    /**
     * Hide tooltip
     */
    private hideTooltip(): void {
        if (!this.tooltipElement) {
            this.tooltipElement = document.getElementById('ability-tooltip');
        }
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
        }
    }

    // ==================== CARD INTEGRATION ====================

    /**
     * Format selected abilities for card display
     * @returns Formatted string for quickStats field
     */
    public formatAbilitiesForCard(): string {
        const allAbilities = { ...getAllAbilitiesFlat(), ...DAMAGE_ELEMENTS };
        const lines: string[] = [];

        // Group abilities by type
        let selectedElement: string | null = null;
        let selectedDamageDice: string | null = null;
        const bonuses: string[] = [];
        const effects: string[] = [];
        const resistances: string[] = [];

        for (const abilityId of this.selectedAbilities) {
            const ability = allAbilities[abilityId];
            if (!ability) continue;

            // Check if this is an element
            if (DAMAGE_ELEMENTS[abilityId]) {
                selectedElement = abilityId;
                continue;
            }

            // Check if this is damage dice
            if (abilityId.startsWith('damage_')) {
                selectedDamageDice = abilityId;
                continue;
            }

            // Check if this is a resistance
            if (abilityId.startsWith('resistance_')) {
                const elementName = ability.nameHe;
                resistances.push(`עמידות ל${elementName}`);
                continue;
            }

            // Check for bonus
            if (abilityId.startsWith('bonus_')) {
                bonuses.push(ability.nameHe);
                continue;
            }

            // Other effects
            effects.push(ability.nameHe);
        }

        // Build output lines

        // 1. Bonuses first (e.g., "+1 להתקפה ונזק")
        lines.push(...bonuses);

        // 2. Element + damage dice combined (e.g., "🔥 +1d6 נזק אש")
        if (selectedElement && selectedDamageDice) {
            const element = DAMAGE_ELEMENTS[selectedElement];
            const dice = allAbilities[selectedDamageDice];
            if (element && dice) {
                lines.push(`${element.icon} ${dice.nameHe} ${element.nameHe}`);
            }
        } else if (selectedElement) {
            // Only element selected (for armor = resistance)
            const element = DAMAGE_ELEMENTS[selectedElement];
            if (element) {
                resistances.push(`עמידות לנזק ${element.nameHe}`);
            }
        }

        // 3. Resistances
        lines.push(...resistances);

        // 4. Other effects
        lines.push(...effects);

        return lines.join('\n');
    }

    /**
     * Format abilities with full D&D mechanics for card back
     * @returns Formatted string with full rules text
     */
    public formatAbilitiesWithMechanics(): string {
        const allAbilities = { ...getAllAbilitiesFlat(), ...DAMAGE_ELEMENTS };
        const sections: string[] = [];

        for (const abilityId of this.selectedAbilities) {
            const ability = allAbilities[abilityId];
            if (!ability) continue;

            // Skip elements (they're combined with damage dice)
            if (DAMAGE_ELEMENTS[abilityId]) continue;

            // Build ability entry with full mechanics
            let entry = `• ${ability.nameHe}`;

            // Add description/mechanics
            if (ability.description) {
                entry += `: ${ability.description}`;
            }

            // Add save DC if applicable
            if (ability.saveDC && ability.saveType) {
                entry += ` (${ability.saveType} DC ${ability.saveDC})`;
            }

            // Add spell level if applicable
            if (ability.spellLevel) {
                entry += ` (רמה ${ability.spellLevel})`;
            }

            sections.push(entry);
        }

        // Handle element + damage combination
        let selectedElement: any = null;
        let selectedDice: any = null;

        for (const abilityId of this.selectedAbilities) {
            if (DAMAGE_ELEMENTS[abilityId]) {
                selectedElement = DAMAGE_ELEMENTS[abilityId];
            }
            if (abilityId.startsWith('damage_')) {
                selectedDice = allAbilities[abilityId];
            }
        }

        if (selectedElement && selectedDice) {
            sections.unshift(`• נזק ${selectedElement.nameHe} (${selectedDice.nameHe}): בכל פגיעה, מוסיף ${selectedDice.nameHe} נזק מסוג ${selectedElement.nameHe}.`);
        } else if (selectedElement) {
            sections.unshift(`• עמידות ל${selectedElement.nameHe}: מקבל חצי נזק מנזק מסוג ${selectedElement.nameHe}.`);
        }

        return sections.join('\n\n');
    }

    /**
     * Emit custom event when abilities change (for card integration)
     */
    private emitAbilitiesChanged(): void {
        const formattedAbilities = this.formatAbilitiesForCard();
        const mechanicsText = this.formatAbilitiesWithMechanics();

        const event = new CustomEvent('abilities-changed', {
            detail: {
                abilities: Array.from(this.selectedAbilities),
                formatted: formattedAbilities,
                mechanics: mechanicsText,
                cost: this.calculateCurrentCost(),
                rarity: this.currentRarity
            },
            bubbles: true
        });

        document.dispatchEvent(event);

        // Update the quickStats input (front of card)
        const quickStatsInput = document.getElementById('edit-quick-stats') as HTMLTextAreaElement;
        if (quickStatsInput && formattedAbilities) {
            quickStatsInput.value = formattedAbilities;
            quickStatsInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Update the abilityDesc input (back of card)
        const abilityDescInput = document.getElementById('edit-ability-desc') as HTMLTextAreaElement;
        if (abilityDescInput && mechanicsText) {
            abilityDescInput.value = mechanicsText;
            abilityDescInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    private setupScrollDisplay(): void {
        // Initial display
        this.switchCategory('elements');
    }

    // Public API
    public setMaxBudget(budget: number): void {
        this.maxBudget = budget;
        this.updateBudgetDisplay();
        this.switchCategory(this.currentCategory); // Refresh to update disabled states
    }

    public setRarity(rarityId: string): void {
        const rarity = RARITY_BUDGETS[rarityId];
        if (rarity) {
            this.currentRarity = rarityId;
            this.maxBudget = rarity.max;
            this.updateBudgetDisplay();
            this.switchCategory(this.currentCategory);
        }
    }

    // ==================== INLINE STATE FLOW ====================

    /**
     * Initialize the inline flow (initial button → rarity → categories)
     */
    private initInlineFlow(): void {
        // Setup manual ability button click handler
        const manualBtn = document.getElementById('manual-ability-btn');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                this.switchToState('rarity');
            });
        }

        // Setup rarity buttons
        this.populateRarityButtons();

        // Setup keyboard shortcut for gem position editing
        this.initGemPositionEditor();

        console.log('[AbilitySelector] Inline flow initialized');
    }

    // Gem position editor state
    private gemEditMode: boolean = false;
    private selectedGemIndex: number = 0;
    private gemPositions: { x: number; y: number; zoom: number }[] = [
        { x: 0, y: 50, zoom: 500 },
        { x: 25, y: 50, zoom: 500 },
        { x: 50, y: 50, zoom: 500 },
        { x: 75, y: 50, zoom: 500 },
        { x: 100, y: 50, zoom: 500 }
    ];
    private buttonSize: number = 36;

    /**
     * Initialize gem position editor (Ctrl+Shift+E)
     */
    private initGemPositionEditor(): void {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+E to toggle edit mode
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.toggleGemEditMode();
            }

            // Only handle other keys in edit mode
            if (!this.gemEditMode) return;

            const rarities = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];

            // Number keys 1-5 to select gem
            if (e.key >= '1' && e.key <= '5') {
                this.selectedGemIndex = parseInt(e.key) - 1;
                this.highlightSelectedGem(rarities);
                this.updateGemEditDisplay();
            }

            const step = e.shiftKey ? 5 : 1;
            const gem = this.gemPositions[this.selectedGemIndex];

            // Arrow keys to adjust position
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                gem.x = Math.max(-100, gem.x - step);
                this.applyGemStyles(rarities[this.selectedGemIndex]);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                gem.x = Math.min(200, gem.x + step);
                this.applyGemStyles(rarities[this.selectedGemIndex]);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                gem.y = Math.max(-100, gem.y - step);
                this.applyGemStyles(rarities[this.selectedGemIndex]);
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                gem.y = Math.min(200, gem.y + step);
                this.applyGemStyles(rarities[this.selectedGemIndex]);
            }

            // W/S to adjust zoom (background-size)
            if (e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                gem.zoom = Math.max(100, gem.zoom - step * 10);
                this.applyGemStyles(rarities[this.selectedGemIndex]);
            }
            if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                gem.zoom = Math.min(1000, gem.zoom + step * 10);
                this.applyGemStyles(rarities[this.selectedGemIndex]);
            }

            // Q/A to adjust button size (all buttons)
            if (e.key === 'q' || e.key === 'Q') {
                e.preventDefault();
                this.buttonSize = Math.max(20, this.buttonSize - step);
                this.applyButtonSize();
            }
            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                this.buttonSize = Math.min(80, this.buttonSize + step);
                this.applyButtonSize();
            }

            // P to print current CSS values
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.printGemCSS();
            }
        });
    }

    private highlightSelectedGem(rarities: string[]): void {
        // Remove highlight from all
        document.querySelectorAll('.rarity-btn').forEach(btn => {
            (btn as HTMLElement).style.outline = '';
        });
        // Add highlight to selected
        const btn = document.querySelector(`.rarity-btn[data-rarity="${rarities[this.selectedGemIndex]}"]`) as HTMLElement;
        if (btn) {
            btn.style.outline = '3px solid cyan';
        }
    }

    private toggleGemEditMode(): void {
        this.gemEditMode = !this.gemEditMode;

        if (this.gemEditMode) {
            this.switchToState('rarity');
            this.showGemEditOverlay();
            const rarities = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];
            this.highlightSelectedGem(rarities);
            if ((window as any).showToast) {
                (window as any).showToast('Gem Edit Mode ON', 'info');
            }
        } else {
            this.hideGemEditOverlay();
            document.querySelectorAll('.rarity-btn').forEach(btn => {
                (btn as HTMLElement).style.outline = '';
            });
            if ((window as any).showToast) {
                (window as any).showToast('Gem Edit Mode OFF', 'info');
            }
        }
    }

    private showGemEditOverlay(): void {
        let overlay = document.getElementById('gem-edit-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'gem-edit-overlay';
            overlay.style.cssText = `
                position: fixed; bottom: 20px; left: 20px; padding: 12px 16px;
                background: rgba(0,0,0,0.95); border: 2px solid #d4af37; border-radius: 8px;
                color: #fff; font-family: monospace; font-size: 11px; z-index: 10000;
                min-width: 220px;
            `;
            document.body.appendChild(overlay);
        }
        this.updateGemEditDisplay();
    }

    private hideGemEditOverlay(): void {
        document.getElementById('gem-edit-overlay')?.remove();
    }

    private updateGemEditDisplay(): void {
        const overlay = document.getElementById('gem-edit-overlay');
        if (!overlay) return;

        const rarities = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];
        const gem = this.gemPositions[this.selectedGemIndex];

        overlay.innerHTML = `
            <div style="color: #d4af37; font-weight: bold; margin-bottom: 6px;">🔧 Gem Position Editor</div>
            <div>Selected: <span style="color: cyan;">[${this.selectedGemIndex + 1}] ${rarities[this.selectedGemIndex]}</span></div>
            <div style="margin-top: 4px;">
                X: <span style="color: #4ade80;">${gem.x}%</span> | 
                Y: <span style="color: #4ade80;">${gem.y}%</span> | 
                Zoom: <span style="color: #f59e0b;">${gem.zoom}%</span>
            </div>
            <div>Button Size: <span style="color: #a78bfa;">${this.buttonSize}px</span></div>
            <div style="color: #888; font-size: 10px; margin-top: 8px; border-top: 1px solid #444; padding-top: 6px;">
                1-5: select | ←→: X | ↑↓: Y<br>
                W/S: zoom | Q/A: size | P: print CSS
            </div>
        `;
    }

    private applyGemStyles(rarityId: string): void {
        const btn = document.querySelector(`.rarity-btn[data-rarity="${rarityId}"]`) as HTMLElement;
        if (btn) {
            const gem = this.gemPositions[this.selectedGemIndex];
            btn.style.backgroundPosition = `${gem.x}% ${gem.y}%`;
            btn.style.backgroundSize = `${gem.zoom}% auto`;
            this.updateGemEditDisplay();
        }
    }

    private applyButtonSize(): void {
        document.querySelectorAll('.ability-state-rarity .rarity-btn').forEach(btn => {
            (btn as HTMLElement).style.width = `${this.buttonSize}px`;
            (btn as HTMLElement).style.height = `${this.buttonSize}px`;
        });
        this.updateGemEditDisplay();
    }

    private printGemCSS(): void {
        const rarities = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];
        let css = `/* Gem Positions - Size: ${this.buttonSize}px */\n`;
        this.gemPositions.forEach((gem, i) => {
            css += `.rarity-btn[data-rarity="${rarities[i]}"] { background-position: ${gem.x}% ${gem.y}%; background-size: ${gem.zoom}% auto; }\n`;
        });
        console.log(css);
        if ((window as any).showToast) {
            (window as any).showToast('CSS printed to console (F12)', 'success');
        }
    }

    /**
     * Populate the rarity buttons in the controls area
     */
    private populateRarityButtons(): void {
        const rarityButtonsContainer = document.getElementById('rarity-buttons');
        if (!rarityButtonsContainer) return;

        const rarityOrder = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];

        for (const rarityId of rarityOrder) {
            const rarity = RARITY_BUDGETS[rarityId];
            if (!rarity) continue;

            const btn = document.createElement('div');
            btn.className = 'rarity-btn';
            btn.setAttribute('data-rarity', rarityId);
            btn.innerHTML = `
                <span class="rarity-btn-icon">${rarity.icon}</span>
                <span class="rarity-btn-name">${rarity.nameHe}</span>
            `;

            btn.addEventListener('click', () => {
                this.setRarity(rarityId);
                this.switchToState('categories');
                this.switchStickyNoteToAbilityMode();

                // Show feedback
                if ((window as any).showToast) {
                    (window as any).showToast(`נבחר: ${rarity.nameHe} (עד ${rarity.max} נקודות)`, 'success');
                }
                console.log(`[AbilitySelector] Rarity selected: ${rarityId}, max budget: ${rarity.max}`);
            });

            rarityButtonsContainer.appendChild(btn);
        }
    }

    /**
     * Switch between states: initial, rarity, categories
     */
    private switchToState(state: 'initial' | 'rarity' | 'categories'): void {
        this.currentState = state;

        // State containers
        const stateInitial = document.getElementById('ability-state-initial');
        const stateRarity = document.getElementById('ability-state-rarity');
        const stateCategories = document.getElementById('ability-state-categories');

        if (stateInitial) stateInitial.classList.toggle('hidden', state !== 'initial');
        if (stateRarity) stateRarity.classList.toggle('hidden', state !== 'rarity');
        if (stateCategories) stateCategories.classList.toggle('hidden', state !== 'categories');

        console.log(`[AbilitySelector] Switched to state: ${state}`);
    }

    /**
     * Reset to initial cover state
     */
    public resetToInitialState(): void {
        this.switchToState('initial');
        this.clearSelection();

        // Reset sticky note to normal mode
        const normalContent = document.getElementById('note-content-normal');
        const abilitiesContent = document.getElementById('note-content-abilities');
        if (normalContent) normalContent.classList.remove('hidden');
        if (abilitiesContent) abilitiesContent.classList.add('hidden');
    }

    public getSelectedAbilities(): string[] {
        return Array.from(this.selectedAbilities);
    }

    public clearSelection(): void {
        this.selectedAbilities.clear();
        this.updateBudgetDisplay();
        this.updateSelectedDisplay();
        this.updateStickyNote();
        this.switchCategory(this.currentCategory);
    }

    /**
     * Switch sticky note to ability selection mode
     */
    private switchStickyNoteToAbilityMode(): void {
        const normalContent = document.getElementById('note-content-normal');
        const abilitiesContent = document.getElementById('note-content-abilities');

        if (normalContent) {
            normalContent.classList.add('hidden');
        }
        if (abilitiesContent) {
            abilitiesContent.classList.remove('hidden');
        }

        // Update the display with current state
        this.updateStickyNote();
    }

    /**
     * Update sticky note with current ability selection state
     */
    private updateStickyNote(): void {
        const rarity = RARITY_BUDGETS[this.currentRarity];
        if (!rarity) return;

        // Update rarity display
        const rarityIcon = document.getElementById('note-rarity-icon');
        const rarityName = document.getElementById('note-rarity-name');
        if (rarityIcon) rarityIcon.textContent = rarity.icon;
        if (rarityName) rarityName.textContent = rarity.nameHe;

        // Update budget bar
        const currentCost = this.calculateCurrentCost();
        const percentage = Math.min((currentCost / this.maxBudget) * 100, 100);

        const budgetFill = document.getElementById('note-budget-fill');
        const budgetUsed = document.getElementById('note-budget-used');
        const budgetMax = document.getElementById('note-budget-max');

        if (budgetFill) {
            budgetFill.style.width = `${percentage}%`;
            budgetFill.classList.remove('warning', 'full');
            if (percentage >= 100) {
                budgetFill.classList.add('full');
            } else if (percentage >= 75) {
                budgetFill.classList.add('warning');
            }
        }
        if (budgetUsed) budgetUsed.textContent = String(currentCost);
        if (budgetMax) budgetMax.textContent = String(this.maxBudget);

        // Update abilities list
        const abilitiesList = document.getElementById('note-abilities-list');
        if (!abilitiesList) return;

        if (this.selectedAbilities.size === 0) {
            abilitiesList.innerHTML = '<div class="no-abilities">לא נבחרו יכולות</div>';
            return;
        }

        const allAbilities = { ...getAllAbilitiesFlat(), ...DAMAGE_ELEMENTS };
        abilitiesList.innerHTML = '';

        for (const id of this.selectedAbilities) {
            const ability = allAbilities[id];
            if (!ability) continue;

            const item = document.createElement('div');
            item.className = 'ability-item';
            item.innerHTML = `
                <span class="ability-item-name">${ability.nameHe}</span>
                <span class="ability-item-cost">${ability.cost || 0}</span>
            `;
            abilitiesList.appendChild(item);
        }
    }

    public onChange(callback: (abilities: string[]) => void): void {
        this.onChangeCallback = callback;
    }

    // ==================== EDIT MODE ====================

    private initEditMode(): void {
        // Listen for Ctrl+Shift+E to toggle edit mode
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.toggleEditMode();
            }
        });

        // Mouse event handlers for dragging
        document.addEventListener('mousemove', (e: MouseEvent) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.handleDragEnd());
    }

    private toggleEditMode(): void {
        this.editMode = !this.editMode;

        const overlay = document.getElementById('ability-icons-overlay');
        if (overlay) {
            overlay.classList.toggle('edit-mode', this.editMode);
        }

        if (this.editMode) {
            this.showEditPanel();
            console.log('🔧 Edit Mode ON - Drag squares to reposition, Shift+Drag to resize');
        } else {
            this.hideEditPanel();
            console.log('🔧 Edit Mode OFF');
        }

        // Refresh to apply edit mode styles
        this.switchCategory(this.currentCategory);
    }

    private showEditPanel(): void {
        let panel = document.getElementById('icon-edit-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'icon-edit-panel';
            panel.innerHTML = `
                <div style="position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.9); 
                            color: #d4af37; padding: 15px; border-radius: 8px; z-index: 9999;
                            border: 2px solid #d4af37; font-family: monospace; min-width: 280px;">
                    <div style="font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #d4af37; padding-bottom: 8px;">
                        🔧 מצב עריכה - <span id="edit-category">${this.currentCategory}</span>
                    </div>
                    <div id="edit-position-info" style="font-size: 12px; margin-bottom: 10px;">
                        בחר ריבוע לעריכה
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button id="edit-copy-config" style="background: #d4af37; color: #000; border: none; 
                                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            העתק קונפיג
                        </button>
                        <button id="edit-close" style="background: #666; color: #fff; border: none; 
                                padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                            סגור (Ctrl+Shift+E)
                        </button>
                    </div>
                    <div style="font-size: 10px; margin-top: 8px; color: #888;">
                        גרור = הזז | Shift+גרור = שנה גודל
                    </div>
                </div>
            `;
            document.body.appendChild(panel);

            document.getElementById('edit-copy-config')?.addEventListener('click', () => this.copyConfig());
            document.getElementById('edit-close')?.addEventListener('click', () => this.toggleEditMode());
        }
        panel.style.display = 'block';
    }

    private hideEditPanel(): void {
        const panel = document.getElementById('icon-edit-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    private updateEditInfo(iconId: string, x: number, y: number, width: number, height: number): void {
        const info = document.getElementById('edit-position-info');
        if (info) {
            info.innerHTML = `
                <div><strong>${iconId}</strong></div>
                <div>x: <span style="color: #4ade80">${x.toFixed(1)}%</span></div>
                <div>y: <span style="color: #4ade80">${y.toFixed(1)}%</span></div>
                <div>width: <span style="color: #60a5fa">${width.toFixed(1)}%</span></div>
                <div>height: <span style="color: #60a5fa">${height.toFixed(1)}%</span></div>
            `;
        }
        const categorySpan = document.getElementById('edit-category');
        if (categorySpan) {
            categorySpan.textContent = this.currentCategory;
        }
    }

    private handleDragStart(e: MouseEvent, btn: HTMLElement, icon: IconPosition): void {
        if (!this.editMode) return;

        e.preventDefault();
        e.stopPropagation();

        this.dragTarget = btn;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartLeft = icon.x;
        this.dragStartTop = icon.y;

        btn.style.cursor = 'grabbing';
        btn.classList.add('dragging');
    }

    private handleDrag(e: MouseEvent): void {
        if (!this.dragTarget || !this.editMode) return;

        const overlay = document.getElementById('ability-icons-overlay');
        if (!overlay) return;

        const rect = overlay.getBoundingClientRect();
        const iconId = this.dragTarget.getAttribute('data-ability-id');
        if (!iconId) return;

        // Get current icon config
        const config = SCROLL_CONFIGS[this.currentCategory];
        const iconIndex = config.icons.findIndex(i => i.id === iconId);
        if (iconIndex === -1) return;

        const icon = config.icons[iconIndex];

        if (e.shiftKey) {
            // Resize mode
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;

            const widthChange = (deltaX / rect.width) * 100;
            const heightChange = (deltaY / rect.height) * 100;

            const newWidth = Math.max(5, icon.width + widthChange);
            const newHeight = Math.max(5, icon.height + heightChange);

            this.dragTarget.style.width = `${newWidth}%`;
            this.dragTarget.style.height = `${newHeight}%`;

            // Update stored position
            icon.width = newWidth;
            icon.height = newHeight;

            this.updateEditInfo(iconId, icon.x, icon.y, newWidth, newHeight);
        } else {
            // Move mode
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;

            const xChange = (deltaX / rect.width) * 100;
            const yChange = (deltaY / rect.height) * 100;

            const newX = this.dragStartLeft + xChange;
            const newY = this.dragStartTop + yChange;

            this.dragTarget.style.left = `${newX}%`;
            this.dragTarget.style.top = `${newY}%`;

            // Update stored position
            icon.x = newX;
            icon.y = newY;

            this.updateEditInfo(iconId, newX, newY, icon.width, icon.height);
        }
    }

    private handleDragEnd(): void {
        if (this.dragTarget) {
            this.dragTarget.style.cursor = 'grab';
            this.dragTarget.classList.remove('dragging');
            this.dragTarget = null;
        }
    }

    private copyConfig(): void {
        const config = SCROLL_CONFIGS[this.currentCategory];
        const output = config.icons.map(icon =>
            `{ id: '${icon.id}', x: ${icon.x.toFixed(1)}, y: ${icon.y.toFixed(1)}, width: ${icon.width.toFixed(1)}, height: ${icon.height.toFixed(1)} }`
        ).join(',\n');

        const fullConfig = `// ${this.currentCategory} icon positions:\nicons: [\n    ${output.split('\n').join('\n    ')}\n]`;

        navigator.clipboard.writeText(fullConfig).then(() => {
            console.log('✅ Config copied to clipboard!');
            console.log(fullConfig);
            if ((window as any).showToast) {
                (window as any).showToast('הקונפיג הועתק!', 'success');
            }
        });
    }
}

// Export singleton instance
let instance: AbilitySelectorController | null = null;

export function initAbilitySelector(): AbilitySelectorController {
    if (!instance) {
        instance = new AbilitySelectorController();
    }
    return instance;
}

export default AbilitySelectorController;
