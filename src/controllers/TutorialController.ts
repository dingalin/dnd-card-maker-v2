// @ts-nocheck
/**
 * TutorialController - Guides users through the existing UI
 * Highlights sections, dims others, shows tooltips with instructions
 */

interface TutorialStep {
    id: string;
    selector: string;
    title: string;
    description: string;
    phase: 'creation' | 'editing';
    waitForAction?: boolean;  // Wait for user to interact before allowing "next"
    actionEvent?: string;     // Event to listen for (e.g., 'change', 'click')
    autoAdvance?: boolean;    // Automatically go to next step when action completes
}

const TUTORIAL_STEPS: TutorialStep[] = [
    // Phase 1: Card Creation
    {
        id: 'card-background',
        selector: '.stone-btn[data-target="card-background"]', // Located in sidebar-end (Edit sidebar)
        title: 'רקע הקלף',
        description: 'מומלץ להתחיל מכאן! בחר רקע לקלף שלך.\n💡 אם אפשרות "הקשר ויזואלי" מסומנת, ה-AI יושפע מהרקע שבחרת ויצור חפץ שתואם לאווירה שלו!',
        phase: 'creation',
        waitForAction: false
    },
    {
        id: 'type',
        selector: '#item-type',
        title: 'סוג חפץ',
        description: 'בחר את סוג החפץ שתרצה ליצור - נשק, שריון, חפץ פלא, או אחר.',
        phase: 'creation',
        waitForAction: true,
        actionEvent: 'change',
        autoAdvance: true
    },
    {
        id: 'subtype',
        selector: '#item-subtype',
        title: 'חפץ ספציפי',
        description: 'בחר את החפץ הספציפי מהרשימה. זה ישפיע על הנזק/הגנה הבסיסיים.',
        phase: 'creation',
        waitForAction: false
    },
    {
        id: 'level',
        selector: '#item-level',
        title: 'רמת הכוח',
        description: 'בחר את רמת הכוח של החפץ. רמה גבוהה יותר = יכולות חזקות יותר.',
        phase: 'creation',
        waitForAction: false
    },

    {
        id: 'ability',
        selector: '#item-ability',
        title: 'נושא או יכולת (אופציונלי)',
        description: 'שלב אופציונלי: תאר נושא או יכולת מיוחדת לחפץ (למשל: "אש", "ריפוי", "היעלמות"). אם תדלג, ה-AI יבחר נושא מתאים בעצמו.',
        phase: 'creation',
        waitForAction: false
    },
    {
        id: 'background',
        selector: '#visuals-content',
        title: 'סגנון ומראה',
        description: 'כאן תוכל לבחור את סגנון הציור (ריאליסטי, ציור שמן, וכו\') ואפילו לבחור מודל AI ספציפי ליצירת התמונה.',
        phase: 'creation',
        waitForAction: false
    },
    {
        id: 'generate',
        selector: '.action-buttons-container',
        title: 'בחר מצב יצירה',
        description: 'בחר איך ליצור את הקלף:\n\n🎨 **יצירתי** - חפץ עם יכולות מורכבות ומעניינות (מומלץ!)\n📝 **פשוט** - חפץ עם בונוסים בסיסיים (+1, +2)\n🎲 **הפתע אותי** - ה-AI יבחר באופן אקראי את כל הפרמטרים ויפתיע אותך!',
        phase: 'creation',
        waitForAction: true,
        actionEvent: 'click',
        autoAdvance: true
    },

    // Phase 2: Card Editing
    {
        id: 'content',
        selector: '[data-content="content-editor"]',
        title: 'עריכת תוכן',
        description: 'כאן תוכל לערוך את שם החפץ, התיאור, היכולות והמכניקה. לחץ על הסקשנים לפתיחתם.',
        phase: 'editing',
        waitForAction: false
    },
    {
        id: 'design',
        selector: '[data-content="text-design"]',
        title: 'עיצוב טקסט',
        description: 'שנה גופנים, גדלים, צבעים וסגנונות של הטקסטים בקלף.',
        phase: 'editing',
        waitForAction: false
    },
    {
        id: 'image',
        selector: '[data-content="image-tuning"]',
        title: 'כיוונון תמונה',
        description: 'התאם את מיקום, גודל וזום התמונה. השתמש בסליידרים לכיוונון מדויק.',
        phase: 'editing',
        waitForAction: false
    },
    {
        id: 'background',
        selector: '[data-content="card-background"]',
        title: 'רקע הקלף',
        description: 'בחר רקע מוכן או צור רקע חדש עם AI. הרקע משפיע על האווירה של הקלף.',
        phase: 'editing',
        waitForAction: false
    },
    {
        id: 'save',
        selector: '#save-to-gallery-btn',
        title: 'שמירה לגלריה!',
        description: 'מרוצה מהקלף? לחץ כאן לשמירה לגלריה. משם תוכל להדפיס או לייצא.',
        phase: 'editing',
        waitForAction: false
    }
];

