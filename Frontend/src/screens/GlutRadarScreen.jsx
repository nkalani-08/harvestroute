import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import './GlutRadarScreen.css';

const RISK_LEVELS = ['low', 'rising', 'high'];

// Simple SVG line chart of arrivals vs 3-year average
function ArrivalsChart({ risk }) {
  const points = risk === 'low'
    ? [12, 14, 13, 14, 13, 14, 14, 15]
    : risk === 'rising'
    ? [13, 15, 18, 22, 27, 34, 40, 48]
    : [30, 38, 45, 52, 58, 65, 72, 80];
  const avg = [15, 15, 15, 16, 16, 16, 17, 17];

  const W = 300, H = 90;
  const maxVal = Math.max(...points, ...avg) + 5;
  const px = (i) => (i / (points.length - 1)) * W;
  const py = (v) => H - (v / maxVal) * H;

  const toPath = (arr) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="90" className="arrivals-chart">
      {/* Average line (dashed) */}
      <path d={toPath(avg)} fill="none" stroke="#b0a898" strokeWidth="1.5" strokeDasharray="5,4" />
      {/* Arrivals line */}
      <path d={toPath(points)} fill="none" stroke="#2d6a2d" strokeWidth="2.2" strokeLinecap="round" />
      {/* Gradient fill under arrivals */}
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d6a2d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2d6a2d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${toPath(points)} L ${W} ${H} L 0 ${H} Z`}
        fill="url(#grad)"
      />
    </svg>
  );
}

export default function GlutRadarScreen({ onBack, onSeeRanking }) {
  const { tr, lang } = useLang();
  const { glutRisk, setGlutRisk, nearbyLots, lots } = useApp();
  const [alerted, setAlerted] = useState(false);

  const myLot = lots.find(l => l.status === 'active') || lots[0];
  const myQty = myLot?.qty || 2.5;
  const poolQty = nearbyLots.reduce((s, l) => s + l.qty, 0);
  const neededQty = 8; // processor min
  const totalWithPool = myQty + poolQty;

  const reasons = {
    low: [
      { text: `${tr('arrivalsAbove')} 5%` },
      { text: `${tr('upstreamFalling')} none` },
    ],
    rising: [
      { text: `${tr('arrivalsAbove')} 24%` },
      { text: `${tr('upstreamFalling')} Pune APMC` },
      { text: `${tr('harvestWave')} 3 Nov 2026` },
    ],
    high: [
      { text: `${tr('arrivalsAbove')} 68%` },
      { text: `${tr('upstreamFalling')} Vashi, Pune` },
      { text: `${tr('harvestWave')} 28 Oct 2026` },
    ],
  };

  return (
    <div className="screen glut-screen">
      <TopBar title={tr('glutRadar')} onBack={onBack} />

      <p className="glut-subtitle">
        Nashik · {lang === 'hi' ? 'टमाटर' : 'Tomato'} · next 1 to 2 weeks
      </p>

      {/* Risk Level Selector */}
      <div className="risk-card">
        <div className="risk-selector">
          {RISK_LEVELS.map(lvl => (
            <button
              key={lvl}
              className={`risk-btn risk-btn--${lvl} ${glutRisk === lvl ? `risk-btn--active risk-btn--active-${lvl}` : ''}`}
              onClick={() => setGlutRisk(lvl)}
            >
              {tr(`glut${lvl.charAt(0).toUpperCase() + lvl.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="risk-reasons">
          <p className="risk-reasons__title">{tr('whyWeThinkSo')}</p>
          {reasons[glutRisk].map((r, i) => (
            <p key={i} className="risk-reasons__item">· {r.text}</p>
          ))}
        </div>
      </div>

      {/* Impact on you */}
      {glutRisk !== 'low' && (
        <div className="impact-card">
          <p className="impact-card__title">{tr('whatChanged')}</p>
          <p className="impact-card__body">
            {tr('nearbyMandiRanks')} −₹{glutRisk === 'rising' ? '4,000' : '9,000'} {tr('vsYesterday')}
          </p>
          <button className="impact-card__link" onClick={onSeeRanking}>
            {tr('seeMyRanking')} →
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="chart-card">
        <p className="chart-card__title">{tr('arrivalsChart')}</p>
        <ArrivalsChart risk={glutRisk} />
        <div className="chart-legend">
          <span className="legend-item legend-item--green">— {lang === 'hi' ? 'आवक' : 'Arrivals'}</span>
          <span className="legend-item legend-item--dashed">- - {lang === 'hi' ? '3 साल औसत' : '3-yr avg'}</span>
        </div>
      </div>

      {/* Nearby Pooling Lots */}
      <section className="pool-section">
        <h2 className="section-label">{tr('nearbyLotsPool')}</h2>
        {nearbyLots.map(lot => (
          <div key={lot.id} className="pool-lot">
            <div className="pool-lot__info">
              <span className="pool-lot__name">{lot.name}</span>
              <span className="pool-lot__meta">
                · {lang === 'hi' ? 'टमाटर' : lot.crop} · {lot.qty}t · {lot.km} km
              </span>
            </div>
            <button className="btn-contact">{tr('contact')}</button>
          </div>
        ))}
        <p className="pool-summary">
          {tr('together')} {totalWithPool}t {tr('of')} {neededQty}t {tr('neededFor')} Heinz.
        </p>
      </section>

      {/* Alert FPO */}
      <div className="alert-area">
        <button
          className={`alert-fpo-btn ${alerted ? 'alert-fpo-btn--done' : ''}`}
          onClick={() => setAlerted(true)}
        >
          {alerted ? '✓ FPO Alerted!' : tr('alertFpo')}
        </button>
        <p className="backtest-note">
          {tr('backtest')} 4 {tr('daysEarlier')} 12{tr('falseAlarms')}
        </p>
      </div>
    </div>
  );
}
