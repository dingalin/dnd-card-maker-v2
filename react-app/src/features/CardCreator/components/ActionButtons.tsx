import React from 'react';
import './ItemCreationForm.css';

interface ActionButtonsProps {
    onCreate: () => void;
    onGenerateImage: () => void;
    onGenerateWithAI: () => void;
    onGenerateBackground: () => void;
    isGeneratingImage: boolean;
    isGeneratingAI: boolean;
    isGeneratingBg: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onCreate,
    onGenerateImage,
    onGenerateWithAI,
    onGenerateBackground,
    isGeneratingImage,
    isGeneratingAI,
    isGeneratingBg
}) => {
    return (
        <div className="sticky-buttons">
            {/* Vertical stack of 3 silver buttons on the left */}
            <div className="button-stack-vertical">
                <button
                    onClick={onGenerateWithAI}
                    className="btn-metallic btn-silver"
                    disabled={isGeneratingAI}
                >
                    {isGeneratingAI ? '...' : 'AI'}
                </button>
                <button
                    onClick={onGenerateImage}
                    className="btn-metallic btn-silver"
                    disabled={isGeneratingImage}
                >
                    {isGeneratingImage ? '...' : 'IMG'}
                </button>
                <button
                    onClick={onGenerateBackground}
                    className="btn-metallic btn-silver"
                    disabled={isGeneratingBg}
                >
                    {isGeneratingBg ? '...' : 'BG'}
                </button>
            </div>
            {/* CREATE CARD button on the right */}
            <button onClick={onCreate} className="btn-metallic btn-gold">
                CREATE CARD
            </button>
        </div>
    );
};
