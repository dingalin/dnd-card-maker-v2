// @ts-nocheck
import { AssemblyStateManager } from './assembly/AssemblyStateManager.js';
import { AssemblyUIManager } from './assembly/AssemblyUIManager.js';
import CardRenderer from '../card-renderer.ts';
import i18n from '../i18n.ts';

interface WindowGlobals {
    i18n?: any;
    uiManager?: any;
    stateManager?: any;
}

export class AssemblyController {
    public state: AssemblyStateManager;
    public ui: AssemblyUIManager | null;
    public renderer: any;
    public globalUI: any;
    public currentCategory: string | undefined;

    constructor() {
        this.state = new AssemblyStateManager();
        console.log("AssemblyController initialized. State:", this.state);
        this.ui = null; // initialized in init
        this.renderer = null; // initialized in initCardRenderer
        this.globalUI = null;
    }

    init(globalUI?: any) {
        if (globalUI) this.globalUI = globalUI;
        this.ui = new AssemblyUIManager(this, this.globalUI);
        this.ui.bindEvents();

        // Initial setup
        this.loadCategory('weapon');
        this.updateAll();
    }

    initCardRenderer() {
        // Initialize independent renderer for assembly canvas
        this.renderer = new CardRenderer('assembly-card-canvas');
        if (this.renderer.ctx) {
            this.renderEmptyCard();
        }
    }

    // ==========================================
    // ACTIONS
    // ==========================================

    onCategorySelect(e: Event) {
        const target = e.target as HTMLElement;
        const btn = target.closest('.category-btn') as HTMLElement;
        if (!btn) return;

        // Visual update
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.category;
        if (category) this.loadCategory(category);
    }

    onSubcategorySelect(subId: string) {
        if (this.currentCategory) {
            this.loadDock(this.currentCategory, subId);
        }
    }

    onRarityChange(rarity: string) {
        this.state.updateMaxBudget(rarity);
        this.updateAll();
    }

    onDropToken(tokenData: any) {
        // Map token type to socket type
        let socketType = tokenData.type;
        if (tokenData.type === 'damage-dice') socketType = 'element';

        this.state.setSocket(socketType, tokenData);
        this.updateAll();

        // Highlight compatible socket handled by UI visuals, but we could do more here
    }

    onRemoveAbility(index: number) {
        this.state.removeAbility(index);
        this.updateAll();
    }

    onClear() {
        this.state.reset();
        this.updateAll();

        // Reset Inputs handled by UI mostly, but explicit clear here depending on UI implementation
        // My UI implementation had bindings but maybe not explicit "set value".
        if (this.ui) {
            this.ui.updateCardPreview(i18n.t('assembly.newItem') || 'New Item', '');
            if (this.ui.elements.itemName) this.ui.elements.itemName.value = '';
            if (this.ui.elements.flavorText) this.ui.elements.flavorText.value = '';
        }

        this.renderEmptyCard();
    }

    onGenerate() {
        const build = this.state.currentBuild;
        if (!build.base) {
            this.globalUI?.showToast(i18n.t('assembly.selectBase') || 'Select a base item', 'warning');
            return;
        }

        if (!this.ui) return;

        const data = this.state.getGenerationData(
            this.ui.elements.itemName?.value.trim(),
            this.ui.elements.flavorText?.value.trim(),
            i18n.getLocale()
        );

        console.log('🔨 Assembly Build:', data);

        // Dispatch to GeneratorController
        document.dispatchEvent(new CustomEvent('assembly-generate-item', {
            detail: data
        }));

        this.globalUI?.showToast(i18n.t('assembly.generating') || 'Generating card...', 'info');
    }

    onInputChanged() {
        // Just update preview text if needed, or state if we stored name in state
        // Currently state doesn't store name until generation
    }

    // ==========================================
    // LOGIC & UPDATES
    // ==========================================

    loadCategory(category: string) {
        this.currentCategory = category;

        // Subcategories
        const subcategories = this.getSubcategories(category);
        const firstSub = subcategories[0]?.id;

        if (this.ui) {
            this.ui.renderSubcategories(subcategories, firstSub);
        }
        this.loadDock(category, firstSub);
    }

    loadDock(category: string, subcategory?: string) {
        const isHebrew = i18n.getLocale() === 'he';
        let tokens: any[] = [];

        if (category === 'weapon' || category === 'armor' || category === 'wondrous') {
            tokens = this._getBaseTokens(subcategory, isHebrew);
        } else if (category === 'essence') {
            tokens = this._getElementTokens(isHebrew);
        } else if (category === 'enchantment') {
            tokens = this._getRarityTokens(isHebrew);
        } else if (category === 'feature') {
            tokens = this._getAbilityTokens(subcategory, isHebrew);
        }

        if (this.ui) {
            this.ui.renderDock(tokens);
            this.ui.renderSubcategories(this.getSubcategories(category), subcategory);
        }
    }

    getSubcategories(category: string) {
        const isHebrew = i18n.getLocale() === 'he';

        const map: Record<string, any[]> = {
            weapon: [
                { id: 'melee', name: isHebrew ? 'קטטה' : 'Melee' },
                { id: 'ranged', name: isHebrew ? 'טווח' : 'Ranged' }
            ],
            armor: [
                { id: 'light', name: isHebrew ? 'קל' : 'Light' },
                { id: 'medium', name: isHebrew ? 'בינוני' : 'Medium' },
                { id: 'heavy', name: isHebrew ? 'כבד' : 'Heavy' },
                { id: 'shield', name: isHebrew ? 'מגן' : 'Shield' }
            ],
            wondrous: [
                { id: 'worn', name: isHebrew ? 'לבוש' : 'Worn' },
                { id: 'held', name: isHebrew ? 'מוחזק' : 'Held' },
                { id: 'jewelry', name: isHebrew ? 'תכשיט' : 'Jewelry' }
            ],
            essence: [],
            enchantment: [],
            feature: []
        };

        return map[category] || [];
    }

