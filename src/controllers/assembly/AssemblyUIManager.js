export class AssemblyUIManager {
    constructor(controller, uiManager) {
        this.controller = controller;
        this.globalUI = uiManager;
        this.elements = {};
        this.draggedToken = null;
    }

    cacheElements() {
        this.elements = {
            // Sockets
            socketBase: document.getElementById('socket-base'),
            socketElement: document.getElementById('socket-element'),
            socketRarity: document.getElementById('socket-rarity'),
            socketAbility: document.getElementById('socket-ability'),
            dropZone: document.getElementById('assembly-socket-container'),

            // Console / Info
            budgetCurrent: document.getElementById('budget-current'),
            budgetMax: document.getElementById('budget-max'),
            budgetFilled: document.getElementById('budget-filled'),
            powerFill: document.getElementById('power-budget-fill'),
            powerText: document.getElementById('power-budget-text'),
            powerBreakdown: document.getElementById('power-budget-breakdown'),
            cardStats: document.getElementById('assembly-card-stats'),
            generateBtn: document.getElementById('assembly-generate-btn'),
            clearBtn: document.getElementById('assembly-clear-btn'),
            raritySelect: document.getElementById('budget-rarity-select'),

            // Dock / Catalog
            itemsContainer: document.getElementById('items-container'),
            categoryBtns: document.querySelectorAll('.category-btn'),
            subcategoryContainer: document.getElementById('subcategory-container'),
            subcategoryList: document.getElementById('subcategory-list'),
            abilitiesList: document.getElementById('abilities-list'),

            // Card Preview Inputs
            cardTitle: document.getElementById('card-main-title'),
            itemName: document.getElementById('assembly-item-name'),
            flavorText: document.getElementById('assembly-flavor-text'),
            card: document.getElementById('preview-card-frame')
        };
    }

    bindEvents() {
        this.cacheElements();

        // Dock Interaction
        this.elements.categoryBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.controller.onCategorySelect(e));
        });

        // Drag & Drop
        this.elements.itemsContainer?.addEventListener('dragstart', (e) => this.handleDragStart(e));

        const dropZone = this.elements.dropZone;
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Removal (Sockets)
        // Add click listeners to clear sockets
        ['base', 'element', 'rarity'].forEach(type => {
            const socket = this.elements[`socket${type.charAt(0).toUpperCase() + type.slice(1)}`];
            if (socket) {
                socket.addEventListener('click', (e) => {
                    // Only clear if clicked remove button or similar interaction?
                    // Original code: Sockets themselves weren't clickable to clear, only ability list buttons.
                    // But let's support it or rely on Clear All.
                    // Original had 'click' -> remove? No.
                    // We'll stick to original behavior (Clear All button or Ability List removals).
                });
            }
        });

        // Controls
        this.elements.clearBtn?.addEventListener('click', () => this.controller.onClear());
        this.elements.generateBtn?.addEventListener('click', () => this.controller.onGenerate());
        this.elements.raritySelect?.addEventListener('change', (e) => this.controller.onRarityChange(e.target.value));

        // Inputs
        this.elements.itemName?.addEventListener('input', () => this.controller.onInputChanged());
        this.elements.flavorText?.addEventListener('input', () => this.controller.onInputChanged());
    }

    renderSubcategories(categories, activeSub) {
        if (!this.elements.subcategoryList) return;

        this.elements.subcategoryList.innerHTML = categories.map(sub => `
            <button class="subcategory-btn ${sub.id === activeSub ? 'active' : ''}" 
                    data-id="${sub.id}">
                ${sub.name}
            </button>
        `).join('');

        // Bind clicks
        this.elements.subcategoryList.querySelectorAll('.subcategory-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.controller.onSubcategorySelect(e.target.dataset.id));
        });
    }

    renderDock(tokens) {
        if (!this.elements.itemsContainer) return;
        this.elements.itemsContainer.innerHTML = tokens.map(token => `
            <div class="dock-token" draggable="true" 
                 data-token-id="${token.id}" 
                 data-token-type="${token.type}" 
                 data-token-category="${token.category}"
                 data-cost="${token.cost}">
                <div class="token-icon">${token.icon}</div>
                <div class="token-label">${token.name}</div>
                <div class="token-cost">${token.cost > 0 ? '+' + token.cost : 'Free'}</div>
            </div>
        `).join('');
    }

    // ==========================================
    // UI UPDATES
    // ==========================================

    updateBudget(totalCost, maxBudget, breakdown) {
        const percent = Math.min(100, (totalCost / maxBudget) * 100);

        // Sidebar bars
        if (this.elements.powerFill) {
            this.elements.powerFill.style.width = `${percent}%`;
            this.elements.powerFill.classList.remove('warning', 'danger');
            if (totalCost > maxBudget) this.elements.powerFill.classList.add('danger');
            else if (percent >= 80) this.elements.powerFill.classList.add('warning');
        }
        if (this.elements.powerText) {
            this.elements.powerText.textContent = `${totalCost}/${maxBudget}`;
        }

        // Console bars
        if (this.elements.budgetCurrent) this.elements.budgetCurrent.textContent = totalCost;
        if (this.elements.budgetMax) this.elements.budgetMax.textContent = maxBudget;
        if (this.elements.budgetFilled) {
            this.elements.budgetFilled.style.width = `${percent}%`;
            this.elements.budgetFilled.classList.toggle('over-budget', totalCost > maxBudget);
        }

        // Breakdown
        if (this.elements.powerBreakdown) {
            this.elements.powerBreakdown.innerHTML = breakdown.map(item => `
                <div class="power-breakdown-item">
                    <span>${item.name}</span>
                    <span>+${item.cost}</span>
                </div>
            `).join('');
        }

        // Token affordability
        const remaining = maxBudget - totalCost;
        this.elements.itemsContainer?.querySelectorAll('.dock-token').forEach(token => {
            const cost = parseInt(token.dataset.cost) || 0;
            const canAfford = cost <= remaining;
            token.classList.toggle('invalid', !canAfford && cost > 0);
        });
    }

    updateSockets(build) {
        this._updateSingleSocket('base', build.base);
        this._updateSingleSocket('element', build.element || build.damageDice);
        this._updateSingleSocket('rarity', build.rarity);
        this._updateAbilitiesList(build.abilities);
    }

    _updateSingleSocket(type, item) {
        const socketId = `socket${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const socket = this.elements[socketId];
        if (!socket) return;

        const placeholder = socket.querySelector('.socket-placeholder');
        const filled = socket.querySelector('.socket-filled');

        if (!item) {
            socket.classList.remove('filled');
            if (placeholder) placeholder.classList.remove('hidden');
            if (filled) {
                filled.classList.add('hidden');
                filled.innerHTML = '';
            }
        } else {
            socket.classList.add('filled');
            if (placeholder) placeholder.classList.add('hidden');
            if (filled) {
                filled.classList.remove('hidden');
                filled.innerHTML = `<span class="socket-icon">${item.icon}</span><span class="socket-label">${item.name}</span>`;
            }
        }
    }

    _updateAbilitiesList(abilities) {
        if (!this.elements.abilitiesList || !this.elements.socketAbility) return;
        const socket = this.elements.socketAbility;
        const list = this.elements.abilitiesList;

        if (abilities.length === 0) {
            socket.classList.remove('filled');
            socket.querySelector('.socket-placeholder')?.classList.remove('hidden');
            socket.querySelector('.socket-filled')?.classList.add('hidden');
            list.innerHTML = '';
        } else {
            socket.classList.add('filled');
            socket.querySelector('.socket-placeholder')?.classList.add('hidden');
            socket.querySelector('.socket-filled')?.classList.remove('hidden');

            list.innerHTML = abilities.map((ability, index) => `
                <li class="ability-item">
                    <span class="ability-icon">${ability.icon}</span>
                    <span class="ability-name">${ability.name}</span>
                    <button class="ability-remove-btn" data-index="${index}">×</button>
                </li>
            `).join('');

            list.querySelectorAll('.ability-remove-btn').forEach(btn => {
                btn.addEventListener('click', () => this.controller.onRemoveAbility(parseInt(btn.dataset.index)));
            });
        }
    }

    updateStats(html) {
        if (this.elements.cardStats) {
            this.elements.cardStats.innerHTML = html;
        }
    }

    updateGenerateBtn(disabled) {
        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = disabled;
        }
    }

    updateCardPreview(title, rarityClass) {
        if (this.elements.cardTitle && title) this.elements.cardTitle.textContent = title;
        if (this.elements.card && rarityClass) this.elements.card.dataset.rarity = rarityClass;
    }

    // ==========================================
    // DRAG & DROP
    // ==========================================

    handleDragStart(e) {
        const token = e.target.closest('.dock-token');
        if (!token || token.classList.contains('invalid')) {
            e.preventDefault();
            return;
        }

        const data = {
            id: token.dataset.tokenId,
            type: token.dataset.tokenType,
            category: token.dataset.tokenCategory,
            cost: parseInt(token.dataset.cost),
            icon: token.querySelector('.token-icon')?.textContent,
            name: token.querySelector('.token-label')?.textContent
        };

        this.draggedToken = data;
        token.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(data));

        if (this.elements.dropZone) this.elements.dropZone.classList.add('highlight');
    }

    handleDragOver(e) {
        e.preventDefault();
        if (this.draggedToken) {
            this.elements.dropZone?.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'move';
        }
    }

    handleDragLeave(e) {
        this.elements.dropZone?.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.dropZone?.classList.remove('drag-over', 'highlight');

        const tokenToken = document.querySelector('.dragging');
        if (tokenToken) tokenToken.classList.remove('dragging');

        if (this.draggedToken) {
            this.controller.onDropToken(this.draggedToken);

            // Animation
            const dz = this.elements.dropZone;
            dz.classList.add('just-filled');
            setTimeout(() => dz.classList.remove('just-filled'), 500);

            this.draggedToken = null;
        }
    }
}
