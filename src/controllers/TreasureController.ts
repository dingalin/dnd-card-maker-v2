// @ts-nocheck
/**
 * TreasureController - Handles the Treasure Generator tab
 * Manages both automatic (CR-based) and manual treasure generation
 */

import {
    ENEMY_TYPES,
    ITEM_TYPE_ICONS,
    rollGold,
    selectItemType,
    selectRarity,
    getThemeKeywords
} from '../treasure-data.ts';
import { enrichItemDetails } from '../utils/item-enrichment.ts';
import i18n from '../i18n.ts';
import CardRenderer from '../card-renderer.ts';

interface WindowGlobals {
    i18n?: any;
    OFFICIAL_ITEMS?: any;
    treasureController?: any;
}

export default class TreasureController {
    public state: any;
    public ui: any;
    public generator: any;
    public currentMode: 'auto' | 'manual';
    public treasureList: any[];
    public generatedCards: any[];
    public isGenerating: boolean;

    constructor(stateManager: any, uiManager: any, generatorController: any) {
        this.state = stateManager;
        this.ui = uiManager;
        this.generator = generatorController;

        // Internal state
        this.currentMode = 'auto';
        this.treasureList = []; // For manual mode
        this.generatedCards = []; // Generated treasure cards
        this.isGenerating = false;

        this.setupListeners();
    }

