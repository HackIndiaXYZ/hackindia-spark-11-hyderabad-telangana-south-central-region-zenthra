import React, { createContext, useContext, useState } from 'react';

export interface CardiacHistoryEntry {
  timestamp: string;
  heart_rate: number;
  alert_level: string;
  stability: number;
  msg?: string;
}

export interface MedicationEntry {
  timestamp: string;
  name: string;
  dosage: string;
  isSimulated: boolean;
}

export interface InventoryItem {
  name: string;
  totalPills: number;
  dailyDosage: number;
  stockStatus: 'Healthy' | 'Low' | 'Empty';
}

export interface CardiacState {
  alert_level: string;
  hardware_status?: string;
  emergency_active?: boolean;
  hr?: number;
  stability?: number;
  risk_pct?: number;
  spo2?: number;
  hrv?: number;
  respiration?: number;
  [key: string]: any;
}

const CardiacDataContext = createContext<{
  liveState: CardiacState;
  history: CardiacHistoryEntry[];
  medHistory: MedicationEntry[];
  inventory: InventoryItem[];
  triggerEmergency: (active: boolean) => void;
  logMedication: (name: string, dosage: string, isSimulated?: boolean) => void;
  markPillTaken: (medName: string) => void;
}>({
  liveState: { alert_level: 'Normal', hr: 72, stability: 74, risk_pct: 5, spo2: 98.4, hrv: 44, respiration: 14, emergency_active: false },
  history: [],
  medHistory: [],
  inventory: [],
  triggerEmergency: () => {},
  logMedication: () => {},
  markPillTaken: () => {},
});

export function CardiacProvider({ children }: { children: React.ReactNode }) {
  const [liveState, setLiveState] = useState<CardiacState>({
    alert_level: 'Normal',
    hardware_status: 'STABLE',
    hr: 72,
    stability: 74,
    risk_pct: 5,
    spo2: 98.4,
    hrv: 44,
    respiration: 14,
    emergency_active: false
  });
  
  const triggerEmergency = (active: boolean) => {
    setLiveState(prev => ({ ...prev, emergency_active: active }));
  };

  return (
    <CardiacDataContext.Provider value={{
      liveState,
      history: [],
      medHistory: [],
      inventory: [
        { name: 'Aspirin 81mg', totalPills: 30, dailyDosage: 1, stockStatus: 'Healthy' }
      ],
      triggerEmergency,
      logMedication: () => {},
      markPillTaken: () => {},
    }}>
      {children}
    </CardiacDataContext.Provider>
  );
}

export const useCardiacData = () => useContext(CardiacDataContext);
