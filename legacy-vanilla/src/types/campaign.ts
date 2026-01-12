import { ThemePack } from './theme';

/**
 * Campaign Definition
 * 
 * A Campaign is a top-level container for a DM's project.
 * It holds the "Context" (Lore) and the "Style" (Theme) for a group of entities.
 */
export interface Campaign {
    id: string; // UUID
    name: string;
    description: string;

    // The "Lore-Keeper" link
    worldDocumentStr?: string; // The raw text for the AI context

    // The "Dynamic Theme" link
    themePackId: string;

    // Metadata
    createdAt: number;
    updatedAt: number;

    // Future: List of entity IDs belonging to this campaign
    // entityIds: string[]; 
}

export const LOW_FANTASY_PRESET: Partial<Campaign> = {
    name: "Low Fantasy Starter",
    description: "A gritty world with rare magic.",
    themePackId: "iron-gritty"
};