export class TutorialController {
    private active: boolean = false;
    private currentStepIndex: number = 0;
    private tooltipElement: HTMLElement | null = null;
    private highlightedElement: HTMLElement | null = null;
    private actionListener: (() => void) | null = null;
    private waitingForGeneration: boolean = false;
    private isTransitioning: boolean = false;

    constructor() {
        // Create tooltip element
        this.createTooltipElement();
    }

    /**
     * Initialize the controller
     */
    init() {
        console.log('TutorialController: Initialized');

        // Listen for card generation complete to continue tutorial
        document.addEventListener('cardGenerated', () => {
            if (this.active && this.waitingForGeneration) {
                this.waitingForGeneration = false;
                this.next();
            }
        });
    }

    /**
     * Create the tooltip DOM element
     */
    private createTooltipElement() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.id = 'tutorial-tooltip';
        tooltip.style.display = 'none';
        tooltip.innerHTML = `
            <div class="tutorial-tooltip-header">
                <span class="tutorial-step-badge">1</span>
                <h3 class="tutorial-tooltip-title"></h3>
            </div>
            <div class="tutorial-progress"></div>
            <p class="tutorial-tooltip-content"></p>
            <div class="tutorial-waiting" style="display: none;">
                <span class="tutorial-waiting-icon">⏳</span>
                <span>ממתין לפעולה שלך...</span>
            </div>
            <div class="tutorial-tooltip-actions">
                <button class="tutorial-btn tutorial-btn-skip" id="tutorial-skip">דלג על ההדרכה</button>
                <div>
                    <button class="tutorial-btn tutorial-btn-secondary" id="tutorial-prev" style="display: none;">← הקודם</button>
                    <button class="tutorial-btn tutorial-btn-primary" id="tutorial-next">הבא →</button>
                </div>
            </div>
            <div class="tutorial-phase-indicator"></div>
        `;
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;

