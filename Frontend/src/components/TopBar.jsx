import { useLang } from '../context/LangContext';
import './TopBar.css';

export default function TopBar({ title, onBack }) {
  const { lang, toggle, tr } = useLang();

  return (
    <header className="topbar">
      <div className="topbar__left">
        {onBack ? (
          <button className="topbar__back" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 16L6.5 10L12.5 4" stroke="#2d6a2d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{tr('back')}</span>
          </button>
        ) : (
          <span className="topbar__brand">{tr('appName')}</span>
        )}
        {title && <span className="topbar__title">{title}</span>}
      </div>
      <div className="topbar__lang">
        <button
          className={`lang-btn ${lang === 'hi' ? 'lang-btn--active' : ''}`}
          onClick={() => lang !== 'hi' && toggle()}
        >हिं</button>
        <button
          className={`lang-btn ${lang === 'en' ? 'lang-btn--active' : ''}`}
          onClick={() => lang !== 'en' && toggle()}
        >EN</button>
      </div>
    </header>
  );
}
