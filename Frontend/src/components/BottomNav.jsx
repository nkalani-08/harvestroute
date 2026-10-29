
import { useLang } from '../context/LangContext';
import './BottomNav.css';

export default function BottomNav({ active, onNavigate }) {
  const { tr } = useLang();

  const tabs = [
    { key: 'home', label: tr('navHome'), icon: '🏠' },
    { key: 'glut', label: tr('navGlutRadar'), icon: '📡' },
    { key: 'options', label: tr('navMyOptions'), icon: '📋' },
    { key: 'ai', label: 'AI Assistant', icon: '🤖' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`nav-tab ${
            active === tab.key ? 'nav-tab--active' : ''
          }`}
          onClick={() => onNavigate(tab.key)}
        >
          <span className="nav-tab__icon">{tab.icon}</span>
          <span className="nav-tab__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
