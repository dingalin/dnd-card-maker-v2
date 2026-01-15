import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useCardContext } from '../../store';
import { useGemini } from '../../hooks/useGemini';
import { useImageGenerator } from '../../hooks/useImageGenerator';
import { useBackgroundGenerator } from '../../hooks/useBackgroundGenerator';
import { useWorkerPassword } from '../../hooks/useWorkerPassword';
import { generateMimicCard } from '../../utils/mimicGenerator';
import CardLibrary from '../Modals/CardLibrary';
import { NewCardIcon, TemplatesIcon, LibraryIcon } from '../Icons/NavigationIcons';
import './NavigationRail.css';
import mouthImage from '../../assets/mouth.png';

interface NavItem {
    path: string;
    icon: React.ReactNode;
    label: string;
}

const navItems: NavItem[] = [
    { path: '/', icon: <NewCardIcon />, label: 'New Card' },
    { path: '/templates', icon: <TemplatesIcon />, label: 'Templates' },
    // Removed Import as per visual reference preference (only 3 items shown)
];

export default function NavigationRail() {
    const { setCardData, updateCustomStyle } = useCardContext();
    const [clickCount, setClickCount] = useState(0);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // AI Hooks
    const { generateItem } = useGemini();
    const { generateImage } = useImageGenerator();
    const { generateBackground } = useBackgroundGenerator();
    const { password } = useWorkerPassword();

    const handleMouthClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount >= 10) {
            console.log('👹 MIMIC EASTER EGG TRIGGERED! (Mouth) - Generating Unique Card...');
            generateMimicCard(password, generateItem, generateImage, generateBackground, setCardData, updateCustomStyle);
            setClickCount(0);
        }
    };

    return (
        <>
            {/* SVG Gradients Definition */}
            <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
                <defs>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#BF953F" />
                        <stop offset="50%" stopColor="#FCF6BA" />
                        <stop offset="100%" stopColor="#AA771C" />
                    </linearGradient>
                    <linearGradient id="gold-gradient-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF7CC" />
                        <stop offset="50%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                </defs>
            </svg>

            <nav className="nav-rail">

                <div className="nav-rail-items">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-rail-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <span className="nav-rail-icon">{item.icon}</span>
                            <span className="nav-rail-label">{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Library Button - Opens Modal */}
                    <button
                        className="nav-rail-item library-btn"
                        onClick={() => setIsLibraryOpen(true)}
                    >
                        <span className="nav-rail-icon"><LibraryIcon /></span>
                        <span className="nav-rail-label">Library</span>
                    </button>
                </div>

                <div className="nav-rail-footer">
                    <button className="nav-rail-item settings-btn">
                        <span className="nav-rail-icon">⚙️</span>
                        <span className="nav-rail-label">Settings</span>
                    </button>
                    <div
                        className="mimic-maw-rail"
                        onClick={handleMouthClick}
                        style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                        title="Don't touch the teeth..."
                    >
                        <img src={mouthImage} alt="Mimic Maw" className="mimic-maw-img" />
                    </div>
                </div>
            </nav>

            {/* Card Library Modal */}
            <CardLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
            />
        </>
    );
}
