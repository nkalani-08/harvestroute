
import { createContext, useContext, useState } from 'react';
import { getRecommendations } from '../services/harvestrouteApi';

const AppContext = createContext(null);

const SAMPLE_LOTS = [
  {
    id: 1,
    crop: 'Tomato',
    cropHi: 'टमाटर',
    qty: 2.5,
    village: 'Raipur',
    district: 'Nashik',
    harvestedOn: '2026-10-25',
    sprayDays: 12,
    quality: 'Good',
    status: 'active',
    sellByHours: 18,
  },
  {
    id: 2,
    crop: 'Onion',
    cropHi: 'प्याज',
    qty: 5,
    village: 'Lasalgaon',
    district: 'Nashik',
    harvestedOn: '2026-10-22',
    sprayDays: 8,
    quality: 'Average',
    status: 'sold',
    sellByHours: 0,
  },
];

const SAMPLE_OPTIONS = [
  {
    rank: 1,
    type: 'farther_mandi',
    label: 'BEST NET RUPEES',
    labelKey: 'bestNetRupees',
    market: 'Vashi APMC',
    km: 180,
    netRupees: 42000,
    expectedPrice: 52000,
    freight: 6000,
    fees: 1800,
    spoilage: 2200,
    freightAssumed: true,
    spoilageAssumed: true,
    glutRisk: 'low',
    sellByHours: 14,
    eligible: true,
  },
  {
    rank: 2,
    type: 'nearby_mandi',
    label: 'NEARBY MANDI',
    labelKey: 'nearbyMandi',
    market: 'Nashik Mandi',
    km: 32,
    netRupees: 34000,
    expectedPrice: 38000,
    freight: 2500,
    fees: 1500,
    spoilage: 0,
    freightAssumed: false,
    spoilageAssumed: false,
    glutRisk: 'high',
    sellByHours: 14,
    eligible: true,
  },
  {
    rank: 3,
    type: 'processor',
    label: 'PROCESSOR',
    labelKey: 'processor',
    market: 'Heinz Tomato Processing',
    km: 45,
    netRupees: 55000,
    expectedPrice: 60000,
    freight: 3500,
    fees: 1500,
    spoilage: 0,
    freightAssumed: false,
    spoilageAssumed: false,
    glutRisk: 'low',
    sellByHours: 14,
    eligible: false,
    needsMoreTonnes: 3,
  },
];

const SAMPLE_NEARBY_LOTS = [
  { id: 10, name: 'Rajesh FPO', crop: 'Tomato', qty: 1.8, km: 4 },
  { id: 11, name: 'Sunita Devi', crop: 'Tomato', qty: 2.2, km: 7 },
];

export function AppProvider({ children }) {
  const [lots, setLots] = useState(SAMPLE_LOTS);
  const [currentLot, setCurrentLot] = useState(null);
  const [glutRisk, setGlutRisk] = useState('rising');

  // State for live backend recommendations
  const [recommendationLoading, setRecommendationLoading] =
    useState(false);
  const [recommendationError, setRecommendationError] =
    useState('');
  const [apiRecommendations, setApiRecommendations] =
    useState(null);

  const addLot = (lot) => {
    const newLot = {
      ...lot,
      id: Date.now(),
      status: 'active',
      sellByHours: 18,
    };

    setLots((prev) => [newLot, ...prev]);
    return newLot;
  };

  // Request real recommendations from the FastAPI backend
  const fetchRecommendations = async (farmerDetails) => {
    setRecommendationLoading(true);
    setRecommendationError('');

    try {
      const result = await getRecommendations(farmerDetails);
      setApiRecommendations(result);
      return result;
    } catch (error) {
      setRecommendationError(
        error.message || 'Could not load recommendations.'
      );
      throw error;
    } finally {
      setRecommendationLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        lots,
        addLot,
        currentLot,
        setCurrentLot,

        // Keep sample data until the results screen is connected
        options: SAMPLE_OPTIONS,
        nearbyLots: SAMPLE_NEARBY_LOTS,

        glutRisk,
        setGlutRisk,
        pricesUpdatedAt: '27 Oct 2026, 6:00 AM',

        // Backend integration
        recommendationLoading,
        recommendationError,
        apiRecommendations,
        fetchRecommendations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
