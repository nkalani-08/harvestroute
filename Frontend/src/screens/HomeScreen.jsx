import { useLang } from '../context/LangContext';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import './HomeScreen.css';

export default function HomeScreen({ onNavigate }) {
  const { tr, lang } = useLang();
  const { lots, pricesUpdatedAt, glutRisk, setCurrentLot } = useApp();

  const handleLotClick = (lot) => {
    if (lot.status === 'active') {
      setCurrentLot(lot);
      onNavigate('options');
    }
  };

  return (
    <div className="screen home-screen">
      <TopBar />

      {/* Glut Alert Banner */}
      {glutRisk !== 'low' && (
        <div className="glut-alert glut-alert--rising">
          <div className="glut-alert__dot" />
          <div className="glut-alert__body">
            <p className="glut-alert__title">{tr('glutAlertTitle')}</p>
            <p className="glut-alert__sub">{tr('glutAlertBody')}</p>
            <button
              className="glut-alert__cta"
              onClick={() => onNavigate('glut')}
            >
              {tr('glutAlertCta')} →
            </button>
          </div>
        </div>
      )}

      {/* Add Lot CTA */}
      <button className="add-lot-cta" onClick={() => onNavigate('add')}>
        <div className="add-lot-cta__mic">
          <MicIcon />
        </div>
        <p className="add-lot-cta__hindi">{tr('addLotHindi')}</p>
        <p className="add-lot-cta__sub">{tr('addLotTitle')}</p>
      </button>

      {/* Recent Lots */}
      <section className="recent-lots">
        <h2 className="section-label">{tr('recentLots')}</h2>
        {lots.length === 0 ? (
          <p className="empty-state">No lots yet. Add your first harvest!</p>
        ) : (
          lots.map(lot => (
            <button
              key={lot.id}
              className={`lot-card ${lot.status === 'active' ? 'lot-card--active' : ''}`}
              onClick={() => handleLotClick(lot)}
            >
              <span className="lot-card__info">
                {lang === 'hi' ? lot.cropHi : lot.crop} · {lot.qty}t · {lot.village}{lot.district ? `, ${lot.district}` : ''}
              </span>
              <span className={`lot-card__status lot-card__status--${lot.status}`}>
                {lot.status === 'sold'
                  ? tr('sold')
                  : `${tr('sellBy')} ${lot.sellByHours}h`}
              </span>
            </button>
          ))
        )}
        <p className="prices-updated">
          {tr('pricesUpdated')}: {pricesUpdatedAt}
        </p>
      </section>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 4a5 5 0 0 0-5 5v10a5 5 0 0 0 10 0V9a5 5 0 0 0-5-5z" fill="white" fillOpacity="0.9"/>
      <path d="M8 18a10 10 0 0 0 20 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="18" y1="28" x2="18" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="13" y1="33" x2="23" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
