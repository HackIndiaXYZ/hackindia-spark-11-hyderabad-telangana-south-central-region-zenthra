import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from './AppContext';
import {
  subscribeToHardwareStatus,
  readStatusOnce,
  ALERT_STATUSES,
  STABLE_STATUS,
  HardwareStatus,
} from '../services/FirebaseService';

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
  hardware_status?: string;       // Raw value pushed from hardware ("CARDIAC ALERT" | "FALL DETECTED" | "STABLE")
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
  liveState: { alert_level: 'Normal', hr: 72, stability: 74, risk_pct: 5, spo2: 98.4, hrv: 44, respiration: 14 },
  history: [],
  medHistory: [],
  inventory: [],
  triggerEmergency: () => {},
  logMedication: () => {},
  markPillTaken: () => {},
});

export function CardiacProvider({ children }: { children: React.ReactNode }) {
  const { isDemoMode } = useContext(AppContext);
  const [liveState, setLiveState] = useState<CardiacState>({
    alert_level: 'Normal',
    hardware_status: 'STABLE',
    hr: 72,
    stability: 74,
    risk_pct: 5,
    spo2: 98.4,
    hrv: 44,
    respiration: 14,
  });
  const [history, setHistory]     = useState<CardiacHistoryEntry[]>([]);
  const [medHistory, setMedHistory] = useState<MedicationEntry[]>([]);
  const [inventory, setInventory]   = useState<InventoryItem[]>([
    { name: 'Aspirin 81mg', totalPills: 30, dailyDosage: 1, stockStatus: 'Healthy' }
  ]);
  const simInterval                 = useRef<any>(null);
  // Track last known emergency state so we don't fire duplicate history entries
  const lastEmergencyRef            = useRef<boolean>(false);

  const addNotification = (payload: any) => {
    // Mocking the requested addNotification since it's not present in this context
    console.log('[Notification Synced to Caregiver]', payload);
  };

  const markPillTaken = (medName: string) => {
    let currentDosage = 1;
    
    setInventory((prev) => {
      let alertTriggered = false;
      const updated = prev.map((item) => {
        if (item.name === medName) {
          currentDosage = item.dailyDosage;
          const newTotal = Math.max(0, item.totalPills - item.dailyDosage);
          let newStatus = item.stockStatus;
          
          if (newTotal <= 3 && item.stockStatus !== 'Low' && item.stockStatus !== 'Empty') {
            newStatus = 'Low';
            alertTriggered = true;
          } else if (newTotal === 0) {
            newStatus = 'Empty';
          }
          
          return { ...item, totalPills: newTotal, stockStatus: newStatus };
        }
        return item;
      });

      if (alertTriggered) {
        addNotification({
          type: 'PHARMACY_ALERT',
          title: '⚠️ Low Medication Stock',
          message: `${medName} has 3 days of supply remaining.`,
          action: 'ORDER_REFILL',
          medName: medName
        });
      }

      return updated;
    });

    logMedication(medName, String(currentDosage));
  };

  // ── Shared helper: activate or deactivate emergency state ───────
  const triggerEmergency = (active: boolean) => {
    setLiveState(prev => ({
      ...prev,
      emergency_active: active,
      alert_level:  active ? 'Critical' : 'Normal',
      risk_pct:     active ? 92 : 5,
      hr:           active ? 112 : (prev.hr && prev.hr > 100 ? 72 : prev.hr),
      stability:    active ? 32 : 74,
    }));

    if (active && !lastEmergencyRef.current) {
      lastEmergencyRef.current = true;
      const newEntry: CardiacHistoryEntry = {
        timestamp: new Date().toISOString(),
        heart_rate: 112,
        alert_level: 'Critical',
        stability: 32,
        msg: 'SOS TRIGGER: Dispatching emergency telemetry.',
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 60));
    } else if (!active) {
      lastEmergencyRef.current = false;
    }
  };

  const logMedication = (name: string, dosage: string, isSimulated = false) => {
    const newEntry: MedicationEntry = {
      timestamp: new Date().toISOString(),
      name,
      dosage,
      isSimulated,
    };
    setMedHistory(prev => [newEntry, ...prev]);
    setHistory(prev => [{
      timestamp: newEntry.timestamp,
      heart_rate: liveState.hr || 72,
      alert_level: 'Medication',
      stability: liveState.stability || 74,
      msg: `Pill Scanned: ${name}`,
    }, ...prev].slice(0, 60));
  };

  // ── 1. FIREBASE REALTIME DATABASE LISTENER ─────────────────────
  //    Listens to /data/status pushed by the hardware dial.
  //    Priority: Firebase always wins over the demo timer below.
  useEffect(() => {
    let firebaseConnected = false;

    // Seed state immediately from Firebase before the first poll interval
    readStatusOnce().then((initialStatus) => {
      if (initialStatus) {
        console.log('[CorAssist] Initial Firebase status:', initialStatus);
        setLiveState(prev => ({ ...prev, hardware_status: initialStatus }));
        const isAlert = (ALERT_STATUSES as readonly string[]).includes(initialStatus);
        if (isAlert && !lastEmergencyRef.current) {
          lastEmergencyRef.current = true;
          setLiveState(prev => ({
            ...prev,
            emergency_active: true,
            alert_level: 'Critical',
            risk_pct: 95,
            stability: 28,
            hr: 118,
          }));
        }
      }
    });

    const unsubscribe = subscribeToHardwareStatus(
      (status: HardwareStatus) => {
        firebaseConnected = true;
        console.log('[CorAssist] Firebase /data/status →', status);

        setLiveState(prev => ({ ...prev, hardware_status: status }));

        const isAlert = (ALERT_STATUSES as readonly string[]).includes(status);
        const isStable = status === STABLE_STATUS;

        if (isAlert) {
          // Build a human-readable event description
          const msg =
            status === 'CARDIAC ALERT'
              ? 'HARDWARE: Cardiac Alert detected via wearable sensor. Emergency protocol active.'
              : 'HARDWARE: Fall Detected via accelerometer. Emergency protocol active.';

          setLiveState(prev => ({
            ...prev,
            emergency_active: true,
            alert_level: 'Critical',
            risk_pct: 95,
            stability: 28,
            hr: prev.hr && prev.hr > 100 ? prev.hr : 118,
          }));

          if (!lastEmergencyRef.current) {
            lastEmergencyRef.current = true;
            setHistory(prev => [
              {
                timestamp: new Date().toISOString(),
                heart_rate: 118,
                alert_level: 'Critical',
                stability: 28,
                msg,
              },
              ...prev,
            ].slice(0, 60));
          }
        } else if (isStable) {
          // Auto-reset to normal dashboard
          lastEmergencyRef.current = false;
          setLiveState(prev => ({
            ...prev,
            emergency_active: false,
            alert_level: 'Normal',
            risk_pct: 5,
            stability: 74,
            hr: 72,
            hrv: 44,
            spo2: 98.4,
          }));
          setHistory(prev => [
            {
              timestamp: new Date().toISOString(),
              heart_rate: 72,
              alert_level: 'Normal',
              stability: 74,
              msg: 'HARDWARE: Status returned to STABLE. Dashboard auto-reset.',
            },
            ...prev,
          ].slice(0, 60));
        }
      },
      (error) => {
        // Firebase unavailable — fall back to demo timer silently
        console.warn('[CorAssist] Firebase unavailable, running demo mode:', error?.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // ── 2. DEMO FALLBACK: 60-SECOND CRISIS TRIGGER ─────────────────
  //    Only fires if Firebase hasn't already triggered an alert.
  useEffect(() => {
    const demoTimeout = setTimeout(() => {
      if (!lastEmergencyRef.current) {
        triggerEmergency(true);
        setHistory(prev => [
          {
            timestamp: new Date().toISOString(),
            heart_rate: 118,
            alert_level: 'Critical',
            stability: 8,
            msg: 'DEMO FALLBACK: Autonomous crisis detection. Emergency protocol active.',
          },
          ...prev,
        ].slice(0, 60));
      }
    }, 60000);

    return () => clearTimeout(demoTimeout);
  }, []);

  // ── 3. LIVE TELEMETRY JITTER ENGINE ────────────────────────────
  useEffect(() => {
    simInterval.current = setInterval(() => {
      setLiveState(prev => {
        if (prev.emergency_active) {
          return {
            ...prev,
            hr: Math.round(112 + Math.random() * 8),
            stability: Math.max(5, (prev.stability || 32) - 1),
            risk_pct: Math.round(92 + Math.random() * 4),
            spo2: parseFloat((91 + Math.random() * 2).toFixed(1)),
            hrv: Math.round(12 + Math.random() * 4),
          };
        }

        const hr        = 70 + Math.random() * 6;
        const stability = 74 + Math.random() * 2;
        const spo2      = 98.1 + Math.random() * 0.9;
        const hrv       = 44 + Math.random() * 4;
        const risk      = 4 + Math.random() * 3;

        const newState = {
          ...prev,
          hr:          Math.round(hr),
          stability:   Math.round(stability),
          spo2:        parseFloat(spo2.toFixed(1)),
          risk_pct:    Math.round(risk),
          hrv:         Math.round(hrv),
          respiration: 14 + (Math.random() > 0.8 ? 1 : 0),
        };

        setTimeout(() => {
          setHistory(hPrev => {
            const entry = {
              timestamp:   new Date().toISOString(),
              heart_rate:  newState.hr,
              alert_level: newState.alert_level,
              stability:   newState.stability,
            };
            return [...hPrev, entry].slice(-60);
          });
        }, 0);

        return newState;
      });
    }, 1500);

    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, []);

  return (
    <CardiacDataContext.Provider value={{ liveState, history, medHistory, inventory, triggerEmergency, logMedication, markPillTaken: (markPillTaken as any) }}>
      {children}
    </CardiacDataContext.Provider>
  );
}

export const useCardiacData = () => useContext(CardiacDataContext);
