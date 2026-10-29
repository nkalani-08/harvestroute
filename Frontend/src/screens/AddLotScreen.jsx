import { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import { ALL_CROPS } from '../data/cropsData';
import { ALL_DISTRICTS } from '../data/indiaLocations';
import './AddLotScreen.css';

export default function AddLotScreen({ onBack, onConfirm }) {
  const { tr, lang } = useLang();
 const {
  addLot,
  fetchRecommendations,
  recommendationLoading,
  recommendationError,
} = useApp();

const [submitError, setSubmitError] = useState('');

  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [parsed, setParsed] = useState(false);
  const recognitionRef = useRef(null);

  // Unit for quantity input: 'ton' | 'quintal' | 'kg'
  const [unit, setUnit] = useState('ton');
  const [rawQty, setRawQty] = useState('');

  // Dropdown states
  const [cropDropdownOpen, setCropDropdownOpen] = useState(false);
  const [cropSearch, setCropSearch] = useState('');

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');

  const [villageDropdownOpen, setVillageDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    crop: '',
    cropHi: '',
    qty: '', // always stored in tonnes
    village: '',
    district: '',
    harvestedOn: new Date().toISOString().split('T')[0],
    sprayDays: '',
    quality: 'Good',
  });

  // Convert raw quantity to tonnes based on current unit
  const toTonnes = (val, u = unit) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return 0;
    if (u === 'kg') return Number((num / 1000).toFixed(3));
    if (u === 'quintal') return Number((num / 10).toFixed(2));
    return Number(num.toFixed(2));
  };

  // Convert tonnes back to current unit for display
  const fromTonnesToUnit = (tonnesVal, targetUnit) => {
    const num = parseFloat(tonnesVal);
    if (isNaN(num) || num < 0) return '';
    if (targetUnit === 'kg') return String(Math.round(num * 1000));
    if (targetUnit === 'quintal') return String(Number((num * 10).toFixed(2)));
    return String(num);
  };

  // Setup Web Speech API
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(text);
      if (e.results[0].isFinal) {
        parseTranscript(text);
        setListening(false);
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, [lang]);

  // Robust parser for speech and editable transcript text
  const parseTranscript = (text) => {
    if (!text || typeof text !== 'string') return;
    const lower = text.toLowerCase();

    // 1. Match Crop from ALL_CROPS
    let matchedCrop = null;
    for (const c of ALL_CROPS) {
      if (
        lower.includes(c.en.toLowerCase()) ||
        lower.includes(c.hi) ||
        (c.hi && lower.includes(c.hi.toLowerCase()))
      ) {
        matchedCrop = c;
        break;
      }
    }

    // 2. Quantity & Unit conversion (e.g. 4500kg -> 4.5 ton, 45 quintal -> 4.5 ton)
    let parsedTonnes = null;
    let detectedUnit = 'ton';
    let detectedRawQty = '';

    // Regex checking for numbers with units
    // Group 1: number, Group 2: unit
    const qtyRegex = /(\d+(?:\.\d+)?)\s*(किलो(?:ग्राम)?|किग्रा|kg|kilo(?:gram)?s?|क्विंटल|quintals?|kuintal|qtl|टन|tons?|tonnes?|t)?/i;
    const match = text.match(qtyRegex);

    if (match) {
      const valNum = parseFloat(match[1]);
      const rawUnitStr = (match[2] || '').toLowerCase();

      if (/किलो|kg|kilo/i.test(rawUnitStr)) {
        parsedTonnes = Number((valNum / 1000).toFixed(3));
        detectedUnit = 'kg';
        detectedRawQty = String(valNum);
      } else if (/क्विंटल|quintal|kuintal|qtl/i.test(rawUnitStr)) {
        parsedTonnes = Number((valNum / 10).toFixed(2));
        detectedUnit = 'quintal';
        detectedRawQty = String(valNum);
      } else if (/टन|ton|tonne/i.test(rawUnitStr)) {
        parsedTonnes = Number(valNum.toFixed(2));
        detectedUnit = 'ton';
        detectedRawQty = String(valNum);
      } else {
        // No explicit unit: if large number (> 100), assume kg, else ton
        if (valNum >= 100) {
          parsedTonnes = Number((valNum / 1000).toFixed(3));
          detectedUnit = 'kg';
          detectedRawQty = String(valNum);
        } else {
          parsedTonnes = Number(valNum.toFixed(2));
          detectedUnit = 'ton';
          detectedRawQty = String(valNum);
        }
      }
    }

    // 3. Match District & Village from ALL_DISTRICTS
    let matchedDistrict = '';
    let matchedVillage = '';

    for (const d of ALL_DISTRICTS) {
      if (lower.includes(d.name.toLowerCase()) || lower.includes(d.nameHi.toLowerCase())) {
        matchedDistrict = d.name;
        // Check if any village of this district is in text
        for (const v of d.villages) {
          if (lower.includes(v.toLowerCase())) {
            matchedVillage = v;
            break;
          }
        }
        break;
      }
    }

    // If district wasn't found directly, check if any known village was spoken
    if (!matchedVillage) {
      for (const d of ALL_DISTRICTS) {
        for (const v of d.villages) {
          if (lower.includes(v.toLowerCase())) {
            matchedVillage = v;
            matchedDistrict = d.name;
            break;
          }
        }
        if (matchedVillage) break;
      }
    }

    // Update state
    setForm(prev => ({
      ...prev,
      crop: matchedCrop ? matchedCrop.en : prev.crop,
      cropHi: matchedCrop ? matchedCrop.hi : prev.cropHi,
      qty: parsedTonnes !== null ? String(parsedTonnes) : prev.qty,
      district: matchedDistrict || prev.district,
      village: matchedVillage || prev.village,
    }));

    if (parsedTonnes !== null) {
      setUnit(detectedUnit);
      setRawQty(detectedRawQty || String(parsedTonnes));
    }

    setParsed(true);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Simulation for fallback demo
      setListening(true);
      setTranscript('');
      setTimeout(() => {
        const demo = lang === 'hi'
          ? 'टमाटर 4500 किलो रायपुर नासिक'
          : 'Tomato 4500 kg Raipur Nashik';
        setTranscript(demo);
        parseTranscript(demo);
        setListening(false);
      }, 1500);
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript('');
      setListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  };

  // Quantity input handler - strictly non-negative
  const handleRawQtyChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setRawQty('');
      setForm(f => ({ ...f, qty: '' }));
      return;
    }
    const num = parseFloat(val);
    if (num < 0 || isNaN(num)) return; // Prevent negative values
    setRawQty(val);
    const inTonnes = toTonnes(val, unit);
    setForm(f => ({ ...f, qty: String(inTonnes) }));
    if (!parsed) setParsed(true);
  };

  // Unit switch handler (Ton / Quintal / KG)
  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    if (form.qty && !isNaN(parseFloat(form.qty))) {
      const convertedRaw = fromTonnesToUnit(form.qty, newUnit);
      setRawQty(convertedRaw);
    }
    setUnit(newUnit);
  };

  // Spray days input handler - strictly non-negative integer
  const handleSprayDaysChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setForm(f => ({ ...f, sprayDays: '' }));
      return;
    }
    const num = parseInt(val, 10);
    if (num < 0 || isNaN(num)) return; // Prevent negative
    setForm(f => ({ ...f, sprayDays: String(num) }));
    if (!parsed) setParsed(true);
  };

  // Crop selection handler
  const handleSelectCrop = (cropObj) => {
    setForm(f => ({
      ...f,
      crop: cropObj.en,
      cropHi: cropObj.hi,
    }));
    setCropDropdownOpen(false);
    setCropSearch('');
    if (!parsed) setParsed(true);
  };

  // District selection handler
  const handleSelectDistrict = (distObj) => {
    setForm(f => ({
      ...f,
      district: distObj.name,
      // If current village doesn't belong to this district, clear it or leave to user
      village: distObj.villages.includes(f.village) ? f.village : '',
    }));
    setDistrictDropdownOpen(false);
    setDistrictSearch('');
    if (!parsed) setParsed(true);
  };

  // Village selection handler
  const handleSelectVillage = (villageName) => {
    setForm(f => ({ ...f, village: villageName }));
    setVillageDropdownOpen(false);
    if (!parsed) setParsed(true);
  };

  // Filter crops by search query
  const filteredCrops = ALL_CROPS.filter(c => {
    const q = cropSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.en.toLowerCase().includes(q) ||
      c.hi.includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  // Filter districts by search query
  const filteredDistricts = ALL_DISTRICTS.filter(d => {
    const q = districtSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.nameHi.includes(q) ||
      d.state.toLowerCase().includes(q)
    );
  });

  // Suggested villages for currently selected district
  const selectedDistObj = ALL_DISTRICTS.find(d => d.name === form.district);
  const availableVillages = selectedDistObj ? selectedDistObj.villages : [
    'Raipur', 'Lasalgaon', 'Pimpalgaon', 'Malegaon', 'Srinivasapur', 'Bangarapet', 'Baramati', 'Sanwer', 'Fatehabad'
  ];

  // Validation
  const isComplete = Boolean(
    form.crop &&
    form.qty &&
    parseFloat(form.qty) > 0 &&
    form.village.trim() &&
    form.district.trim() &&
    form.harvestedOn &&
    form.sprayDays !== '' &&
    form.quality
  );

  
const handleConfirm = async () => {
  setSubmitError('');

  if (!navigator.geolocation) {
    setSubmitError('Your browser does not support location access.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const selectedDistrict = ALL_DISTRICTS.find(
          (district) => district.name === form.district
        );

        await fetchRecommendations({
          farmer_lat: position.coords.latitude,
          farmer_lon: position.coords.longitude,
          quantity_tonnes: parseFloat(form.qty),
          crop: form.crop,
          state: selectedDistrict?.state,
          top_n: 5,
        });

        const lot = addLot({
          ...form,
          qty: parseFloat(form.qty),
          sprayDays: parseInt(form.sprayDays, 10),
        });

        onConfirm(lot);
      } catch (error) {
        setSubmitError(
          error.message || 'Unable to fetch market recommendations.'
        );
      }
    },
    () => {
      setSubmitError(
        'Location permission is needed to find nearby markets.'
      );
    }
  );
};


  return (
    <div className="screen add-lot-screen">
      <TopBar title={tr('addLot')} onBack={onBack} />

      {/* Voice Input Section */}
      <div className="voice-section">
        <button
          className={`voice-btn ${listening ? 'voice-btn--active' : ''}`}
          onClick={toggleListening}
          aria-label="Start voice input"
        >
          <MicIcon listening={listening} />
        </button>
        <div className="voice-text">
          <p className="voice-text__hindi">{tr('voicePromptHindi')}</p>
          <p className="voice-text__sub">{tr('voicePromptSub')}</p>
        </div>
      </div>

      {/* Editable Speech Transcript Section */}
      <div className="transcript-wrapper">
        <div className="transcript-header">
          <span className="transcript-label">
            {tr('editTranscriptHint')}
          </span>
          {transcript && (
            <button
              type="button"
              className="transcript-apply-btn"
              onClick={() => parseTranscript(transcript)}
            >
              ✓ {tr('applyTranscript')}
            </button>
          )}
        </div>
        <textarea
          className="transcript-textarea"
          rows={2}
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            parseTranscript(e.target.value);
          }}
          placeholder={tr('voicePlaceholder')}
        />
        {listening && (
          <div className="listening-indicator">
            <span className="pulse-dot"></span>
            <span>{lang === 'hi' ? 'सुन रहे हैं...' : 'Listening...'}</span>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="add-lot-form">
        <p className="form-heading">{tr('weUnderstood')}</p>

        {/* CROP DROPDOWN WITH SEARCH */}
        <div className="form-group form-group--full">
          <label>{tr('fieldCrop')}</label>
          <div className="dropdown-container">
            <div
              className={`selector-trigger ${form.crop ? 'selector-trigger--filled' : ''}`}
              onClick={() => setCropDropdownOpen(prev => !prev)}
            >
              <div className="selector-trigger__val">
                {form.crop ? (
                  <span>
                    <strong>{lang === 'hi' ? form.cropHi : form.crop}</strong>
                    <span className="crop-secondary-name">
                      {lang === 'hi' ? ` (${form.crop})` : ` (${form.cropHi})`}
                    </span>
                  </span>
                ) : (
                  <span className="placeholder-text">{tr('searchCrop')}</span>
                )}
              </div>
              <span className="dropdown-arrow">{cropDropdownOpen ? '▲' : '▼'}</span>
            </div>

            {cropDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="dropdown-search-input"
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    placeholder={tr('searchCrop')}
                    autoFocus
                  />
                  {cropSearch && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setCropSearch('')}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="dropdown-list">
                  {filteredCrops.length === 0 ? (
                    <p className="no-results">
                      {lang === 'hi' ? 'कोई फसल नहीं मिली' : 'No matching crops found'}
                    </p>
                  ) : (
                    filteredCrops.map(cropItem => (
                      <button
                        key={cropItem.id}
                        type="button"
                        className={`dropdown-item ${form.crop === cropItem.en ? 'dropdown-item--selected' : ''}`}
                        onClick={() => handleSelectCrop(cropItem)}
                      >
                        <span className="dropdown-item__main">
                          {lang === 'hi' ? cropItem.hi : cropItem.en}
                        </span>
                        <span className="dropdown-item__sub">
                          {lang === 'hi' ? cropItem.en : cropItem.hi}
                        </span>
                        <span className="dropdown-item__tag">
                          {lang === 'hi' ? cropItem.categoryHi : cropItem.category}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QUANTITY WITH UNIT CONVERSION & NON-NEGATIVE ENFORCEMENT */}
        <div className="form-group form-group--full">
          <div className="qty-header">
            <label>{tr('fieldQty')}</label>
            <div className="unit-pills">
              <button
                type="button"
                className={`unit-pill ${unit === 'ton' ? 'unit-pill--active' : ''}`}
                onClick={() => handleUnitChange('ton')}
              >
                {tr('unitTon')}
              </button>
              <button
                type="button"
                className={`unit-pill ${unit === 'quintal' ? 'unit-pill--active' : ''}`}
                onClick={() => handleUnitChange('quintal')}
              >
                {tr('unitQuintal')}
              </button>
              <button
                type="button"
                className={`unit-pill ${unit === 'kg' ? 'unit-pill--active' : ''}`}
                onClick={() => handleUnitChange('kg')}
              >
                {tr('unitKg')}
              </button>
            </div>
          </div>

          <div className="qty-input-wrapper">
            <input
              type="number"
              min="0"
              step="any"
              value={rawQty}
              onChange={handleRawQtyChange}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              placeholder={unit === 'kg' ? 'e.g. 4500' : unit === 'quintal' ? 'e.g. 45' : 'e.g. 4.5'}
              className="qty-input"
            />
            <span className="qty-unit-label">
              {unit === 'ton' ? 'Ton' : unit === 'quintal' ? 'Quintal' : 'KG'}
            </span>
          </div>

          {/* Live ton conversion note if unit is kg or quintal */}
          {form.qty && unit !== 'ton' && (
            <div className="conversion-badge">
              ⚡ {tr('convertedToTons')} <strong>{form.qty} Tonnes</strong>
            </div>
          )}
        </div>

        {/* DISTRICT & VILLAGE SEPARATE WITH SPACES & FULL INDIA DROPDOWN */}
        <div className="form-grid">
          {/* DISTRICT DROPDOWN */}
          <div className="form-group">
            <label>{tr('fieldDistrict')}</label>
            <div className="dropdown-container">
              <div
                className={`selector-trigger ${form.district ? 'selector-trigger--filled' : ''}`}
                onClick={() => setDistrictDropdownOpen(prev => !prev)}
              >
                <div className="selector-trigger__val">
                  {form.district ? (
                    <strong>{form.district}</strong>
                  ) : (
                    <span className="placeholder-text">{tr('searchDistrict')}</span>
                  )}
                </div>
                <span className="dropdown-arrow">{districtDropdownOpen ? '▲' : '▼'}</span>
              </div>

              {districtDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="dropdown-search-input"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      placeholder={tr('searchDistrict')}
                      autoFocus
                    />
                    {districtSearch && (
                      <button
                        className="clear-search-btn"
                        onClick={() => setDistrictSearch('')}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="dropdown-list">
                    {filteredDistricts.length === 0 ? (
                      <p className="no-results">No district found</p>
                    ) : (
                      filteredDistricts.map(dist => (
                        <button
                          key={`${dist.state}-${dist.name}`}
                          type="button"
                          className={`dropdown-item ${form.district === dist.name ? 'dropdown-item--selected' : ''}`}
                          onClick={() => handleSelectDistrict(dist)}
                        >
                          <span className="dropdown-item__main">
                            {lang === 'hi' ? dist.nameHi : dist.name}
                          </span>
                          <span className="dropdown-item__sub">
                            {dist.state}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VILLAGE INPUT / DROPDOWN - FULL SPACE SUPPORT */}
          <div className="form-group">
            <div className="village-header">
              <label>{tr('fieldVillage')}</label>
              {availableVillages.length > 0 && (
                <button
                  type="button"
                  className="quick-village-toggle"
                  onClick={() => setVillageDropdownOpen(prev => !prev)}
                >
                  {villageDropdownOpen ? 'Hide list' : 'Suggestions ▾'}
                </button>
              )}
            </div>

            <div className="village-input-box">
              <input
                type="text"
                value={form.village}
                onChange={(e) => {
                  setForm(f => ({ ...f, village: e.target.value }));
                  if (!parsed) setParsed(true);
                }}
                placeholder={tr('selectVillage')}
                className="village-text-input"
              />
            </div>

            {villageDropdownOpen && (
              <div className="village-suggestions">
                <span className="suggestions-title">
                  {form.district ? `Villages in ${form.district}:` : 'Common villages:'}
                </span>
                <div className="village-pill-list">
                  {availableVillages.map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`village-pill ${form.village === v ? 'village-pill--active' : ''}`}
                      onClick={() => handleSelectVillage(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HARVEST DATE & DAYS SINCE SPRAY */}
        <div className="form-grid">
          <div className="form-group">
            <label>{tr('fieldHarvestedOn')}</label>
            <input
              type="date"
              value={form.harvestedOn}
              onChange={e => {
                setForm(f => ({ ...f, harvestedOn: e.target.value }));
                if (!parsed) setParsed(true);
              }}
              className="standard-input"
            />
          </div>

          <div className="form-group">
            <label>{tr('fieldSprayDays')}</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.sprayDays}
              onChange={handleSprayDaysChange}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                  e.preventDefault();
                }
              }}
              placeholder="e.g. 7"
              className="standard-input"
            />
          </div>
        </div>

        {/* QUALITY GRADE SELECTOR */}
        <div className="form-group form-group--full">
          <label>{tr('fieldQuality')}</label>
          <div className="quality-btns">
            {['Good', 'Average', 'Poor'].map(q => (
              <button
                key={q}
                type="button"
                className={`quality-btn ${form.quality === q ? 'quality-btn--active' : ''}`}
                onClick={() => {
                  setForm(f => ({ ...f, quality: q }));
                  if (!parsed) setParsed(true);
                }}
              >
                {tr(`quality${q}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Area */}
      <div className="confirm-area">
        <button
          className={`confirm-btn ${!isComplete ? 'confirm-btn--disabled' : ''}`}
         disabled={!isComplete || recommendationLoading}
          onClick={handleConfirm}
        >
          {recommendationLoading
  ? 'Finding markets...'
  : tr('confirmBtn')}
  {(submitError || recommendationError) && (
  <p role="alert" style={{ color: 'red' }}>
    {submitError || recommendationError}
  </p>
)}
        </button>
        <p className="confirm-note">{tr('confirmNote')}</p>
      </div>
    </div>
  );
}

function MicIcon({ listening }) {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <path
        d="M18 4a5 5 0 0 0-5 5v10a5 5 0 0 0 10 0V9a5 5 0 0 0-5-5z"
        fill="#fff"
        fillOpacity={listening ? 1 : 0.95}
      />
      <path d="M8 18a10 10 0 0 0 20 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="18" y1="28" x2="18" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="13" y1="33" x2="23" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
