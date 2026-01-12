/**
 * AiContextManager
 * Service responsible for the "Lore-Keeper" engine (RAG).
 * 
 * It manages the "World Document" (context) and "Campaign Facts".
 * When an AI request involves story generation (Lore, Descriptions, Monsters),
 * this manager injects the relevant context into the prompt.
 */
export class AiContextManager {
    private static instance: AiContextManager;
    private worldContext: string = '';
    private campaignFacts: string[] = [];

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): AiContextManager {
        if (!AiContextManager.instance) {
            AiContextManager.instance = new AiContextManager();
        }
        return AiContextManager.instance;
    }

    /**
     * Set the global "World Document" for the current campaign.
     * This is the high-level truth (e.g., "Magic is illegal", "The moon is broken").
     */
    public setWorldDocument(doc: string): void {
        this.worldContext = doc;
    }

    /**
     * Add a specific fact validation to the session.
     */
    public addFact(fact: string): void {
        this.campaignFacts.push(fact);
    }

    public clearFacts(): void {
        this.campaignFacts = [];
    }

    /**
     * Returns the formatted string to prepend to LLM prompts.
     * Wraps context in distinct XML-like tags to help the model differentiate
     * between instructions and world info.
     */
    public getPromptPrefix(): string {
        if (!this.worldContext && this.campaignFacts.length === 0) {
            return '';
        }

        const parts = [];

        if (this.worldContext) {
            parts.push(`<WORLD_CONTEXT>\n${this.worldContext}\n</WORLD_CONTEXT>`);
        }

        if (this.campaignFacts.length > 0) {
            parts.push(`<KNOWN_FACTS>\n${this.campaignFacts.map(f => `- ${f}`).join('\n')}\n</KNOWN_FACTS>`);
        }

        return parts.join('\n\n') + '\n\nIMPORTANT: The generated content MUST adhere to the WORLD_CONTEXT and KNOWN_FACTS provided above.\n\n';
    }

    /**
     * Helper to immediately contextualize a user prompt.
     */
    public enhancePrompt(userPrompt: string): string {
        return this.getPromptPrefix() + userPrompt;
    }
}
