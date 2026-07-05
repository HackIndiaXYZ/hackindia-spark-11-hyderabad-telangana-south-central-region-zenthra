import React, { createContext, useState, useEffect } from 'react';

interface SOSContact {
  name: string;
  phone: string;
}

interface PatientProfile {
  name: string;
  age: string;
  sex: string;
  bloodType: string;
  conditions: string;
}

interface AppData {
  ai_pattern?: string;
  emergency_active?: boolean;
  [key: string]: any;
}

interface AppContextType {
  liveData: AppData;
  isDemoMode: boolean;
  setIsDemoMode: (mode: boolean) => void;
  ipAddress: string;
  setIpAddress: (ip: string) => void;
  dismissAlert: () => void;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  hasCompletedOnboarding: boolean;
  userPin: string;
  patientProfile: PatientProfile;
  setPatientProfile: (profile: PatientProfile) => void;
  sosContacts: SOSContact[];
  setSosContacts: (contacts: SOSContact[]) => void;
  alertThreshold: number;
  setAlertThreshold: (val: number) => void;
  language: string;
  setLanguage: (lang: string) => void;
  triggerSOS: () => void;
  userRole: 'patient' | 'guardian' | null;
  setUserRole: (role: 'patient' | 'guardian' | null) => void;
}

export const AppContext = createContext<AppContextType>({
  liveData: {},
  isDemoMode: false,
  setIsDemoMode: () => {},
  ipAddress: 'localhost',
  setIpAddress: () => {},
  dismissAlert: () => {},
  isAppLocked: false,
  setIsAppLocked: () => {},
  hasCompletedOnboarding: true,
  userPin: '1234',
  patientProfile: { name: 'Jane Doe', age: '45', sex: 'Female', bloodType: 'O Negative', conditions: 'Hypertension' },
  setPatientProfile: () => {},
  sosContacts: [
    { name: 'Ram', phone: '+91 90000 00001' },
    { name: 'Hanuman', phone: '+91 90000 00002' },
    { name: 'Krishna', phone: '+91 90000 00003' }
  ],
  setSosContacts: () => {},
  alertThreshold: 75,
  setAlertThreshold: () => {},
  language: 'English',
  setLanguage: () => {},
  triggerSOS: () => {},
  userRole: null,
  setUserRole: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [liveData, setLiveData] = useState<AppData>({
    ai_pattern: 'Normal Sinus Rhythm',
    emergency_active: false,
    stability: 85,
    hr: 72,
    risk_pct: 5,
    risk_window_msg: "Cardiac stability within normal parameters.",
  });
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [ipAddress, setIpAddress] = useState('localhost');
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [userPin, setUserPin] = useState('1234');
  const [userRole, setUserRole] = useState<'patient' | 'guardian' | null>(null);
  
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({
    name: 'Jane Doe', age: '45', sex: 'Female', bloodType: 'O Negative', conditions: 'Hypertension'
  });
  const [sosContacts, setSosContacts] = useState<SOSContact[]>([
    { name: 'Ram', phone: '+91 90000 00001' },
    { name: 'Hanuman', phone: '+91 90000 00002' },
    { name: 'Krishna', phone: '+91 90000 00003' }
  ]);
  const [alertThreshold, setAlertThreshold] = useState(75);
  const [language, setLanguage] = useState('English');
  const dismissAlert = () => {
    setLiveData(prev => ({ ...prev, emergency_active: false }));
  };

  const triggerSOS = () => {
    setLiveData(prev => ({ ...prev, emergency_active: true }));
  };

  return (
    <AppContext.Provider value={{ 
      liveData, 
      isDemoMode, 
      setIsDemoMode,
      ipAddress,
      setIpAddress,
      dismissAlert, 
      triggerSOS,
      isAppLocked, 
      setIsAppLocked,
      hasCompletedOnboarding,
      userPin,
      patientProfile,
      setPatientProfile,
      sosContacts,
      setSosContacts,
      alertThreshold,
      setAlertThreshold,
      language,
      setLanguage,
      userRole,
      setUserRole
    }}>
      {children}
    </AppContext.Provider>
  );
}