        // Setup button handlers
        tooltip.querySelector('#tutorial-next')?.addEventListener('click', () => this.next());
        tooltip.querySelector('#tutorial-prev')?.addEventListener('click', () => this.prev());
        tooltip.querySelector('#tutorial-skip')?.addEventListener('click', () => this.end());
    }

    /**
     * Start the tutorial
     */
    start() {
        if (this.active) return;

        this.active = true;
        this.currentStepIndex = 0;
        document.body.classList.add('tutorial-active');

        // Clear the current card for a fresh start
        this.clearCardForTutorial();

        console.log('TutorialController: Started');
        this.showStep(0);
    }

    /**
     * Clear the card for a fresh tutorial start
     */
    private clearCardForTutorial() {
        // Use stateManager to clear the card completely
        const stateManager = (window as any).stateManager;

        // First, clear using the built-in method
        if (stateManager?.clearCurrentCard) {
            stateManager.clearCurrentCard();
        }

        // Then set empty data with all fields cleared
        if (stateManager?.setCardData) {
            stateManager.setCardData({
                name: '',
                typeHe: '',
                rarityHe: '',
                quickStats: '',
                abilityName: '',
                abilityDesc: '',
                description: '',
                gold: '',
                itemImage: null,
                imageUrl: null,
                front: {
                    title: '',
                    type: '',
                    rarity: '',
                    quickStats: '',
                    imageUrl: null,
                    gold: '',
                    badges: []
                },
                back: {
                    title: '',
                    mechanics: '',
                    lore: ''
                }
            });
        }

        // Force re-render with empty state
        setTimeout(() => {
            const renderController = (window as any).renderController;
            if (renderController?.render) {
                renderController.render(stateManager?.getState?.() || {});
            }
        }, 50);

        // Reset form fields
        const itemType = document.getElementById('item-type') as HTMLSelectElement;
        const itemSubtype = document.getElementById('item-subtype') as HTMLSelectElement;
        const itemLevel = document.getElementById('item-level') as HTMLSelectElement;
        const itemAbility = document.getElementById('item-ability') as HTMLInputElement;

        if (itemType) {
            itemType.selectedIndex = -1; // Force user to make a selection to trigger 'change'
            // No need to dispatch change here, user interaction will do it
        }
        if (itemSubtype) itemSubtype.innerHTML = '<option value="">-- בחר חפץ --</option>';
        if (itemLevel) itemLevel.selectedIndex = 2; // Default to 5-10
        if (itemAbility) itemAbility.value = '';

        // Reset rarity buttons
        document.querySelectorAll('.rarity-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Clear any text inputs in the editor
        document.querySelectorAll('#content-editor input, #content-editor textarea').forEach((el) => {
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.value = '';
            }
        });

        console.log('TutorialController: Card cleared for fresh start');
    }

    /**
     * End the tutorial
     */
    end() {
        this.active = false;
        document.body.classList.remove('tutorial-active');

        // Remove highlight
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('tutorial-highlight');
            this.highlightedElement = null;
        }

        // Clear exposed elements
        this.clearExposedElements();

        // Hide tooltip
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }

        // Remove action listener
        this.removeActionListener();

        console.log('TutorialController: Ended');

        // Show completion message
        const showToast = (window as any).globalUI?.showToast || ((msg: string) => alert(msg));
        showToast('🎉 סיימת את ההדרכה! עכשיו אתה מוכן ליצור קלפים מדהימים!', 'success');
    }

    /**
     * Go to next step
     */
    next() {
        if (this.isTransitioning) return;

        const currentStep = TUTORIAL_STEPS[this.currentStepIndex];

        // If waiting for action and action not completed, don't proceed
        if (currentStep.waitForAction && !this.actionCompleted(currentStep)) {
            return;
        }

        this.isTransitioning = true;

        // If this is the generation step, END the tutorial immediately
        if (currentStep.id === 'generate') {
            this.end();
            this.isTransitioning = false;
            return;
        }

        // Move to next step immediately (removed waiting for card generation)
        if (this.currentStepIndex < TUTORIAL_STEPS.length - 1) {
            this.currentStepIndex++;
            this.showStep(this.currentStepIndex);
        } else {
            this.end();
        }

        // Release lock after transition
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    /**
     * Go to previous step
     */
    prev() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.showStep(this.currentStepIndex);
        }
    }

    /**
     * Show a specific step
     */
    private showStep(index: number) {
        const step = TUTORIAL_STEPS[index];
        if (!step) return;

        // Ensure the section containing the element is visible
        this.ensureSectionVisible(step.selector);

        // Small delay to allow UI to update (section expansion)
        setTimeout(() => {
            // Remove previous highlight
            if (this.highlightedElement) {
                this.highlightedElement.classList.remove('tutorial-highlight');
            }
            this.removeActionListener();

            // Find and highlight element
            const element = document.querySelector(step.selector) as HTMLElement;
            if (!element) {
                console.warn(`TutorialController: Element not found for step ${step.id}:`, step.selector);
                // Try to find parent section
                const parentSection = this.findParentSection(step.selector);
                if (parentSection) {
                    this.highlightElement(parentSection, step, index);
                }
                return;
            }

            this.highlightElement(element, step, index);
        }, 100);
    }

    /**
     * Ensure the section containing the selector is visible
     */
    private ensureSectionVisible(selector: string) {
        // Logic to find if the element is inside a hidden section
        // We look for .scroll-section.hidden containing the selector
        // OR simply find the section by ID if we can infer it.

        // 1. First trying to find the element directly
        let element = document.querySelector(selector);

        // 2. If element exists, check if IT or its parents are hidden sections
        if (element) {
            let current = element as HTMLElement;
            while (current && current !== document.body) {
                if (current.classList.contains('scroll-section') && current.classList.contains('hidden')) {
                    // Found a hidden section (could be the element itself or a parent)
                    const sectionId = current.id;
                    if (sectionId) {
                        this.toggleSection(sectionId);
                    }
                    break;
                }
                current = current.parentElement as HTMLElement;
            }
        } else {
            // Element might not be in DOM yet or selector is complex.
            // Try to guess section from selector if possible (fallback)
            // e.g. #item-type is in #type-content
            if (selector === '#item-type') this.toggleSection('type-content');
            if (selector === '#item-level') this.toggleSection('level-content');
            if (selector === '#item-ability') this.toggleSection('ability-content');
            if (selector.includes('visual')) this.toggleSection('visuals-content');
        }

        // 3. Special case: If the selector is a button that targets a section, open that section!
        if (element && (element.classList.contains('stone-btn') || element.hasAttribute('data-target'))) {
            const targetId = element.getAttribute('data-target');
            if (targetId) {
                this.toggleSection(targetId);
            }
        }
    }

    /**
     * Force open a sidebar section by its ID
     */
    private toggleSection(sectionId: string) {
        // 1. Check if already visible
        const section = document.getElementById(sectionId);
        if (section && !section.classList.contains('hidden')) {
            console.log(`Tutorial: Section ${sectionId} already visible`);
            return;
        }

        console.log(`Tutorial: Forcing open section ${sectionId}`);

        // 2. Try to find the button
        const btn = document.querySelector(`.stone-btn[data-target="${sectionId}"]`) ||
            document.querySelector(`button[data-target="${sectionId}"]`) as HTMLElement;

        // 3. Direct DOM manipulation (reliable fallback)
        if (section) {
            // Close other sections in the same container
            const parent = section.parentElement;
            if (parent) {
                parent.querySelectorAll('.scroll-section').forEach(s => s.classList.add('hidden'));
            }
            section.classList.remove('hidden');
            console.log(`Tutorial: Directly opened section ${sectionId}`);
        }

        // 4. Also click button to update button active states
        if (btn) {
            const container = btn.parentElement;
            if (container) {
                container.querySelectorAll('.stone-btn, button').forEach(b => b.classList.remove('active'));
            }
            btn.classList.add('active');

            // Also dispatch click for any listeners that need it
            setTimeout(() => btn.click(), 10);
        }
    }

    private exposedElements: HTMLElement[] = [];

    /**
     * Highlight an element and show tooltip
     */
    private highlightElement(element: HTMLElement, step: TutorialStep, index: number) {
        // Highlight the element
        element.classList.add('tutorial-highlight');
        this.highlightedElement = element;

        // Expose parent section header if applicable
        this.exposeParentSection(element);

        // Special: If highlighting a nav button, also expose its target section content
        if (element.classList.contains('stone-btn') || element.hasAttribute('data-target')) {
            const targetId = element.getAttribute('data-target');
            if (targetId) {
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('tutorial-section-elevated');
                    this.exposedElements.push(targetSection);
                    console.log(`Tutorial: Exposed section content ${targetId}`);
                }
            }
        }

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Update tooltip content
        this.updateTooltip(step, index);

        // Position tooltip
        this.positionTooltip(element);

        // Setup action listener if needed
        if (step.waitForAction && step.actionEvent) {
            this.setupActionListener(element, step);
        }
    }

    /**
     * Expose the parent section header (button) so it's not dimmed
     */
    private exposeParentSection(element: HTMLElement) {
        // Clean up previous exposed elements
        this.clearExposedElements();

        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (parent.classList.contains('scroll-section')) {
                const sectionId = parent.id;

                // 1. Elevate the section itself (JS-based fix for stacking context)
                parent.classList.add('tutorial-section-elevated');
                this.exposedElements.push(parent);

                // 2. Find corresponding buttons and expose them
                const btns = document.querySelectorAll(`[data-target="${sectionId}"]`);
                btns.forEach(btn => {
                    btn.classList.add('tutorial-exposed');
                    this.exposedElements.push(btn as HTMLElement);
                });
                break;
            }
            parent = parent.parentElement;
        }
    }

    private clearExposedElements() {
        this.exposedElements.forEach(el => {
            el.classList.remove('tutorial-exposed');
            el.classList.remove('tutorial-section-elevated');
        });
        this.exposedElements = [];
    }

    /**
     * Update tooltip content
     */
    private updateTooltip(step: TutorialStep, index: number) {
        if (!this.tooltipElement) return;

        const badge = this.tooltipElement.querySelector('.tutorial-step-badge');
        const title = this.tooltipElement.querySelector('.tutorial-tooltip-title');
        const content = this.tooltipElement.querySelector('.tutorial-tooltip-content');
        const progress = this.tooltipElement.querySelector('.tutorial-progress');
        const phaseIndicator = this.tooltipElement.querySelector('.tutorial-phase-indicator');
        const prevBtn = this.tooltipElement.querySelector('#tutorial-prev') as HTMLElement;
        const nextBtn = this.tooltipElement.querySelector('#tutorial-next') as HTMLElement;

        if (badge) badge.textContent = String(index + 1);
        if (title) title.textContent = step.title;
        if (content) content.textContent = step.description;

        // Update progress dots
        if (progress) {
            progress.innerHTML = TUTORIAL_STEPS.map((_, i) => `
                <div class="tutorial-progress-dot ${i < index ? 'completed' : ''} ${i === index ? 'current' : ''}"></div>
            `).join('');
        }

        // Update phase indicator
        if (phaseIndicator) {
            const creationSteps = TUTORIAL_STEPS.filter(s => s.phase === 'creation').length;
            if (step.phase === 'creation') {
                phaseIndicator.textContent = `שלב יצירה (${index + 1}/${creationSteps})`;
            } else {
                const editingIndex = index - creationSteps + 1;
                const editingSteps = TUTORIAL_STEPS.filter(s => s.phase === 'editing').length;
                phaseIndicator.textContent = `שלב עריכה (${editingIndex}/${editingSteps})`;
            }
        }

        // Show/hide prev button
        if (prevBtn) {
            prevBtn.style.display = index > 0 ? 'inline-block' : 'none';
        }

        // Update next button text
        if (nextBtn) {
            if (index === TUTORIAL_STEPS.length - 1) {
                nextBtn.textContent = 'סיום 🎉';
            } else if (step.waitForAction) {
                nextBtn.textContent = 'ממתין...';
                nextBtn.disabled = true;
            } else {
                nextBtn.textContent = 'הבא →';
                nextBtn.disabled = false;
            }
        }

        // Reset waiting state
        this.updateWaitingState(false);

        // Show tooltip
        this.tooltipElement.style.display = 'block';
    }

    /**
     * Position tooltip near the highlighted element
     */
    private positionTooltip(element: HTMLElement) {
        if (!this.tooltipElement) return;

        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        const padding = 20;

        // Remove all arrow classes
        this.tooltipElement.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');

        let top: number, left: number;
        let arrowClass = '';

        // Check if element is in a sidebar - if so, prefer side positioning
        const isSidebar = element.closest('.sidebar-start') || element.closest('.sidebar-end');

        // Logic for sidebar elements: always try to put to the side (Right for LTR/Left Sidebar)
        if (isSidebar) {
            if (rect.right + tooltipRect.width + padding < window.innerWidth) {
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + padding;
                arrowClass = 'arrow-left';
            } else if (rect.left - tooltipRect.width - padding > 0) {
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - padding;
                arrowClass = 'arrow-right';
            } else {
                // Fallback to vertical if no space on sides
                if (rect.bottom + tooltipRect.height + padding < window.innerHeight) {
                    top = rect.bottom + padding;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    arrowClass = 'arrow-top';
                } else {
                    top = rect.top - tooltipRect.height - padding;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    arrowClass = 'arrow-bottom';
                }
            }
        }
        // Default logic (Vertical first)
        else {
            // Try to position below
            if (rect.bottom + tooltipRect.height + padding < window.innerHeight) {
                top = rect.bottom + padding;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                arrowClass = 'arrow-top';
            }
            // Try to position above
            else if (rect.top - tooltipRect.height - padding > 0) {
                top = rect.top - tooltipRect.height - padding;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                arrowClass = 'arrow-bottom';
            }
            // Position to the left (for RTL)
            else if (rect.left - tooltipRect.width - padding > 0) {
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - padding;
                arrowClass = 'arrow-right';
            }
            // Position to the right
            else {
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + padding;
                arrowClass = 'arrow-left';
            }
        }

        // Keep within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.classList.add(arrowClass);
    }

    /**
     * Setup listener for user action
     */
    private setupActionListener(element: HTMLElement, step: TutorialStep) {
        const handler = () => {
            // Enable next button
            const nextBtn = this.tooltipElement?.querySelector('#tutorial-next') as HTMLButtonElement;
            if (nextBtn) {
                nextBtn.textContent = 'הבא →';
                nextBtn.disabled = false;
            }
            this.updateWaitingState(false);

            // Auto-advance if configured
            if (step.autoAdvance) {
                setTimeout(() => {
                    this.next();
                }, 300); // Small delay for UI updates
            }
        };

        if (step.actionEvent === 'change') {
            element.addEventListener('change', handler);
        } else if (step.actionEvent === 'click') {
            // For click, listen on children buttons
            const buttons = element.querySelectorAll('button');
            buttons.forEach(btn => btn.addEventListener('click', handler));
        }

        this.actionListener = () => {
            element.removeEventListener('change', handler);
            const buttons = element.querySelectorAll('button');
            buttons.forEach(btn => btn.removeEventListener('click', handler));
        };
    }

    /**
     * Remove action listener
     */
    private removeActionListener() {
        if (this.actionListener) {
            this.actionListener();
            this.actionListener = null;
        }
    }

    /**
     * Check if action was completed
     */
    private actionCompleted(step: TutorialStep): boolean {
        const nextBtn = this.tooltipElement?.querySelector('#tutorial-next') as HTMLButtonElement;
        return nextBtn && !nextBtn.disabled;
    }

    /**
     * Update waiting state UI
     */
    private updateWaitingState(waiting: boolean, message?: string) {
        const waitingEl = this.tooltipElement?.querySelector('.tutorial-waiting') as HTMLElement;
        if (waitingEl) {
            waitingEl.style.display = waiting ? 'flex' : 'none';
            if (message) {
                const textEl = waitingEl.querySelector('span:last-child');
                if (textEl) textEl.textContent = message;
            }
        }
    }

    /**
     * Find parent section for a selector
     */
    private findParentSection(selector: string): HTMLElement | null {
        // Try common parent patterns
        const patterns = [
            '.sidebar-section',
            '.glass-panel',
            '.form-group'
        ];

        for (const pattern of patterns) {
            const sections = document.querySelectorAll(pattern);
            for (const section of sections) {
                if (section.querySelector(selector)) {
                    return section as HTMLElement;
                }
            }
        }
        return null;
    }

    /**
     * Check if tutorial is active
     */
    isActive(): boolean {
        return this.active;
    }
}

export default TutorialController;
