import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCardContext } from '../../store';
import { useGemini } from '../../hooks/useGemini';
import { useImageGenerator } from '../../hooks/useImageGenerator';
import { useBackgroundGenerator } from '../../hooks/useBackgroundGenerator';
import { useWorkerPassword } from '../../hooks/useWorkerPassword';
import { generateMimicCard } from '../../utils/mimicGenerator';
import HistoryGallery from '../Modals/HistoryGallery';
import PrintModal from '../Modals/PrintModal';
import AssetBrowser from '../Modals/AssetBrowser';
import './Header.css';

import eyeImage from '../../assets/eye.png';

function Header() {
    const { i18n } = useTranslation();
    const { state, setCardData, updateCustomStyle } = useCardContext();
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isAssetBrowserOpen, setIsAssetBrowserOpen] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    // AI Hooks
    const { generateItem } = useGemini();
    const { generateImage } = useImageGenerator();
    const { generateBackground } = useBackgroundGenerator();
    const { password } = useWorkerPassword();

    const handleEyeClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount >= 10) {
            console.log('👁️ MIMIC EASTER EGG TRIGGERED! (Eye) - Generating Unique Card...');
            generateMimicCard(password, generateItem, generateImage, generateBackground, setCardData, updateCustomStyle);
            setClickCount(0);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'he' ? 'en' : 'he';
        i18n.changeLanguage(newLang);
        document.documentElement.setAttribute('lang', newLang);
        document.documentElement.setAttribute('dir', newLang === 'he' ? 'rtl' : 'ltr');
    };

    return (
        <>
            <header className="app-header">
                <div className="header-brand">
                    <img
                        src={eyeImage}
                        alt="Mimic Eye"
                        className="header-logo-img"
                        onClick={handleEyeClick}
                        style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                        title="Is it watching me...?"
                    />
                    <h1 className="header-title">
                        <span className="brand-name">MIMIC VAULT</span>
                        <span className="brand-separator">|</span>
                        <span className="brand-tagline">D&D ITEM CREATOR</span>
                    </h1>
                </div>
                <div className="header-actions">
                    {/* Buttons removed as per user request: Gallery, Assets, Print */}
                    <button onClick={toggleLanguage} className="header-btn lang-toggle">
                        {i18n.language === 'he' ? 'EN' : 'עב'}
                    </button>
                </div>
            </header>

            <HistoryGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
            <AssetBrowser isOpen={isAssetBrowserOpen} onClose={() => setIsAssetBrowserOpen(false)} />
            <PrintModal
                isOpen={isPrintOpen}
                onClose={() => setIsPrintOpen(false)}
                cardData={state.cardData}
                settings={state.settings}
            />
        </>
    );
}

export default Header;
