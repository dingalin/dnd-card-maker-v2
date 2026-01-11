import { NavLink } from 'react-router-dom';
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
                <div className="mimic-maw-rail">
                    <img src={mouthImage} alt="Mimic Maw" className="mimic-maw-img" />
                </div>
            </div>
        </nav>
    );
}