    updateAll() {
        const build = this.state.currentBuild;

        if (!this.ui) return;

        // Budget
        const breakdown = this.state.getBreakdown();
        this.ui.updateBudget(build.totalCost, build.maxBudget, breakdown);

        // Sockets
        this.ui.updateSockets(build);

        // Stats
        this.updateStatsDisplay();

        // Generate Button
        const canGenerate = !!build.base && this.state.canAfford(0); // check strictly within budget?
        // Logic in old controller: within elements limits + budget.
        this.ui.updateGenerateBtn(!canGenerate);

        // Canvas
        this.drawBuildOnCanvas();
    }

    updateStatsDisplay() {
        if (!this.ui) return;

        const base = this.state.getBaseItemData();
        const isHebrew = i18n.getLocale() === 'he';
        const build = this.state.currentBuild;

        if (!base) {
            this.ui.updateStats(`<span class="stat-placeholder">${i18n.t('assembly.statsPlaceholder') || 'Stats will appear here'}</span>`);
            return;
        }

        let statsHtml = '';

        if (base.category === 'weapon') {
            const bonus = build.rarity?.id === 'plus3' ? '+3' :
                build.rarity?.id === 'plus2' ? '+2' :
                    build.rarity?.id === 'plus1' ? '+1' : '';

            let damage = base.damage;
            if (bonus) damage += ` ${bonus}`;
            const damageType = isHebrew ? base.damageTypeHe : base.damageType;

            let extraDamage = '';
            if (build.damageDice && build.element) {
                const diceData = this.state.getElementTokens(isHebrew).find((t: any) => t.id === build.damageDice.id && t.type === 'damage-dice'); // Optimization: Store this data or look it up efficiently?
                // actually getGenerationData resolves this.
                // Let's use simple lookup for UI
                const dice = build.damageDice.name; // token name has "1d6"
                const elemName = build.element.name;
                extraDamage = ` + ${dice} ${elemName}`;
            }

            statsHtml = `<div class="stat-line"><strong>${isHebrew ? 'נזק' : 'Damage'}:</strong> ${damage} ${damageType}${extraDamage}</div>`;
        } else {
            const bonus = build.rarity?.id === 'plus3' ? 3 :
                build.rarity?.id === 'plus2' ? 2 :
                    build.rarity?.id === 'plus1' ? 1 : 0;
            const ac = (base.ac || 10) + bonus;

            statsHtml = `<div class="stat-line"><strong>${isHebrew ? 'דרג"ש' : 'AC'}:</strong> ${ac}</div>`;
        }

        this.ui.updateStats(statsHtml);
    }

    // ==========================================
    // DATA RETRIEVAL HELPERS (Wrapper for State)
    // ==========================================

    _getBaseTokens(subcategory: string | undefined, isHebrew: boolean) {
        // @ts-ignore
        if (this.state && typeof this.state.getBaseTokens === 'function') {
            // @ts-ignore
            return this.state.getBaseTokens(subcategory, isHebrew);
        }
        console.error("AssemblyController: this.state.getBaseTokens is missing!", this.state);
        return [];
    }

    _getElementTokens(isHebrew: boolean) {
        // @ts-ignore
        if (this.state && typeof this.state.getElementTokens === 'function') {
            // @ts-ignore
            return this.state.getElementTokens(isHebrew);
        }
        return [];
    }

    _getRarityTokens(isHebrew: boolean) {
        // @ts-ignore
        if (this.state && typeof this.state.getRarityTokens === 'function') {
            // @ts-ignore
            return this.state.getRarityTokens(isHebrew);
        }
        return [];
    }

    _getAbilityTokens(subcategory: string | undefined, isHebrew: boolean) {
        // @ts-ignore
        if (this.state && typeof this.state.getAbilityTokens === 'function') {
            // @ts-ignore
            return this.state.getAbilityTokens(subcategory, isHebrew);
        }
        return [];
    }


    // ==========================================
    // CANVAS RENDERING (PREVIEW)
    // ==========================================

    renderEmptyCard() {
        if (!this.renderer) return;

        this.renderer.renderCard({
            name: '',
            scans: [],
            theme: 'default',
            description: ''
        }, {
            renderBack: false,
            emptyTemplate: true
        });
    }

    async drawBuildOnCanvas() {
        if (!this.renderer || !this.renderer.ctx) return;

        await this.renderEmptyCard();
        const ctx = this.renderer.ctx;

        const build = this.state.currentBuild;

        // Draw icons (Simplified visualization key points)
        // Hardcoded coords from original controller
        if (build.base) this.drawTextWithIcon(ctx, build.base.icon, build.base.name, 375, 525, 60);
        if (build.element) this.drawTextWithIcon(ctx, build.element.icon, build.element.name, 375, 400, 40);
        if (build.abilities.length > 0) {
            build.abilities.forEach((ab: any, i: number) => {
                this.drawTextWithIcon(ctx, ab.icon, ab.name, 375, 650 + (i * 50), 30);
            });
        }
    }

    drawTextWithIcon(ctx: CanvasRenderingContext2D, icon: string, text: string, x: number, y: number, fontSize: number) {
        ctx.save();
        ctx.font = `bold ${fontSize}px "Cinzel", "Segoe UI Emoji", sans-serif`;
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${icon} ${text}`, x, y);
        ctx.restore();
    }
}

const assemblyController = new AssemblyController();
export default assemblyController;