    setupListeners() {
        // Mode toggle
        const autoBtn = document.getElementById('treasure-mode-auto');
        const manualBtn = document.getElementById('treasure-mode-manual');

        if (autoBtn) {
            autoBtn.addEventListener('click', () => this.switchMode('auto'));
        }
        if (manualBtn) {
            manualBtn.addEventListener('click', () => this.switchMode('manual'));
        }

        // Counter controls
        const decreaseBtn = document.getElementById('item-count-decrease');
        const increaseBtn = document.getElementById('item-count-increase');

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => this.updateItemCount(-1));
        }
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => this.updateItemCount(1));
        }

        // Generate treasure button (auto mode)
        const generateBtn = document.getElementById('generate-treasure-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateAutoTreasure());
        }

        // Manual mode controls
        const addItemBtn = document.getElementById('add-item-to-list-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addItemToList());
        }

        const generateAllBtn = document.getElementById('generate-all-cards-btn');
        if (generateAllBtn) {
            generateAllBtn.addEventListener('click', () => this.generateManualTreasure());
        }

        // Item type change for subtype population
        const itemTypeSelect = document.getElementById('manual-item-type');
        if (itemTypeSelect) {
            itemTypeSelect.addEventListener('change', () => this.populateSubtypes());
        }

        // Action buttons
        const saveAllBtn = document.getElementById('save-all-to-gallery-btn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => this.saveAllToGallery());
        }

        const clearBtn = document.getElementById('clear-treasure-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearTreasure());
        }

        // Initialize subtypes
        this.populateSubtypes();

        // Subscribe to locale changes to refresh dropdowns
        if (i18n && (i18n as any).onLocaleChange) {
            (i18n as any).onLocaleChange(() => {
                this.populateSubtypes();
            });
        }
    }

    switchMode(mode: 'auto' | 'manual') {
        this.currentMode = mode;

        // Update toggle buttons
        const autoBtn = document.getElementById('treasure-mode-auto');
        const manualBtn = document.getElementById('treasure-mode-manual');

        if (autoBtn && manualBtn) {
            autoBtn.classList.toggle('active', mode === 'auto');
            manualBtn.classList.toggle('active', mode === 'manual');
        }

        // Show/hide sections
        const autoSection = document.getElementById('treasure-auto-section');
        const manualSection = document.getElementById('treasure-manual-section');

        if (autoSection) {
            autoSection.classList.toggle('hidden', mode !== 'auto');
        }
        if (manualSection) {
            manualSection.classList.toggle('hidden', mode !== 'manual');
        }
    }

    updateItemCount(delta: number) {
        const display = document.getElementById('item-count-display');
        const input = document.getElementById('treasure-item-count') as HTMLInputElement;

        if (!display || !input) return;

        let count = parseInt(input.value) + delta;
        count = Math.max(1, Math.min(10, count)); // Clamp between 1-10

        input.value = count.toString();
        display.textContent = count.toString();
    }

    populateSubtypes() {
        const typeSelect = document.getElementById('manual-item-type') as HTMLSelectElement;
        const subtypeSelect = document.getElementById('manual-subtype');

        if (!typeSelect || !subtypeSelect) return;

        const selectedType = typeSelect.value;
        const items = (window as unknown as WindowGlobals).OFFICIAL_ITEMS?.[selectedType];

        // Get current locale
        const locale = i18n.getLocale() || 'he';
        const isHebrew = locale === 'he';

        // Helper function to display item name based on locale
        // Format in data is "EnglishName (HebrewName)"
        const getDisplayName = (fullName: string) => {
            const match = fullName.match(/^(.+?)\s*\((.+)\)$/);
            if (match) {
                const [, englishName, hebrewName] = match;
                return isHebrew ? `${hebrewName} (${englishName})` : englishName;
            }
            return fullName;
        };

        // Clear existing options
        const defaultText = isHebrew ? '-- בחר חפץ --' : '-- Select Item --';
        subtypeSelect.innerHTML = `<option value="">${defaultText}</option>`;

        if (items) {
            Object.entries(items).forEach(([category, itemList]: [string, any]) => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;

                itemList.forEach((item: string) => {
                    const option = document.createElement('option');
                    option.value = item; // Keep original value for lookups
                    option.textContent = getDisplayName(item);
                    optgroup.appendChild(option);
                });

                subtypeSelect.appendChild(optgroup);
            });
        }
    }

    addItemToList() {
        const rarity = (document.getElementById('manual-rarity') as HTMLSelectElement)?.value || '5-10';
        const itemType = (document.getElementById('manual-item-type') as HTMLSelectElement)?.value || 'weapon';
        const subtype = (document.getElementById('manual-subtype') as HTMLSelectElement)?.value || '';
        const theme = (document.getElementById('manual-theme') as HTMLInputElement)?.value || '';

        const item = {
            id: Date.now(),
            rarity,
            type: itemType,
            subtype,
            theme,
            icon: ITEM_TYPE_ICONS[itemType] || '📦',
            displayName: subtype || this.getTypeName(itemType)
        };

        this.treasureList.push(item);
        this.updateTreasureListUI();

        // Clear theme input
        const themeInput = document.getElementById('manual-theme') as HTMLInputElement;
        if (themeInput) themeInput.value = '';
    }

    removeItemFromList(id: number) {
        this.treasureList = this.treasureList.filter(item => item.id !== id);
        this.updateTreasureListUI();
    }

    getTypeName(type: string) {
        const locale = i18n.getLocale() || 'he';
        const isHebrew = locale === 'he';

        const names: Record<string, string> = {
            weapon: isHebrew ? 'נשק' : 'Weapon',
            armor: isHebrew ? 'שריון' : 'Armor',
            wondrous: isHebrew ? 'חפץ פלא' : 'Wondrous Item',
            potion: isHebrew ? 'שיקוי' : 'Potion',
            ring: isHebrew ? 'טבעת' : 'Ring',
            scroll: isHebrew ? 'מגילה' : 'Scroll',
            staff: isHebrew ? 'מטה' : 'Staff',
            wand: isHebrew ? 'שרביט' : 'Wand'
        };
        return names[type] || type;
    }

    getRarityLabel(rarity: string) {
        const locale = i18n.getLocale() || 'he';
        const isHebrew = locale === 'he';

        const labels: Record<string, string> = {
            'mundane': isHebrew ? 'רגיל' : 'Mundane',
            '1-4': isHebrew ? 'נפוץ' : 'Common',
            '5-10': isHebrew ? 'לא נפוץ' : 'Uncommon',
            '11-16': isHebrew ? 'נדיר' : 'Rare',
            '17+': isHebrew ? 'אגדי' : 'Legendary'
        };
        return labels[rarity] || rarity;
    }

    updateTreasureListUI() {
        const listContainer = document.getElementById('treasure-list');
        const countBadge = document.getElementById('list-count');
        const generateBtn = document.getElementById('generate-all-cards-btn') as HTMLButtonElement;

        if (!listContainer) return;

        if (this.treasureList.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-list-message" data-i18n="treasureGenerator.emptyList">
                    הרשימה ריקה. הוסף חפצים למעלה.
                </div>
            `;
            if (generateBtn) generateBtn.disabled = true;
        } else {
            listContainer.innerHTML = this.treasureList.map(item => `
                <div class="treasure-list-item" data-id="${item.id}">
                    <div class="item-info">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.displayName}</span>
                        <span class="item-rarity">${this.getRarityLabel(item.rarity)}</span>
                    </div>
                    <button class="remove-btn" onclick="window.treasureController?.removeItemFromList(${item.id})">🗑️</button>
                </div>
            `).join('');
            if (generateBtn) generateBtn.disabled = false;
        }

        if (countBadge) {
            countBadge.textContent = this.treasureList.length.toString();
        }
    }

    async generateAutoTreasure() {
        if (this.isGenerating) return;

        const crRange = (document.getElementById('treasure-cr') as HTMLSelectElement)?.value || '5-10';
        const enemyType = (document.getElementById('treasure-enemy-type') as HTMLSelectElement)?.value || 'humanoid';
        const itemCount = parseInt((document.getElementById('treasure-item-count') as HTMLInputElement)?.value) || 3;
        const includeGold = (document.getElementById('treasure-include-gold') as HTMLInputElement)?.checked ?? true;
        const surprise = (document.getElementById('treasure-surprise') as HTMLInputElement)?.checked ?? false;

        this.showGenerationStatus(true);
        this.clearTreasurePreview();

        try {
            // Generate gold if enabled
            let goldAmount = 0;
            if (includeGold) {
                goldAmount = rollGold(crRange, enemyType);
                this.showGoldDisplay(goldAmount);
            }

            // Generate items
            const itemsToGenerate = [];
            for (let i = 0; i < itemCount; i++) {
                const itemType = selectItemType(enemyType);
                let rarity = selectRarity(crRange);

                // Surprise mode: last item is one rarity higher
                // @ts-ignore
                if (surprise && i === itemCount - 1) {
                    const rarityOrder = ['mundane', 'common', 'uncommon', 'rare', 'veryRare', 'legendary'];
                    const currentIndex = rarityOrder.indexOf(rarity);
                    if (currentIndex < rarityOrder.length - 1) {
                        rarity = rarityOrder[currentIndex + 1];
                    }
                }

                // Get theme keywords from enemy type
                const themeKeywords = getThemeKeywords(enemyType, i18n.getLocale());

                itemsToGenerate.push({
                    type: itemType,
                    rarity: this.rarityToLevel(rarity),
                    theme: themeKeywords,
                    enemyType
                });
            }

            // Generate each item
            for (let i = 0; i < itemsToGenerate.length; i++) {
                this.updateGenerationStatus(`יוצר חפץ ${i + 1} מתוך ${itemsToGenerate.length}...`);
                await this.generateSingleItem(itemsToGenerate[i], i);
            }

            this.showTreasureActions(true);
            this.ui.showToast(i18n.t('treasureGenerator.success') || `נוצרו ${itemsToGenerate.length} חפצים בהצלחה!`, 'success');

        } catch (error) {
            console.error('Treasure generation error:', error);
            this.ui.showToast(i18n.t('treasureGenerator.error') || 'שגיאה ביצירת האוצר', 'error');
        } finally {
            this.showGenerationStatus(false);
        }
    }

    async generateManualTreasure() {
        if (this.isGenerating || this.treasureList.length === 0) return;

        this.showGenerationStatus(true);
        this.clearTreasurePreview();

        try {
            // Get gold amount
            const goldAmount = parseInt((document.getElementById('manual-gold') as HTMLInputElement)?.value) || 0;
            if (goldAmount > 0) {
                this.showGoldDisplay(goldAmount);
            }

            // Generate each item from the list
            for (let i = 0; i < this.treasureList.length; i++) {
                const item = this.treasureList[i];
                this.updateGenerationStatus(`יוצר חפץ ${i + 1} מתוך ${this.treasureList.length}...`);

                await this.generateSingleItem({
                    type: item.type,
                    subtype: item.subtype,
                    rarity: item.rarity,
                    theme: item.theme,
                    enemyType: null
                }, i);
            }

            this.showTreasureActions(true);
            this.ui.showToast(i18n.t('treasureGenerator.success') || `נוצרו ${this.treasureList.length} חפצים בהצלחה!`, 'success');

        } catch (error) {
            console.error('Manual treasure generation error:', error);
            this.ui.showToast(i18n.t('treasureGenerator.error') || 'שגיאה ביצירת האוצר', 'error');
        } finally {
            this.showGenerationStatus(false);
        }
    }

    rarityToLevel(rarity: string) {
        const map: Record<string, string> = {
            'mundane': 'mundane',
            'common': '1-4',
            'uncommon': '5-10',
            'rare': '11-16',
            'veryRare': '17+',
            'legendary': '17+'
        };
        return map[rarity] || '5-10';
    }

    async generateSingleItem(itemConfig: any, index: number) {
        const { type, subtype, rarity, theme, enemyType } = itemConfig;

        // Add a loading card placeholder
        this.addLoadingCard(index);

        try {
            // Dispatch event to GeneratorController for actual item generation
            /*
            const generateEvent = new CustomEvent('treasure-generate-item', {
                detail: {
                    type,
                    subtype: subtype || this.getRandomSubtype(type),
                    level: rarity,
                    ability: theme,
                    enemyType,
                    targetIndex: index,
                    complexityMode: 'creative'
                }
            });
            */

            // Use the existing generator infrastructure
            const result = await this.generateItemViaAPI(itemConfig);

            // Replace loading card with actual card
            this.replaceLoadingCard(index, result);
            this.generatedCards.push(result);

        } catch (error) {
            console.error(`Error generating item ${index}:`, error);
            this.replaceLoadingCardWithError(index);
        }
    }

    async generateItemViaAPI(itemConfig: any) {
        // Get API key
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            throw new Error('No API key configured');
        }

        // Use GeminiService directly
        const GeminiService = (await import('../gemini-service.ts')).default;
        const gemini = new GeminiService(apiKey);

        // Determine subtype - ALWAYS pick a specific item from the dropdown list
        const subtype = itemConfig.subtype || this.getRandomSubtype(itemConfig.type);
        console.log('TreasureController: Using subtype:', subtype);

        // Build ability/theme with enemy type influence
        let ability = itemConfig.theme || '';
        if (itemConfig.enemyType && ENEMY_TYPES[itemConfig.enemyType]) {
            const enemyVisual = ENEMY_TYPES[itemConfig.enemyType].visualStyle;
            if (!ability && enemyVisual) {
                ability = enemyVisual.aesthetic;
            }
        }

        // Generate item details
        const itemDetails = await gemini.generateItemDetails(
            itemConfig.rarity,
            itemConfig.type,
            subtype,
            this.getRarityLabel(itemConfig.rarity),
            ability,
            null,
            'creative',
            i18n.getLocale()
        );

        // ENRICH item details with proper typeHe and coreStats from D&D data
        enrichItemDetails(itemDetails, itemConfig.type, subtype, i18n.getLocale());

        // Generate image - use same settings as Card Creator
        // ENHANCED: For wondrous items, ensure the item type is included in the visual prompt
        let visualPrompt = itemDetails.visualPrompt || itemDetails.name;

        // FIX: Ensure wondrous items include their specific type in the prompt to avoid irrelevant images
        if (itemConfig.type === 'wondrous' && subtype) {
            // Extract the English name from subtype (e.g., "Belt (חגורה)" -> "Belt")
            const englishName = subtype.includes('(') ? subtype.split('(')[0].trim() : subtype;
            // If the visualPrompt doesn't already mention the item type, prepend it
            if (!visualPrompt.toLowerCase().includes(englishName.toLowerCase())) {
                visualPrompt = `${englishName}: ${visualPrompt}`;
                console.log('📝 TreasureController: Enhanced wondrous item prompt:', visualPrompt);
            }
        }

        const getImgKey = localStorage.getItem('getimg_api_key');

        // Read user preferences from Card Creator UI or localStorage
        // Priority: 1. DOM element, 2. localStorage, 3. default
        const imageStyleEl = document.getElementById('image-style') as HTMLSelectElement;
        const styleOptionEl = document.getElementById('image-style-option') as HTMLSelectElement;

        // Try to get saved preferences from localStorage as fallback
        const savedImageStyle = localStorage.getItem('preferred_image_style');
        const savedStyleOption = localStorage.getItem('preferred_style_option');

        // Default to 'realistic' style (not dark_fantasy)
        const imageStyle = imageStyleEl?.value || savedImageStyle || 'realistic';
        const styleOption = styleOptionEl?.value || savedStyleOption || 'natural';

        // DEBUG: Log image generation settings
        console.log('🎨 TreasureController: Image generation settings:', {
            visualPrompt,
            imageStyle,
            styleOption,
            source: imageStyleEl ? 'DOM' : (savedImageStyle ? 'localStorage' : 'default'),
            hasStyleElement: !!imageStyleEl,
            hasStyleOptionElement: !!styleOptionEl
        });

        let imageUrl = null;
        try {
            // Get current template URL for AI theme detection
            const currentState = this.state.getState();
            const templateUrl = currentState?.settings?.style?.cardBackgroundUrl || null;

            // Get selected image model from dropdown (default to flux)
            const imageModel = (document.getElementById('image-model') as HTMLSelectElement)?.value || 'getimg-flux';

            const imageResult = await gemini.generateImageGetImg(
                visualPrompt,
                imageModel,     // Use selected model from dropdown
                imageStyle,     // Use user-selected style or 'realistic'
                getImgKey,
                styleOption,    // Use user-selected style option or 'natural'
                '#ffffff',      // Default color
                null,           // No color description
                templateUrl     // Pass template URL for AI theme detection
            );
            imageUrl = imageResult?.url || imageResult;
        } catch (imgError) {
            console.warn('Image generation failed:', imgError);
        }

        // DEBUG: Log what enrichItemDetails produced
        console.log('TreasureController: After enrichment:', {
            type: itemConfig.type,
            subtype,
            coreStats: itemDetails.coreStats,
            weaponDamage: itemDetails.weaponDamage,
            damageType: itemDetails.damageType,
            armorClass: itemDetails.armorClass,
            typeHe: itemDetails.typeHe
        });

        // Build full card data structure
        const cardData = {
            id: Date.now() + Math.random(),
            name: itemDetails.name || subtype || 'חפץ',
            rarityHe: this.getRarityLabel(itemConfig.rarity),
            typeHe: itemDetails.typeHe || this.getTypeName(itemConfig.type),
            // STATS FIELDS - Required by CardRenderer.drawText
            weaponDamage: itemDetails.weaponDamage,
            damageType: itemDetails.damageType,
            armorClass: itemDetails.armorClass,
            versatileDamage: itemDetails.versatileDamage,
            weaponProperties: itemDetails.weaponProperties,
            // Legacy field for compatibility
            coreStats: itemDetails.coreStats ||
                (itemDetails.weaponDamage ? `${itemDetails.weaponDamage} ${itemDetails.damageType || ''}`.trim() : '') ||
                (itemDetails.armorClass ? `AC ${itemDetails.armorClass}` : '') ||
                itemDetails.damage || '',
            quickStats: itemDetails.quickStats || itemDetails.description || '',
            gold: itemDetails.gold || '-',
            image: imageUrl,
            back: {
                title: itemDetails.abilityName || itemDetails.ability?.name || '',
                mechanics: itemDetails.abilityDesc || itemDetails.ability?.description || '',
                lore: itemDetails.lore || itemDetails.description || ''
            },
            // Visual settings
            visualPrompt: visualPrompt,
            type: itemConfig.type,
            subtype,
            rarity: itemConfig.rarity
        };

        // Render full card as thumbnail
        const cardThumbnail = await this.renderCardThumbnail(cardData, imageUrl);

        return {
            ...cardData,
            imageUrl: imageUrl,
            cardThumbnail: cardThumbnail || imageUrl
        };
    }

    // enrichItemDetails is now imported from '../utils/item-enrichment.js'
    // getDamageTypeHebrew is now handled by getDamageTypeTranslation in item-enrichment.js

    /**
     * Render a full card to an off-screen canvas and return as dataURL
     * Uses shared CardThumbnailRenderer utility for consistency
     */
    async renderCardThumbnail(cardData: any, imageUrl: string) {
        // Import shared renderer dynamically
        const { renderFrontThumbnail } = await import('../utils/CardThumbnailRenderer.ts');
        return renderFrontThumbnail(cardData, imageUrl, this.state);
    }

    getRandomSubtype(type: string) {
        const items = (window as unknown as WindowGlobals).OFFICIAL_ITEMS?.[type];
        if (!items) return '';

        const allItems = Object.values(items).flat();
        return allItems[Math.floor(Math.random() * allItems.length)];
    }

    addLoadingCard(index: number) {
        const grid = document.getElementById('treasure-cards-grid');
        if (!grid) return;

        // Remove empty message if present
        const emptyMessage = grid.querySelector('.empty-treasure-message');
        if (emptyMessage) emptyMessage.remove();

        const loadingCard = document.createElement('div');
        loadingCard.className = 'treasure-card loading';
        loadingCard.id = `treasure-card-${index}`;
        grid.appendChild(loadingCard);
    }

    replaceLoadingCard(index: number, itemData: any) {
        const card = document.getElementById(`treasure-card-${index}`);
        if (!card) return;

        // @ts-ignore
        const rarityClass = this.getRarityClass?.(itemData.rarity) || '';
        // Use the full card thumbnail if available, otherwise fall back to image
        const displayImage = itemData.cardThumbnail || itemData.imageUrl;

        // Store item data reference
        itemData._index = index;

        card.className = 'treasure-card';
        card.dataset.index = index.toString();
        card.innerHTML = `
            <button class="quick-regenerate-btn" data-index="${index}" title="יצירה מחדש">🔄</button>
            ${displayImage ? `<img src="${displayImage}" class="card-image" alt="${itemData.name}" data-side="front">` : ''}
            <div class="card-actions">
                <button class="action-btn regenerate-btn" data-index="${index}" title="יצירה מחדש">🔄</button>
                <button class="action-btn flip-btn" data-index="${index}" title="הפוך">↩️</button>
                <button class="action-btn edit-btn" data-index="${index}" title="ערוך">✏️</button>
                <button class="action-btn delete-btn" data-index="${index}" title="מחק">🗑️</button>
            </div>
        `;

        // Store card data for actions
        this.generatedCards[index] = itemData;

        // Bind action button events
        this.bindCardActions(card, index, itemData);
    }

    /**
     * Bind click handlers for card action buttons
     */
    bindCardActions(cardElement: Element, index: number, itemData: any) {
        // Click on image to view full card
        const cardImage = cardElement.querySelector('.card-image');
        if (cardImage) {
            cardImage.addEventListener('click', (e) => {
                e.stopPropagation();
                // @ts-ignore
                this.viewCard(itemData);
            });
        }

        // Quick Regenerate button (top-left corner)
        const quickRegenBtn = cardElement.querySelector('.quick-regenerate-btn');
        if (quickRegenBtn) {
            quickRegenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.regenerateCard(index, itemData);
            });
        }

        // Regenerate button (in action bar)
        const regenerateBtn = cardElement.querySelector('.regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.regenerateCard(index, itemData);
            });
        }

        // Flip button
        const flipBtn = cardElement.querySelector('.flip-btn');
        if (flipBtn) {
            flipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.flipCard(index, itemData);
            });
        }

        // Edit button
        const editBtn = cardElement.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // @ts-ignore
                this.editCard(itemData);
            });
        }

        // Delete button
        const deleteBtn = cardElement.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // @ts-ignore
                this.deleteCard(index);
            });
        }
    }

    /**
     * Regenerate a card with same parameters
     */
    async regenerateCard(index: number, itemData: any) {
        const card = document.getElementById(`treasure-card-${index}`);
        if (!card) return;

        // Show loading state
        card.classList.add('loading');
        card.innerHTML = '';

        try {
            // Regenerate with same config
            const newItemData = await this.generateItemViaAPI({
                type: itemData.type,
                subtype: itemData.subtype,
                rarity: itemData.rarity,
                theme: itemData.theme || ''
            });

            // Replace with new card
            this.replaceLoadingCard(index, newItemData);

            if (this.ui) {
                this.ui.showToast('הקלף נוצר מחדש!', 'success');
            }
        } catch (error) {
            console.error('Regenerate failed:', error);
            this.replaceLoadingCardWithError(index);
        }
    }

    /**
     * Flip card to show back side
     */
    async flipCard(index: number, itemData: any) {
        const card = document.getElementById(`treasure-card-${index}`);
        if (!card) return;

        const cardImage = card.querySelector('.card-image') as HTMLImageElement;
        if (!cardImage) return;

        const currentSide = cardImage.dataset.side || 'front';

        if (currentSide === 'front') {
            // Render back side
            const backThumbnail = await this.renderCardBackThumbnail(itemData);
            if (backThumbnail) {
                cardImage.src = backThumbnail;
                cardImage.dataset.side = 'back';
                const btn = card.querySelector('.flip-btn');
                if (btn) btn.textContent = '↪️';
            }
        } else {
            // Show front side
            cardImage.src = itemData.cardThumbnail || itemData.imageUrl;
            cardImage.dataset.side = 'front';
            const btn = card.querySelector('.flip-btn');
            if (btn) btn.textContent = '↩️';
        }
    }

    /**
     * Render card back to thumbnail
     */
    async renderCardBackThumbnail(cardData: any) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 750;
            canvas.height = 1050;
            canvas.id = 'temp-back-canvas-' + Date.now();
            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            const tempRenderer = new CardRenderer(canvas.id);
            await tempRenderer.templateReady;

            const renderData = {
                name: cardData.name,
                abilityName: cardData.back?.title || '',
                abilityDesc: cardData.back?.mechanics || '',
                description: cardData.back?.lore || ''
            };

            // Get current settings from stateManager (same settings used in Card Creator)
            const currentState = this.state.getState();
            const backSettings = currentState.settings?.back || {};
            const styleSettings = currentState.settings?.style || {};
            const bo = backSettings.offsets || {};
            const bs = backSettings.fontSizes || {};

            // Back side render options from stateManager
            const renderOptions = {
                fontSizes: {
                    abilityNameSize: bs.abilityNameSize || 62,
                    mechSize: bs.mechSize || 50,
                    loreSize: bs.loreSize || 46,
                    ...bs // spread remaining
                },
                offsets: {
                    ...bo // spread all offsets
                },
                color: styleSettings.cardTextColor || '#000000',
                renderBack: true,
                isBackSide: true // Explicit flag
            };

            // Force render back side
            await tempRenderer.renderCard(renderData, renderOptions);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            canvas.remove();
            return dataUrl;

        } catch (error) {
            console.error('Error rendering back thumbnail:', error);
            return null;
        }
    }

    replaceLoadingCardWithError(index: number) {
        const card = document.getElementById(`treasure-card-${index}`);
        if (card) {
            card.className = 'treasure-card error';
            card.innerHTML = `
                <div class="error-message">❌ שגיאה</div>
                <button class="remove-btn" onclick="this.parentElement.remove()">הסר</button>
            `;
        }
    }

    /**
     * View full card details
     */
    viewCard(itemData: any) {
        // Use global card viewer service
        if ((window as any).cardViewerService) {
            (window as any).cardViewerService.viewCard({
                ...itemData,
                // Ensure visual prompt is passed
                visualPrompt: itemData.visualPrompt
            });
        }
    }

    /**
     * Edit card in main editor
     */
    editCard(itemData: any) {
        if (!this.state) return;

        // Load into main state
        this.state.setCardData(itemData);

        // Switch to editor tab
        const creatorTab = document.querySelector('[data-tab="creator"]') as HTMLElement;
        if (creatorTab) creatorTab.click();

        this.ui.showToast(i18n.t('treasureGenerator.loadedToEditor') || 'נטען לעורך הראשי', 'success');
    }

    /**
     * Delete a generated card
     */
    deleteCard(index: number) {
        if (!confirm(i18n.t('treasureGenerator.confirmDelete') || 'מחק קלף זה?')) return;

        const card = document.getElementById(`treasure-card-${index}`);
        if (card) card.remove();

        // Clear from data
        delete this.generatedCards[index];
    }

    /**
     * Clear all generated cards
     */
    clearTreasure() {
        if (this.generatedCards.length > 0 && !confirm(i18n.t('treasureGenerator.confirmClear') || 'נקה את כל החפצים שנוצרו?')) return;

        const grid = document.getElementById('treasure-cards-grid');
        if (grid) grid.innerHTML = `
            <div class="empty-treasure-message" data-i18n="treasureGenerator.emptyMessage">
                חפצים שנוצרו יופיעו כאן...
            </div>
        `;

        this.generatedCards = [];
        this.clearTreasurePreview();
    }

    /**
     * Clear preview area
     */
    clearTreasurePreview() {
        // Implementation depends on if we have a separate preview area
        // Currently we render directly to grid
    }

    /**
     * Save all generated cards to history gallery
     */
    async saveAllToGallery() {
        const validCards = this.generatedCards.filter(c => c);

        if (validCards.length === 0) {
            this.ui.showToast(i18n.t('treasureGenerator.noCardsToSave') || 'אין קלפים לשמירה', 'warning');
            return;
        }

        let savedCount = 0;
        for (const card of validCards) {
            try {
                // We need to set state so saveToHistory knows what to save
                // This mimics the original functionality
                this.state.setCardData(card);
                // The thumbnail argument is what's used for the history grid usually
                const image = card.cardThumbnail || card.imageUrl || card.image;
                await this.state.saveToHistory(image);
                savedCount++;
            } catch (e) {
                console.error("Error saving card to history:", e);
            }
        }

        this.ui.showToast(i18n.t('treasureGenerator.savedCount', { count: savedCount }) || `נשמרו ${savedCount} קלפים לגלריה`, 'success');
    }

    // Helper to show/hide loading elements
    showGenerationStatus(show: boolean) {
        this.isGenerating = show;
        const loader = document.getElementById('treasure-loader');
        if (loader) loader.classList.toggle('hidden', !show);

        const generateBtn = document.getElementById('generate-treasure-btn') as HTMLButtonElement;
        if (generateBtn) generateBtn.disabled = show;

        const generateAllBtn = document.getElementById('generate-all-cards-btn') as HTMLButtonElement;
        if (generateAllBtn) generateBtn.disabled = show;
    }

    updateGenerationStatus(text: string) {
        const statusText = document.getElementById('treasure-status-text');
        if (statusText) statusText.textContent = text;
    }

    showGoldDisplay(amount: number) {
        const display = document.getElementById('treasure-gold-amount');
        if (display) {
            display.textContent = amount.toLocaleString() + ' gp';
            display.classList.remove('hidden');
        }
    }

    showTreasureActions(show: boolean) {
        const actions = document.getElementById('treasure-actions');
        if (actions) actions.classList.toggle('hidden', !show);
    }
}
