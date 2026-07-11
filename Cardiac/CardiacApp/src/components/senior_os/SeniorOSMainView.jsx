import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SeniorAccessibilityProvider, useAccessibility } from './SeniorAccessibilityProvider';
import VoiceIntentEngine from './VoiceIntentEngine';
import SeniorCompanionChat from './SeniorCompanionChat';
import SeniorServicesHub from './SeniorServicesHub';
import CaregiverRelayHub from './CaregiverRelayHub';
import SeniorOSDemoSuite from './SeniorOSDemoSuite';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// CONTEXT IMPORT FALLBACK: safely wrap useCardiacData import with fallback dummy state
let useCardiacData;
try {
  useCardiacData = require('../../context/CardiacDataContext').useCardiacData;
} catch (e) {
  useCardiacData = () => ({
    liveState: { alert_level: 'Normal', hr: 72, stability: 74, risk_pct: 5, spo2: 98.4, hrv: 44, respiration: 14, emergency_active: false },
    history: [],
    medHistory: [],
    inventory: [
      { name: 'Aspirin 81mg', totalPills: 30, dailyDosage: 1, stockStatus: 'Healthy' }
    ],
    triggerEmergency: () => {},
    logMedication: () => {},
    markPillTaken: () => {},
  });
}


function SeniorOSContent({ onClose }) {
  const { 
    fontSize, 
    highContrast, 
    increaseFont, 
    decreaseFont, 
    toggleHighContrast, 
    themeStyles, 
    getResponsiveStyle 
  } = useAccessibility();

  const { liveState, triggerEmergency, medHistory } = useCardiacData();

  // Tab Selection: 'health' | 'voice' | 'schemes' | 'caregiver'
  const [activeTab, setActiveTab] = useState('health');

  // Caregiver alerts state
  const [alerts, setAlerts] = useState([]);
  
  // Last voice result passed to companion chatbot
  const [lastVoiceResult, setLastVoiceResult] = useState(null);

  // Simulated countdown for emergency override
  const [countdown, setCountdown] = useState(10);
  const [rescueDispatched, setRescueDispatched] = useState(false);

  // Monitor the global cardiac emergency state
  useEffect(() => {
    let interval = null;
    if (liveState.emergency_active) {
      setCountdown(10);
      setRescueDispatched(false);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setRescueDispatched(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(10);
      setRescueDispatched(false);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveState.emergency_active]);

  // Sync rescue dispatch alert to caregiver relay
  useEffect(() => {
    if (rescueDispatched && liveState.emergency_active) {
      const emergencyAlert = {
        id: Date.now() + 99,
        urgency_level: 'CRITICAL',
        caregiver_notification: {
          summary: "🚨 AUTONOMOUS RESCUE DISPATCHED: UberMedic En Route to Apollo Hospitals.",
          recommended_action: "Vehicle: White Innova TS-09-ER-4092. ETA: 4 Mins.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      };
      setAlerts(prev => {
        // avoid duplicates
        if (prev.some(a => a.caregiver_notification.summary.includes('AUTONOMOUS RESCUE'))) return prev;
        return [emergencyAlert, ...prev];
      });
    }
  }, [rescueDispatched, liveState.emergency_active]);

  // Handle intent routing
  const handleIntentRouted = (result) => {
    setLastVoiceResult(result);
    setActiveTab('voice'); // Switch to Chat tab when speaking to the bot

    if (result.intent_category === 'EMERGENCY_OVERRIDE') {
      triggerEmergency(true);
      if (result.caregiver_notification) {
        const newAlert = {
          id: Date.now(),
          urgency_level: result.urgency_level,
          caregiver_notification: result.caregiver_notification
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    } else if (result.intent_category === 'CAREGIVER_RELAY') {
      if (result.caregiver_notification) {
        const newAlert = {
          id: Date.now(),
          urgency_level: result.urgency_level,
          caregiver_notification: result.caregiver_notification
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }
  };

  const handleAcknowledgeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleSendQueryDirectly = (queryText) => {
    // Treat query as a parsed voice transcript
    const VoiceIntentEngineModule = require('./VoiceIntentEngine');
    const result = VoiceIntentEngineModule.parseVoiceIntent(queryText);
    handleIntentRouted(result);
  };

  // Generate ER Dossier
  const handleGenerateERDossier = async () => {
    const timeOccurred = new Date().toLocaleTimeString();
    const html = `
      <div style="padding:40px; font-family:Helvetica; color:#0f172a; background:#ffffff;">
        <div style="border-bottom: 4px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color:#b91c1c; margin:0;">Corassist Senior OS - ER Intake Dossier</h1>
          <p style="color:#64748b; font-size:14px; margin-top:5px;">Generated in Senior OS Emergency Intercept Mode</p>
        </div>
        <h2>Patient Demographics</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom: 30px;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Name:</strong> Jane Doe</td>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>ID:</strong> SENIOR-4092</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Age:</strong> 68</td>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Blood Type:</strong> O Positive</td>
          </tr>
        </table>
        <h2>Critical Incident Telemetry</h2>
        <div style="background:#fef2f2; border-left: 5px solid #ef4444; padding:20px; margin-bottom: 30px;">
          <p><strong>Incident Time:</strong> ${timeOccurred}</p>
          <p><strong>Heart Rate:</strong> ${liveState.hr || 'N/A'} BPM</p>
          <p><strong>Stability Index:</strong> ${liveState.stability || 'N/A'}%</p>
          <p><strong>Alert level:</strong> ${liveState.alert_level || 'Critical'}</p>
        </div>
        <h2>Medical History Summary</h2>
        <p>• Diagnosed with Hypertension and Cardiac Insufficiency.</p>
        <p>• Recent meds intake logged on Pill-Vision™ system.</p>
      </div>`;
    
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      alert("ER Dossier Generation Failed");
    }
  };

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: themeStyles.background }]}>
      
      {/* FLOATING TOP ACCESSIBILITY PANEL */}
      <View style={[styles.accessBar, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
        <View style={styles.branding}>
          <MaterialIcons name="security" size={24} color={themeStyles.primary} />
          <Text style={[getResponsiveStyle(14), { fontWeight: '950', color: themeStyles.text, marginLeft: 6 }]}>
            CORASSIST SENIOR OS
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlBtn, { borderColor: themeStyles.border }]} onPress={decreaseFont}>
            <Text style={{ fontSize: 14, color: themeStyles.text, fontWeight: 'bold' }}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { borderColor: themeStyles.border }]} onPress={increaseFont}>
            <Text style={{ fontSize: 18, color: themeStyles.text, fontWeight: 'bold' }}>A+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtnContrast, { borderColor: themeStyles.border, backgroundColor: themeStyles.primary }]} onPress={toggleHighContrast}>
            <MaterialIcons name="contrast" size={16} color={highContrast ? "#000" : "#FFF"} />
            <Text style={{ fontSize: 11, color: highContrast ? "#000" : "#FFF", fontWeight: 'bold', marginLeft: 4 }}>THEME</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity style={[styles.controlBtn, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* JUDGE LIVE DEMO CONTROLS PANEL */}
      <SeniorOSDemoSuite onDemoTriggered={handleIntentRouted} />

      {/* PERSISTENT WEB-SPEECH CONTROLLER */}
      <View style={{ paddingHorizontal: 15 }}>
        <VoiceIntentEngine onIntentRouted={handleIntentRouted} addNotification={(n) => setAlerts(prev => [n, ...prev])} />
      </View>

      {/* CORE VIEW BODY */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'health' && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Telemetry Panel */}
            <View style={[styles.telemetryCard, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="favorite" size={24} color="#ef4444" />
                <Text style={[getResponsiveStyle(16), { fontWeight: '900', color: themeStyles.text, marginLeft: 6 }]}>
                  Jane{"'"}s Telemetry Guard
                </Text>

              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricBlock}>
                  <Text style={[getResponsiveStyle(11), { color: themeStyles.textMuted }]}>HEART RATE</Text>
                  <Text style={[getResponsiveStyle(26), { fontWeight: '950', color: liveState.alert_level === 'Critical' ? '#ef4444' : themeStyles.accent }]}>
                    {liveState.hr || 72} <Text style={{ fontSize: 14 }}>BPM</Text>
                  </Text>
                </View>

                <View style={styles.metricBlock}>
                  <Text style={[getResponsiveStyle(11), { color: themeStyles.textMuted }]}>LYAPUNOV STABILITY</Text>
                  <Text style={[getResponsiveStyle(26), { fontWeight: '950', color: themeStyles.accent }]}>
                    {liveState.stability || 74}%
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBanner, { backgroundColor: liveState.alert_level === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderColor: liveState.alert_level === 'Critical' ? '#ef4444' : '#10b981' }]}>
                <View style={[styles.statusDot, { backgroundColor: liveState.alert_level === 'Critical' ? '#ef4444' : '#10b981' }]} />
                <Text style={[getResponsiveStyle(13), { fontWeight: '900', color: liveState.alert_level === 'Critical' ? '#ef4444' : '#10b981', marginLeft: 8 }]}>
                  HEALTH STATUS: {liveState.alert_level === 'Critical' ? 'CRITICAL DISTRESS' : 'STABLE & NORMAL'}
                </Text>
              </View>
            </View>

            {/* Read-only existing fail-safe description */}
            <View style={[styles.descriptionCard, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
              <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.text, marginBottom: 6 }]}>
                🛡️ Continuous Protection Protocol
              </Text>
              <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted }]}>
                If your heart stability drops below safe margins, the system triggers a 10-second fail-safe countdown. You can cancel it if you are okay, otherwise an autonomous medical ambulance is dispatched.
              </Text>
              
              <TouchableOpacity 
                style={[styles.sosManualBtn, { backgroundColor: '#ef4444' }]} 
                onPress={() => triggerEmergency(true)}
              >
                <MaterialIcons name="warning" size={24} color="#FFF" />
                <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: '#FFF', marginLeft: 8 }]}>
                  TRIGGER SOS MANUAL ALARM
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {activeTab === 'voice' && (
          <SeniorCompanionChat lastVoiceResult={lastVoiceResult} onSendQuery={handleSendQueryDirectly} />
        )}

        {activeTab === 'schemes' && (
          <SeniorServicesHub />
        )}

        {activeTab === 'caregiver' && (
          <CaregiverRelayHub alerts={alerts} onAcknowledgeAlert={handleAcknowledgeAlert} />
        )}
      </View>

      {/* EMERGENCY INTERCEPT COUNTDOWN OVERLAY */}
      {liveState.emergency_active && (
        <View style={styles.emergencyOverlay}>
          <View style={styles.emergencyContainer}>
            <MaterialIcons name="warning" size={80} color="#FFF" style={styles.alertIconPulse} />
            <Text style={styles.emergencyTitle}>CRITICAL RISK INTERCEPT</Text>
            
            {rescueDispatched ? (
              <View style={styles.rescueCard}>
                <Text style={styles.rescueHeader}>🚨 AUTONOMOUS RESCUE DISPATCHED</Text>
                <Text style={styles.rescueText}>Provider: UberMedic / Apollo Transport</Text>
                <Text style={styles.rescueText}>Vehicle: White Innova TS-09-ER-4092</Text>
                <Text style={styles.rescueText}>ETA: 4 Minutes</Text>
                
                <TouchableOpacity 
                  style={styles.dossierBtn} 
                  onPress={handleGenerateERDossier}
                >
                  <MaterialIcons name="picture-as-pdf" size={22} color="#000" />
                  <Text style={styles.dossierBtnText}>GENERATE ER DOSSIER PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => triggerEmergency(false)}
                >
                  <Text style={styles.cancelBtnText}>DISMISS ALARM / RECOVERY</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <Text style={styles.emergencySub}>Starting Dispatch In:</Text>
                <Text style={styles.countdownTimer}>{countdown}s</Text>
                
                <TouchableOpacity 
                  style={styles.confirmDispatchBtn} 
                  onPress={() => setRescueDispatched(true)}
                >
                  <Text style={styles.confirmDispatchText}>DISPATCH RESCUE IMMEDIATELY</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dismissBigBtn} 
                  onPress={() => triggerEmergency(false)}
                >
                  <Text style={styles.dismissBigText}>I AM OKAY - CANCEL DISPATCH</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ACCESS-OPTIMIZED BOTTOM NAVIGATION BAR (>= 60x60 touch target, large icon/text labels) */}
      <View style={[styles.navBar, { backgroundColor: themeStyles.cardBackground, borderTopColor: themeStyles.border }]}>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'health' && { backgroundColor: themeStyles.background }]} 
          onPress={() => setActiveTab('health')}
        >
          <MaterialIcons name="favorite" size={26} color={activeTab === 'health' ? themeStyles.accent : themeStyles.textMuted} />
          <Text style={[getResponsiveStyle(10), { fontWeight: '950', color: activeTab === 'health' ? themeStyles.accent : themeStyles.textMuted, marginTop: 4 }]}>
            Health Guard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'voice' && { backgroundColor: themeStyles.background }]} 
          onPress={() => setActiveTab('voice')}
        >
          <MaterialIcons name="keyboard-voice" size={26} color={activeTab === 'voice' ? themeStyles.accent : themeStyles.textMuted} />
          <Text style={[getResponsiveStyle(10), { fontWeight: '955', color: activeTab === 'voice' ? themeStyles.accent : themeStyles.textMuted, marginTop: 4 }]}>
            Voice Bot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'schemes' && { backgroundColor: themeStyles.background }]} 
          onPress={() => setActiveTab('schemes')}
        >
          <MaterialIcons name="verified-user" size={26} color={activeTab === 'schemes' ? themeStyles.accent : themeStyles.textMuted} />
          <Text style={[getResponsiveStyle(10), { fontWeight: '955', color: activeTab === 'schemes' ? themeStyles.accent : themeStyles.textMuted, marginTop: 4 }]}>
            Welfare Aid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'caregiver' && { backgroundColor: themeStyles.background }]} 
          onPress={() => setActiveTab('caregiver')}
        >
          <MaterialIcons name="family-restroom" size={26} color={activeTab === 'caregiver' ? themeStyles.accent : themeStyles.textMuted} />
          {alerts.length > 0 && <View style={styles.alertCounter} />}
          <Text style={[getResponsiveStyle(10), { fontWeight: '955', color: activeTab === 'caregiver' ? themeStyles.accent : themeStyles.textMuted, marginTop: 4 }]}>
            Family Portal
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function SeniorOSMainView({ onClose = undefined } = {}) {
  return (
    <SeniorAccessibilityProvider>
      <SeniorOSContent onClose={onClose} />
    </SeniorAccessibilityProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  accessBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnContrast: {
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContentContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  telemetryCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricBlock: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  descriptionCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 15,
  },
  sosManualBtn: {
    height: 60, // Minimum 60px target
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    height: Platform.OS === 'ios' ? 95 : 85,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    paddingTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  alertCounter: {
    position: 'absolute',
    top: 6,
    right: '35%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  emergencyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(220, 38, 38, 0.98)', // Red takeover
    zIndex: 10000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emergencyContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  alertIconPulse: {
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  emergencySub: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 15,
  },
  countdownTimer: {
    fontSize: 84,
    fontWeight: '950',
    color: '#FFF',
    marginVertical: 10,
  },
  confirmDispatchBtn: {
    backgroundColor: '#FFF',
    width: '100%',
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  confirmDispatchText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dismissBigBtn: {
    borderWidth: 2,
    borderColor: '#FFF',
    width: '100%',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dismissBigText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  rescueCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    marginTop: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  rescueHeader: {
    color: '#ef4444',
    fontWeight: '950',
    fontSize: 14,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  rescueText: {
    color: '#1e293b',
    fontWeight: '800',
    fontSize: 14,
    marginVertical: 3,
  },
  dossierBtn: {
    backgroundColor: '#FFD700',
    height: 55,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  dossierBtnText: {
    color: '#000',
    fontWeight: '950',
    fontSize: 13,
    marginLeft: 6,
  },
  cancelBtn: {
    backgroundColor: '#0f172a',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
  },
});
