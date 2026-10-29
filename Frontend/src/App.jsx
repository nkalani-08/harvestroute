
import { useState } from 'react';
import { LangProvider } from './context/LangContext';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import AddLotScreen from './screens/AddLotScreen';
import RankedOptionsScreen from './screens/RankedOptionsScreen';
import GlutRadarScreen from './screens/GlutRadarScreen';
import AIAssistantScreen from './screens/AIAssistantScreen';
import './App.css';

function AppInner() {
  const [page, setPage] = useState('home');
  const { currentLot, setCurrentLot } = useApp();

  const navPage = (key) => {
    if (key === 'options' && !currentLot) return;
    setPage(key);
  };

  return (
    <div className="app-shell">
      <div className="app-content">
        {page === 'home' && (
          <HomeScreen
            onNavigate={(p) => {
              if (p === 'add') setPage('add');
              else if (p === 'glut') setPage('glut');
              else if (p === 'options') setPage('options');
              else if (p === 'ai') setPage('ai');
            }}
          />
        )}

        {page === 'add' && (
          <AddLotScreen
            onBack={() => setPage('home')}
            onConfirm={(lot) => {
              setCurrentLot(lot);
              setPage('options');
            }}
          />
        )}

        {page === 'options' && (
          <RankedOptionsScreen
            lot={currentLot}
            onBack={() => setPage('home')}
            onGlutRadar={() => setPage('glut')}
          />
        )}

        {page === 'glut' && (
          <GlutRadarScreen
            onBack={() => setPage(currentLot ? 'options' : 'home')}
            onSeeRanking={() => {
              if (currentLot) setPage('options');
              else setPage('home');
            }}
          />
        )}

        {page === 'ai' && (
          <AIAssistantScreen
            onBack={() => setPage('home')}
          />
        )}
      </div>

      {(page === 'home' ||
        page === 'glut' ||
        page === 'options' ||
        page === 'ai') && (
        <BottomNav
          active={page}
          onNavigate={(key) => {
            if (key === 'home') {
              setPage('home');
            } else if (key === 'glut') {
              setPage('glut');
            } else if (key === 'options') {
              if (currentLot) setPage('options');
              else setPage('home');
            } else if (key === 'ai') {
              setPage('ai');
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </LangProvider>
  );
}
