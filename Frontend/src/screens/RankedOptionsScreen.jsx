import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import './RankedOptionsScreen.css';

export default function RankedOptionsScreen({ lot, onBack, onGlutRadar }) {
  const { tr, lang } = useLang();
 const { options, apiRecommendations } = useApp();


const backendResults = apiRecommendations?.recommendations?.results;

const displayOptions = Array.isArray(backendResults)
  ? backendResults.map((item, index) => ({
      rank: index + 1,
      type: index === 0 ? 'farther_mandi' : 'nearby_mandi',
      labelKey: index === 0 ? 'bestNetRupees' : 'nearbyMandi',
      market: item.market,
      km: item.distance_km_straight_line,
      netRupees: item.estimated_net_return_rs,
      expectedPrice: item.estimated_gross_revenue_rs,
      freight: item.estimated_transport_cost_rs,
      fees: item.estimated_market_fee_rs,
      spoilage: item.estimated_spoilage_loss_rs,
      freightAssumed: true,
      spoilageAssumed: true,
      glutRisk: 'low',
      sellByHours: lot?.sellByHours ?? 18,
      eligible: true,
      priceDate: item.price_date,
      state: item.state,
    }))
  : options;

  const [hoursLeft, setHoursLeft] = useState(lot?.sellByHours ?? 18);
  const [chosenRank, setChosenRank] = useState(null);
  const [showExplain, setShowExplain] = useState(null);

  // countdown
  useEffect(() => {
    const t = setInterval(() => {
      setHoursLeft(h => Math.max(0, h - 1/360)); // slow drain for demo
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const maxHours = lot?.sellByHours ?? 18;
  const pct = Math.max(0, Math.min(100, (hoursLeft / maxHours) * 100));
  const barColor = pct > 60 ? '#f0c419' : pct > 30 ? '#e07b20' : '#c0392b';

  const displayLot = lot || {
    crop: 'Tomato', cropHi: 'टमाटर',
    qty: 2.5, village: 'Raipur',
    harvestedOn: '2026-10-25',
  };

  return (
    <div className="screen ranked-screen">
      <TopBar title={tr('yourOptions')} onBack={onBack} />

      {/* Lot summary */}
      <p className="ranked-lot-summary">
        {lang === 'hi' ? displayLot.cropHi : displayLot.crop}
        {' · '}{displayLot.qty}t
        {' · '}{displayLot.village}{displayLot.district ? `, ${displayLot.district}` : ''}
        {' · '}harvested {displayLot.harvestedOn}
      </p>

      {/* Hours left bar */}
      <div className="hours-bar-card">
        <p className="hours-bar-card__label">
          <span className="hours-bar-card__num">{Math.ceil(hoursLeft)}</span>
          {' '}{tr('hoursLeft')}
        </p>
        <div className="hours-bar-track">
          <div
            className="hours-bar-fill"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Options */}
      <div className="options-list">
        {displayOptions.map(opt => (
          <OptionCard
            key={opt.rank}
            opt={opt}
            chosen={chosenRank === opt.rank}
            onChoose={() => setChosenRank(opt.rank)}
            onExplain={() => setShowExplain(showExplain === opt.rank ? null : opt.rank)}
            showExplain={showExplain === opt.rank}
            onGlutRadar={onGlutRadar}
            tr={tr}
            lang={lang}
          />
        ))}
      </div>

      <p className="ranked-footnote">
        {tr('pricesAsOf')} 27 Oct 2026, 6:00 AM. {tr('freightNote')}
      </p>
    </div>
  );
}

function OptionCard({ opt, chosen, onChoose, onExplain, showExplain, onGlutRadar, tr, lang }) {
  const isTop = opt.rank === 1;
  const isIneligible = !opt.eligible;

  return (
    <div className={`opt-card ${isTop ? 'opt-card--top' : ''} ${chosen ? 'opt-card--chosen' : ''} ${isIneligible ? 'opt-card--ineligible' : ''}`}>
      <div className="opt-card__header">
        <div className="opt-card__rank-label">
          <span className="opt-card__rank">{opt.rank} · </span>
          <span className="opt-card__type">{tr(opt.labelKey)}</span>
        </div>
        <div className="opt-card__badges">
          {opt.glutRisk === 'high' && (
            <span className="badge badge--glut" onClick={onGlutRadar}>{tr('glutRiskHigh')} ↗</span>
          )}
          {opt.eligible && (
            <span className="opt-card__sellby">{tr('sellByTime')} {opt.sellByHours}h</span>
          )}
        </div>
      </div>

      
<p className="opt-card__market">
  {opt.type === 'farther_mandi' ? tr('farther') : ''}
  {opt.market} · {opt.km} km
  {opt.state ? ` · ${opt.state}` : ''}
</p>
{opt.priceDate && (
  <p className="ranked-footnote">
    Historical price date: {opt.priceDate}
  </p>
)}


      {isIneligible ? (
        <>
          <p className="opt-card__ineligible">
            {tr('notEligible')} {opt.needsMoreTonnes} {tr('moreTonnes')}
          </p>
          <button className="btn-outline btn-full">{tr('findNearby')}</button>
        </>
      ) : (
        <>
          <p className="opt-card__net">
            {tr('youKeep')} <span className="opt-card__net-num">₹{opt.netRupees.toLocaleString('en-IN')}</span>
          </p>

          <div className="opt-card__breakdown">
            <div className="breakdown-row">
              <span>{tr('expectedPrice')} ₹{opt.expectedPrice.toLocaleString('en-IN')}</span>
              <span>
                {tr('freight')} −₹{opt.freight.toLocaleString('en-IN')}
                {opt.freightAssumed && <span className="badge badge--assumption">{tr('assumption')}</span>}
              </span>
            </div>
            <div className="breakdown-row">
              <span>{tr('fees')} −₹{opt.fees.toLocaleString('en-IN')}</span>
              {opt.spoilage > 0 && (
                <span>
                  {tr('spoilage')} −₹{opt.spoilage.toLocaleString('en-IN')}
                  {opt.spoilageAssumed && <span className="badge badge--assumption">{tr('assumption')}</span>}
                </span>
              )}
            </div>
          </div>

          {showExplain && (
            <div className="explain-box">
              <p>
                <strong>Why #{opt.rank}?</strong> This option gives you the best net return after freight of
                ₹{opt.freight.toLocaleString('en-IN')} and market fees. {opt.glutRisk === 'high'
                  ? 'Note: Glut risk is high at this mandi — prices may drop further.'
                  : 'Glut risk is low here.'}
              </p>
            </div>
          )}

          <div className="opt-card__actions">
            <button className="btn-outline" onClick={onExplain}>
              {tr('explainHindi')}
            </button>
            <button
              className={`btn-primary ${chosen ? 'btn-primary--chosen' : ''}`}
              onClick={onChoose}
            >
              {chosen ? '✓ Chosen' : tr('chooseThis')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
