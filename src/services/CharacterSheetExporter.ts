// @ts-nocheck
import html2canvas from 'html2canvas';

/**
 * CharacterSheetExporter - Exports character sheet to A4 PNG for printing
 */
export class CharacterSheetExporter {
    // A4 dimensions at 300 DPI
    static readonly A4_WIDTH = 2480;
    static readonly A4_HEIGHT = 3508;

    /**
     * Export the equipment grid section as A4 PNG
     */
    static async exportEquipmentSheet(): Promise<void> {
        const equipmentGrid = document.querySelector('.equipment-grid') as HTMLElement;
        if (!equipmentGrid) {
            console.error('Equipment grid not found');
            return;
        }

        // Hide UI elements during capture
        const actionButtons = document.querySelectorAll('.slot-actions, .auto-gen-btn');
        actionButtons.forEach(el => (el as HTMLElement).style.visibility = 'hidden');

        try {
            // Capture the equipment grid
            const canvas = await html2canvas(equipmentGrid, {
                scale: 3, // High resolution
                useCORS: true,
                allowTaint: true,
                backgroundColor: null, // Transparent background
                logging: false
            });

            // Create A4-sized canvas
            const a4Canvas = document.createElement('canvas');
            a4Canvas.width = this.A4_WIDTH;
            a4Canvas.height = this.A4_HEIGHT;
            const ctx = a4Canvas.getContext('2d');

            if (!ctx) {
                console.error('Could not get canvas context');
                return;
            }

            // Fill with white background (for printing)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, a4Canvas.width, a4Canvas.height);

            // Calculate scaling to fit captured content in A4 with margins
            const margin = 100; // pixels margin
            const maxWidth = a4Canvas.width - (margin * 2);
            const maxHeight = a4Canvas.height - (margin * 2);

            const scale = Math.min(
                maxWidth / canvas.width,
                maxHeight / canvas.height
            );

            const scaledWidth = canvas.width * scale;
            const scaledHeight = canvas.height * scale;

            // Center the image
            const x = (a4Canvas.width - scaledWidth) / 2;
            const y = (a4Canvas.height - scaledHeight) / 2;

            // Draw the captured content onto A4 canvas
            ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

            // Download as PNG
            const link = document.createElement('a');
            link.download = `character_sheet_${Date.now()}.png`;
            link.href = a4Canvas.toDataURL('image/png', 1.0);
            link.click();

            console.log('✅ Character sheet exported successfully');

        } catch (error) {
            console.error('Failed to export character sheet:', error);
            throw error;
        } finally {
            // Restore hidden elements
            actionButtons.forEach(el => (el as HTMLElement).style.visibility = '');
        }
    }

    /**
     * Export the full character sheet (equipment + backpack) as A4 PNG
     */
    static async exportFullSheet(): Promise<void> {
        const sheetContainer = document.querySelector('.character-sheet-v2') as HTMLElement;
        if (!sheetContainer) {
            console.error('Character sheet not found');
            return;
        }

        // Hide UI elements during capture
        const actionButtons = document.querySelectorAll('.slot-actions, .auto-gen-btn, .backpack-header');
        actionButtons.forEach(el => (el as HTMLElement).style.visibility = 'hidden');

        try {
            // Capture the full sheet
            const canvas = await html2canvas(sheetContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
            });

            // Create A4-sized canvas
            const a4Canvas = document.createElement('canvas');
            a4Canvas.width = this.A4_WIDTH;
            a4Canvas.height = this.A4_HEIGHT;
            const ctx = a4Canvas.getContext('2d');

            if (!ctx) {
                console.error('Could not get canvas context');
                return;
            }

            // Fill with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, a4Canvas.width, a4Canvas.height);

            // Calculate scaling
            const margin = 80;
            const maxWidth = a4Canvas.width - (margin * 2);
            const maxHeight = a4Canvas.height - (margin * 2);

            const scale = Math.min(
                maxWidth / canvas.width,
                maxHeight / canvas.height
            );

            const scaledWidth = canvas.width * scale;
            const scaledHeight = canvas.height * scale;
            const x = (a4Canvas.width - scaledWidth) / 2;
            const y = (a4Canvas.height - scaledHeight) / 2;

            ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

            // Download
            const link = document.createElement('a');
            link.download = `character_sheet_full_${Date.now()}.png`;
            link.href = a4Canvas.toDataURL('image/png', 1.0);
            link.click();

            console.log('✅ Full character sheet exported successfully');

        } catch (error) {
            console.error('Failed to export full sheet:', error);
            throw error;
        } finally {
            actionButtons.forEach(el => (el as HTMLElement).style.visibility = '');
        }
    }
}
