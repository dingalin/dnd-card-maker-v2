import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useCardContext } from '../../store';
import { useGemini } from '../../hooks/useGemini';
import { useImageGenerator } from '../../hooks/useImageGenerator';
import { useBackgroundGenerator } from '../../hooks/useBackgroundGenerator';
import { useWorkerPassword } from '../../hooks/useWorkerPassword';
import { generateMimicCard } from '../../utils/mimicGenerator';
import './NavigationRail.css';
import mouthImage from '../../assets/mouth.png';

interface NavItem {
    path: string;
    icon: string;
    label: string;
}

const navItems: NavItem[] = [
    { path: '/', icon: '📄', label: 'New Card' },
    { path: '/library', icon: '📚', label: 'Library' },
    { path: '/templates', icon: '📋', label: 'Templates' },
    { path: '/import', icon: '📥', label: 'Import' },
];

export default function NavigationRail() {
    const { setCardData, updateCustomStyle } = useCardContext();
    const [clickCount, setClickCount] = useState(0);

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
    );
}
