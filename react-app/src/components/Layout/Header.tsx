import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCardContext } from '../../store';
import HistoryGallery from '../Modals/HistoryGallery';
import PrintModal from '../Modals/PrintModal';
import './Header.css';

import eyeImage from '../../assets/eye.png';

function Header() {
    const { i18n } = useTranslation();
    const { state } = useCardContext();
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);

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
                    <img src={eyeImage} alt="Mimic Eye" className="header-logo-img" />
                    <h1 className="header-title">
                        <span className="brand-name">MIMIC VAULT</span>
                        <span className="brand-separator">|</span>
                        <span className="brand-tagline">D&D ITEM CREATOR</span>
                    </h1>
                </div>
                <div className="header-actions">
                    <button onClick={() => setIsGalleryOpen(true)} className="header-btn" title="Gallery">
                        🖼️
                    </button>
                    <button
                        onClick={() => setIsPrintOpen(true)}
                        className="header-btn"
                        title="Print"
                        disabled={!state.cardData}
                    >
                        🖨️
                    </button>
                    <button onClick={toggleLanguage} className="header-btn lang-toggle">
                        {i18n.language === 'he' ? 'EN' : 'עב'}
                    </button>
                    <button className="header-btn-primary">
                        SAVE / EXPORT
                    </button>
                </div>
            </header>

            <HistoryGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
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
