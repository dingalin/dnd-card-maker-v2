export type EntityType = 'item' | 'spell' | 'monster' | 'npc' | 'prop' | 'document';

/**
 * Base interface for all major entities in the system.
 * This ensures that whether we are dealing with a Card (Item), a Monster, or a Prop,
 * they all share a common structure for ID, naming, and tracking.
 */
export interface BaseEntity {
    id: string; // UUID
    type: EntityType;
    name: string;

    // Metadata
    createdAt: number;
    updatedAt: number;

    // Future integrations
    campaignId?: string;       // Link to a specific campaign
    themePackId?: string;      // Specific theme override for this entity
    tags?: string[];           // For search and sorting in the Bazaar/Library
    isShared?: boolean;        // If true, this item is public in the Bazaar
}
