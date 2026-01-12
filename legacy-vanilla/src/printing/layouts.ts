/**
 * Print Layout Definitions
 * 
 * Defines how cards are arranged on physical paper.
 * Bridges the gap between digital assets and "Physical Beauty".
 */

export interface PageSize {
    widthMm: number;
    heightMm: number;
    name: 'A4' | 'Letter' | 'Legal' | 'Custom';
}

export interface CardDimensions {
    widthMm: number;
    heightMm: number;
}

export interface PrintLayout {
    id: string;
    name: string;
    description: string;

    pageSize: PageSize;
    cardSize: CardDimensions;

    // Grid configuration
    cardsPerPage: {
        rows: number;
        cols: number;
    };

    // Spacing and Marks
    gutterMm: number;       // Space between cards
    marginMm: { top: number; left: number }; // Starting offset

    options: {
        showCutMarks: boolean;
        showFoldLines: boolean; // For double-sided folding
        doubleSided: boolean;   // If true, generates page 2 (backs) mirrored
    };
}

export const PAPER_SIZES: Record<string, PageSize> = {
    A4: { widthMm: 210, heightMm: 297, name: 'A4' },
    LETTER: { widthMm: 215.9, heightMm: 279.4, name: 'Letter' }
};

export const PRINT_LAYOUT_PRESETS: PrintLayout[] = [
    {
        id: 'standard-poker-a4',
        name: 'Standard Poker Cards (A4)',
        description: '9 cards per sheet (3x3). Standard 63x88mm size. Best for sleeves.',
        pageSize: PAPER_SIZES.A4,
        cardSize: { widthMm: 63, heightMm: 88 },
        cardsPerPage: { rows: 3, cols: 3 },
        gutterMm: 0, // No gap for easy single-cut
        marginMm: { top: 15, left: 10 },
        options: { showCutMarks: true, showFoldLines: false, doubleSided: true }
    },
    {
        id: 'mini-cards-a4',
        name: 'Mini Item Cards (A4)',
        description: '16 cards per sheet (4x4). Compact 44x63mm size.',
        pageSize: PAPER_SIZES.A4,
        cardSize: { widthMm: 44, heightMm: 63 },
        cardsPerPage: { rows: 4, cols: 4 },
        gutterMm: 0,
        marginMm: { top: 10, left: 15 },
        options: { showCutMarks: true, showFoldLines: false, doubleSided: true }
    },
    {
        id: 'token-stickers-25mm',
        name: 'Round Tokens 1" (A4)',
        description: 'For 1-inch epoxy stickers or wooden discs.',
        pageSize: PAPER_SIZES.A4,
        cardSize: { widthMm: 25.4, heightMm: 25.4 }, // 1 inch
        cardsPerPage: { rows: 9, cols: 7 },
        gutterMm: 2, // Space needed for circular bleed
        marginMm: { top: 10, left: 10 },
        options: { showCutMarks: true, showFoldLines: false, doubleSided: false }
    }
];
