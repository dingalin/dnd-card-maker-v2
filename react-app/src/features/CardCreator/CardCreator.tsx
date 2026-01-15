import { useState, useRef, useCallback } from 'react';
import { useCardContext } from '../../store';
import ItemCreationForm from './components/ItemCreationForm';
import CardCanvas from '../../components/Canvas/CardCanvas';
import CardLibrary from '../../components/Modals/CardLibrary';
import './CardCreator.css';

// Assets

function CardCreator() {
    const { state, setFlipped } = useCardContext();
    const [isCardLibraryOpen, setIsCardLibraryOpen] = useState(false);
    // Updated Ref type to include deselect
    const cardCanvasRef = useRef<{ captureImage: () => string | null; deselect: () => void }>(null);

    // Callback to capture thumbnails for saving
    const handleCaptureThumbnail = useCallback(async (): Promise<{ front: string; back: string } | null> => {
        if (!cardCanvasRef.current) return null;

        try {
            // Deselect any active element before capturing
            if (cardCanvasRef.current.deselect) {
                cardCanvasRef.current.deselect();
            }

            // Capture front
            setFlipped(false);
            await new Promise(r => setTimeout(r, 100)); // Wait for render
            const front = cardCanvasRef.current.captureImage();

            // Capture back
            setFlipped(true);
            await new Promise(r => setTimeout(r, 100));
            const back = cardCanvasRef.current.captureImage();

            // Reset to front
            setFlipped(false);

            return {
                front: front || '',
                back: back || ''
            };
        } catch (e) {
            console.error('Failed to capture thumbnails', e);
            return null;
        }
    }, [setFlipped]);

    return (
        <div className="card-creator">
            <div className="creator-layout">
                {/* Right Sidebar - Item Creation */}
                <aside className="sidebar sidebar-start">
                    <ItemCreationForm onOpenStyles={() => setIsCardLibraryOpen(true)} />
                </aside>

                {/* Center - Card Preview */}
                <main className="preview-area">

                    <div className="card-preview">

                        <CardCanvas ref={cardCanvasRef} />

                        {/* Debug info */}
                        {state.cardData && (
                            <div className="debug-info">
                                <small>{state.cardData.front?.title || state.cardData.name}</small>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Card Library Modal */}
            <CardLibrary
                isOpen={isCardLibraryOpen}
                onClose={() => setIsCardLibraryOpen(false)}
                onCaptureThumbnail={handleCaptureThumbnail}
            />
        </div>
    );
}

export default CardCreator;
