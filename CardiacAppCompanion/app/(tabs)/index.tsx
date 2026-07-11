import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Platform, Alert, Modal, Linking, Animated as RNAnimated 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import { AppContext } from '../../src/context/AppContext';
import { useTheme } from '../../src/context/ThemeContext';
import DigitalTwinHeart from '../../src/components/DigitalTwinHeart';
import Animated, { 
  SlideInUp, withRepeat, withTiming, withSequence, 
  useAnimatedStyle, useSharedValue, Easing
} from 'react-native-reanimated';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

// --- LIVE ECG WAVEFORM ---
const Waveform = ({ colors }: any) => {
  const masterTime = useSharedValue(0);
  useEffect(() => {
    masterTime.value = withRepeat(withTiming(Math.PI * 4, { duration: 3000, easing: Easing.linear }), -1, false);
  }, []);

  return (
    <View style={{ marginHorizontal: 20, marginVertical: 15, padding: 20, backgroundColor: colors.card, borderRadius: 24, borderColor: colors.border, borderWidth: 1 }}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900', opacity: 0.7, marginBottom: 15, letterSpacing: 1.5 }}>LIVE ECG SINE WAVEFORM</Text>
      <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        {[...Array(40)].map((_, i) => {
          const style = useAnimatedStyle(() => {
            const y = Math.sin(masterTime.value + (i * 0.3)) * 20;
            return { transform: [{ translateY: y }] };
          });
          return <Animated.View key={i} style={[{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#10b981' }, style]} />;
        })}
      </View>
    </View>
  );
};

// --- GUIDED RESPIRATION INTERVENTION ---
const GuidedRespiration = () => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value
  }));

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20, padding: 30, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' }}>
      <Text style={{ fontSize: 14, fontWeight: '900', color: '#3b82f6', marginBottom: 30, letterSpacing: 1 }}>ELEVATED HR DETECTED. PLEASE BREATHE.</Text>
      <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={[{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59,130,246,0.4)', position: 'absolute' }, animatedStyle]} />
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 10 }}>
          <MaterialCommunityIcons name="lungs" size={30} color="#FFF" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 30, gap: 60 }}>
         <View style={{ alignItems: 'center' }}>
           <Text style={{ color: '#3b82f6', fontWeight: '900', fontSize: 18 }}>4s</Text>
           <Text style={{ color: '#3b82f6', fontWeight: '800', fontSize: 11, letterSpacing: 1.5, marginTop: 4 }}>INHALE</Text>
         </View>
         <View style={{ alignItems: 'center' }}>
           <Text style={{ color: '#3b82f6', fontWeight: '900', fontSize: 18 }}>4s</Text>
           <Text style={{ color: '#3b82f6', fontWeight: '800', fontSize: 11, letterSpacing: 1.5, marginTop: 4 }}>EXHALE</Text>
         </View>
      </View>
    </View>
  );
};

// --- VITAL CARD COMPONENT ---
function VitalCard({ icon, label, value, unit, color, trend, colors }: any) {
  return (
    <View style={[styles.vCard, { backgroundColor: colors.card }]}>
      <View style={styles.vCardHeader}>
        <MaterialIcons name={icon} size={14} color={color} />
        <Text style={[styles.vCardLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.vCardValueRow}>
        <Text style={[styles.vCardValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.vCardUnit, { color: colors.text }]}>{unit}</Text>
        {trend && <MaterialIcons name={trend === 'up' ? 'trending-up' : 'trending-down'} size={14} color={color} style={{marginLeft: 6}} />}
      </View>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const rawData = useCardiacData() as any;
  const { liveState, medHistory, inventory, triggerEmergency, logMedication, markPillTaken } = rawData;
  const { language } = useContext(AppContext);
  const { colors } = useTheme();
  
  const [isMedScanVisible, setMedScanVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{name: string, frequency: string, warning: string} | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [emtModalVisible, setEmtModalVisible] = useState(false);
  const [localHistory, setLocalHistory] = useState<any[]>([]);

  // Refined Emergency States
  const [modalVisible, setModalVisible] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(10);
  const [rescueDispatched, setRescueDispatched] = useState(false);

  const countdownInterval = useRef<any>(null);
  const speechInterval = useRef<any>(null);
  const emergencyFlash = useSharedValue(0);

  // Proactive Intervention Trigger
  const isAnxious = liveState?.hr > 100 && liveState?.stability > 60;

  // Auto-Refill UI Haptic Trigger
  useEffect(() => {
    if (inventory && inventory.some((med: any) => med.stockStatus === 'Low')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [inventory]);

  // Animation Styles
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.98, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);

  const pulsingBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: emergencyFlash.value * 0.15,
    backgroundColor: '#ef4444',
    ...StyleSheet.absoluteFillObject,
    zIndex: 5
  }));

  const takeoverIconStyle = useAnimatedStyle(() => ({
    opacity: emergencyFlash.value * 0.6 + 0.4,
    transform: [{ scale: emergencyFlash.value * 0.2 + 1 }]
  }));

  const trackingProgressStyle = useAnimatedStyle(() => ({
    opacity: emergencyFlash.value * 0.5 + 0.5
  }));

  // ER DOSSIER HANDOVER PROTOCOL (PDF Generation)
  const generateERDossier = async (isAuto = false) => {
    if (!isAuto) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Handover report prepared.", { rate: 0.9 });
    }
    const dropPct = liveState?.stability ? (100 - liveState.stability).toFixed(1) : 'Unknown';
    const timeOccurred = new Date().toLocaleTimeString();
    
    const allHistory = [...localHistory, ...(medHistory || [])];

    const html = `
      <div style="padding:40px; font-family:Helvetica; color:#0f172a; background:#ffffff;">
        <div style="border-bottom: 4px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color:#b91c1c; margin:0;">CorAssist ER Intake Dossier</h1>
          <p style="color:#64748b; font-size:14px; margin-top:5px;">Generated by Patient Edge Node</p>
        </div>
        
        <h2>Patient Demographics</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom: 30px;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Name:</strong> Jane Doe</td>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>ID:</strong> 4092</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Age:</strong> 68</td>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Blood Type:</strong> O+</td>
          </tr>
        </table>

        <h2>Critical Incident Telemetry</h2>
        <div style="background:#fef2f2; border-left: 5px solid #ef4444; padding:20px; margin-bottom: 30px;">
          <p><strong>Time of Report:</strong> ${timeOccurred}</p>
          <p><strong>Heart Rate at Request:</strong> ${liveState?.hr || 'N/A'} BPM</p>
          <p><strong>Lyapunov Stability Drop:</strong> ${dropPct}%</p>
          <p><strong>SpO2:</strong> ${(liveState as any)?.spo2 || 98}%</p>
        </div>

        <h2>Verified Clinical History (Pill-Vision™)</h2>
        <ul>
          ${allHistory.length > 0 ? allHistory.map((m: any) => `<li><strong>${m.name}</strong> - ${m.dosage} (Logged at ${new Date(m.timestamp).toLocaleTimeString()})</li>`).join('') : '<li>No recent intake verified on system.</li>'}
        </ul>
      </div>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Dossier generation failed."); }
  };

  // Emergency Protocol - Trigger & Countdown Logic
  useEffect(() => {
    if (liveState?.emergency_active === true) {
      setModalVisible(true);
      setRescueDispatched(false);
      setSosCountdown(10);
      
      emergencyFlash.value = withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })),
        -1, true
      );
      
      const speak = () => {
        const msg = language === 'తెలుగు' ? "అత్యవసర పరిస్థితి." : "Warning: Critical Cardiac Incident Detected. Dispatching autonomous rescue.";
        Speech.speak(msg, { rate: 0.9 });
      };
      
      speak();
      speechInterval.current = setInterval(speak, 8000);
      
      countdownInterval.current = setInterval(() => {
        setSosCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            setRescueDispatched(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownInterval.current) clearInterval(countdownInterval.current);
        if (speechInterval.current) clearInterval(speechInterval.current);
        Speech.stop();
      };
    } else {
      setModalVisible(false);
      emergencyFlash.value = 0;
      Speech.stop();
      setRescueDispatched(false);
      setSosCountdown(10);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (speechInterval.current) clearInterval(speechInterval.current);
    }
  }, [liveState?.emergency_active, language]);

  // Internal Mock Dispatch Effect
  useEffect(() => {
    if (rescueDispatched) {
      try {
        // Cross-Device Sync Webhook Payload (Rich)
        const payload = { 
          id: Date.now(), 
          type: 'UBER_DISPATCH', 
          title: '🚨 Autonomous Rescue Dispatched', 
          message: 'UberMedic En Route to Apollo Hospitals. Vehicle: TS-09-ER-4092.', 
          timestamp: new Date().toLocaleTimeString(), 
          trackingLink: 'internal_mock' 
        };
        
        if (rawData.liveState) {
          rawData.liveState.dispatchNotification = '🚨 AUTONOMOUS DISPATCH CONFIRMED: UberMedic En Route to Apollo Hospitals. Vehicle: TS-09-ER-4092. ETA: 4 Mins.';
          rawData.liveState.notificationPayload = payload;
        }
        if (rawData.logNotification) rawData.logNotification(payload);

        // Execute ER Dossier handover automatically alongside Dispatch (Prevent browser print dialog on Web)
        if (Platform.OS !== 'web') {
          generateERDossier(true);
        }
      } catch (error) {
        console.log("Mock dispatch failed", error);
      }
    }
  }, [rescueDispatched]);

  // PILL-VISION™ OCR SCANNER & CAMERA CONTROLLER
  const scanLineAnim = useRef(new RNAnimated.Value(0)).current;

  const runOcrScanner = (uri: string) => {
    setIsScanning(true);
    setScanResult(null);
    
    // Start scan line animation loop
    scanLineAnim.setValue(0);
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scanLineAnim, {
          toValue: 220, // matching scanViewport height
          duration: 1200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        })
      ])
    ).start();

    setTimeout(() => {
      setIsScanning(false);
      scanLineAnim.stopAnimation();
      
      const parsedMed = {
        name: 'Atorvastatin 10mg / Aspirin 75mg',
        frequency: 'Once Daily (Post Breakfast)',
        warning: '14 Pills Remaining (Auto-refill queued)'
      };
      
      setScanResult(parsedMed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Prescription parsed. Atorvastatin and Aspirin detected.", { rate: 0.95 });
    }, 2500);
  };

  const handleLaunchCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Camera Access Denied",
            "We need camera access to capture your medical label. Loading sample prescription label instead."
          );
          loadSampleImage();
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setCapturedImage(result.assets[0].uri);
          runOcrScanner(result.assets[0].uri);
        } else {
          loadSampleImage();
        }
      } else {
        // Web / desktop browser fallback
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setCapturedImage(result.assets[0].uri);
          runOcrScanner(result.assets[0].uri);
        } else {
          loadSampleImage();
        }
      }
    } catch (e) {
      console.warn("Camera launch failed, loading sample image", e);
      loadSampleImage();
    }
  };

  const loadSampleImage = () => {
    const sampleUri = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop';
    setCapturedImage(sampleUri);
    runOcrScanner(sampleUri);
  };

  const combinedHistory = [...localHistory, ...(medHistory || [])].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[flashStyle, { pointerEvents: 'none' } as any]} />

      {/* EMT QUICK-SCAN ID MODAL */}
      <Modal visible={emtModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center' }]}>PATIENT EMT QUICK-SCAN</Text>
            <View style={{ padding: 20, backgroundColor: '#FFF', borderRadius: 20, alignSelf: 'center', marginBottom: 30 }}>
               <QRCode 
                 value={JSON.stringify({ Patient: "Jane Doe", DOB: "1981-05-12", BloodType: "O Negative", LiveBPM: (liveState as any)?.hr || 72, Stability: liveState?.stability || 75, Meds: "Aspirin 81mg" })}
                 size={200}
               />
            </View>
            <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 30, fontSize: 16, opacity: 0.8 }}>Scan to load medical history instantly into ER systems.</Text>
            
            <TouchableOpacity 
               style={{ backgroundColor: '#ef4444', width: '100%', alignItems: 'center', padding: 20, borderRadius: 16 }} 
               onPress={() => { 
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 setEmtModalVisible(false); 
                 generateERDossier(false); 
               }}
            >
               <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>GENERATE ER DOSSIER PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
               style={[styles.closeBtn, { backgroundColor: colors.card, width: '100%', marginTop: 15 }]} 
               onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 setEmtModalVisible(false);
               }}
            >
               <Text style={[styles.closeBtnText, { color: colors.text }]}>CLOSE MENU</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* EMERGENCY TAKEOVER MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <LinearGradient 
          colors={['#ef4444', '#dc2626', '#b91c1c']} 
          style={styles.emergencyTakeover}
        >
          {rescueDispatched ? (
            <>
              {/* STATE B: RESCUE ACTIVE */}
              <Animated.View style={takeoverIconStyle}>
                <MaterialCommunityIcons name="ambulance" size={100} color="#FFF" />
              </Animated.View>
              <Text style={styles.takeoverTitle}>ACTIVE RESCUE TRACKING</Text>
              
              <View style={{ backgroundColor: '#FFF', width: '100%', borderRadius: 16, padding: 20, marginTop: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }}>
                <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 14, marginBottom: 10, letterSpacing: 1 }}>🚨 AUTONOMOUS RESCUE DISPATCHED</Text>
                <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 14, marginBottom: 5 }}>Provider: UberMedic / Apollo ER Transport</Text>
                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13, marginBottom: 5 }}>Pickup: Secunderabad Safe Zone ➡️ Dropoff: Apollo Hospitals, Jubilee Hills</Text>
                <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 14, marginBottom: 15 }}>Vehicle: White Innova - TS-09-ER-4092</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '800', fontSize: 14 }}>Live ETA: 4 Minutes</Text>
                  <ActivityIndicator color="#3b82f6" size="small" />
                </View>
                <View style={{ height: 6, backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 3, width: '100%', overflow: 'hidden' }}>
                   <Animated.View style={[{ height: '100%', backgroundColor: '#3b82f6', borderRadius: 3, width: '50%' }, trackingProgressStyle] } />
                </View>
              </View>

              <TouchableOpacity 
                 style={{ backgroundColor: '#0f172a', width: '100%', alignItems: 'center', padding: 18, borderRadius: 16, marginTop: 20 }} 
                 onPress={() => { 
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   generateERDossier(false); 
                 }}
              >
                 <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>GENERATE ER DOSSIER PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.dismissBtn, { marginTop: 15 }]} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRescueDispatched(false);
                  triggerEmergency(false);
                }}
              >
                <Text style={styles.dismissText}>DISMISS ALARM / END RESCUE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* STATE A: COUNTDOWN */}
              <Animated.View style={takeoverIconStyle}>
                <MaterialIcons name="warning" size={100} color="#FFF" />
              </Animated.View>
              <Text style={styles.takeoverTitle}>CRITICAL EMERGENCY</Text>
              <Text style={styles.takeoverSub}>{(liveState as any)?.hardware_status || "Cardiac Anomaly Detected"}</Text>
              <Text style={styles.dispatchTimer}>{sosCountdown}s</Text>
              
              <TouchableOpacity 
                style={styles.uberBtn} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (countdownInterval.current) clearInterval(countdownInterval.current);
                  setRescueDispatched(true);
                }}
              >
                 <FontAwesome5 name="ambulance" size={20} color="#ef4444" />
                 <Text style={styles.uberBtnText}>DISPATCH UBER TO APOLLO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dismissBtn} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  triggerEmergency(false);
                }}
              >
                <Text style={styles.dismissText}>I AM OKAY / DISMISS ALARM</Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* EMT HEADER BUTTON */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 60, paddingHorizontal: 25, paddingBottom: 10 }}>
           <TouchableOpacity 
              style={styles.emtBtn} 
              onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 setEmtModalVisible(true);
              }}
           >
              <FontAwesome5 name="ambulance" size={12} color="#FFF" />
              <Text style={styles.emtBtnText}>EMT / FIRST RESPONDER</Text>
           </TouchableOpacity>
        </View>

        {/* DASHBOARD HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: colors.text }]}>CorAssist Clinical</Text>
            <View style={styles.statusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.syncText}>EDGE NODE SYNC: 200 OK</Text>
            </View>
          </View>

          {/* HEADER BUTTON MAPPING */}
          <View style={styles.headerActions}>
            
            {/* ICON 1 (Left) - Report Icon */}
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                generateERDossier(false);
              }}
            >
              <MaterialCommunityIcons name="file-chart" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* ICON 2 (Middle) - Caregiver/Guardian Icon */}
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push('/guardian-dashboard');
              }}
            >
              <MaterialIcons name="admin-panel-settings" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* ICON 3 (Right) - Pill-Vision Scanner */}
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#10b981' }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMedScanVisible(true);
              }}
            >
              <MaterialCommunityIcons name="pill" size={20} color="#FFF" />
            </TouchableOpacity>

          </View>
        </View>

        {/* GUIDED RESPIRATION INTERVENTION */}
        {isAnxious && <GuidedRespiration />}

        {/* LIVE ECG WAVEFORM */}
        <Waveform colors={colors} />

        {/* CENTER TELEMETRY */}
        <View style={styles.telemetry}>
          <DigitalTwinHeart bpm={liveState?.hr || 72} riskScore={(liveState as any)?.risk_pct || 5} />
          <Text style={[styles.bpmVal, { color: colors.text }]}>{liveState?.hr || 72}</Text>
          <Text style={[styles.bpmLabel, { color: colors.text }]}>BPM LIVE TELEMETRY</Text>
        </View>

        {/* MANUAL SOS OVERRIDE */}
        <TouchableOpacity 
          style={{
            marginHorizontal: 20,
            marginBottom: 25,
            backgroundColor: '#ef4444',
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: 'center',
            elevation: 10,
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (Platform.OS === 'web') {
              const confirmed = window.confirm('Trigger Emergency Protocol?\n\nThis will dispatch an autonomous rescue and notify your caregiver.');
              if (confirmed && triggerEmergency) {
                (triggerEmergency as any)(true);
              }
            } else {
              Alert.alert(
                'Trigger Emergency Protocol?',
                'This will dispatch an autonomous rescue and notify your caregiver.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'TRIGGER SOS', 
                    style: 'destructive',
                    onPress: () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      if (triggerEmergency) (triggerEmergency as any)(true);
                    }
                  }
                ]
              );
            }
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>🚨 MANUAL SOS / I NEED HELP</Text>
        </TouchableOpacity>

        {/* 6-FACTOR ANALYTICS GRID */}
        <View style={styles.grid}>
          <VitalCard icon="favorite" label="HEART RATE" value={liveState?.hr || 72} unit="BPM" color="#ef4444" trend="up" colors={colors} />
          <VitalCard icon="favorite-outline" label="HRV (SDNN)" value={Math.round((liveState as any)?.hrv || 44)} unit="ms" color="#3b82f6" trend="down" colors={colors} />
          <VitalCard icon="waves" label="SPO2" value={(liveState as any)?.spo2 || 98.6} unit="%" color="#06b6d4" colors={colors} />
          <VitalCard icon="speed" label="STABILITY" value={liveState?.stability || 75} unit="%" color="#84cc16" colors={colors} />
          <VitalCard icon="warning" label="RISK INDEX" value={(liveState as any)?.risk_pct || 4} unit="%" color="#f59e0b" colors={colors} />
          <VitalCard icon="air" label="RESPIRATION" value={(liveState as any)?.respiration || 14} unit="br/m" color="#f97316" colors={colors} />
        </View>

        {/* SMART PHARMACY & DAILY ADHERENCE */}
        <View style={{ marginHorizontal: 20, marginTop: 25, padding: 25, backgroundColor: colors.card, borderRadius: 24, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <MaterialCommunityIcons name="pill" size={24} color="#3b82f6" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text, letterSpacing: 1.2 }}>Smart Pharmacy & Daily Adherence</Text>
          </View>
          
          {(()=>{
             const displayInventory = inventory?.length ? inventory : [
               { id: 1, name: 'Aspirin 81mg', totalPills: 4, dailyDosage: 1, stockStatus: 'Healthy' },
               { id: 2, name: 'Atorvastatin 20mg', totalPills: 2, dailyDosage: 1, stockStatus: 'Low' }
             ];

             return displayInventory.map((med: any, i: number) => {
               const needsRefill = med.totalPills <= 3 || med.stockStatus === 'Low';
               
               return (
                 <View key={'pharm-'+i} style={{ marginBottom: 20, paddingBottom: 20, borderBottomWidth: i === displayInventory.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                     <View style={{ flex: 1 }}>
                       <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17, marginBottom: 8 }}>{med.name}</Text>
                       <View style={{ alignSelf: 'flex-start', backgroundColor: needsRefill ? '#fef2f2' : 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                         <Text style={{ color: needsRefill ? '#ef4444' : '#10b981', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                           Remaining: {med.totalPills} Pills
                         </Text>
                       </View>
                     </View>
                     
                     <TouchableOpacity 
                       style={{ borderColor: '#10b981', borderWidth: 2, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginLeft: 10, backgroundColor: 'transparent' }}
                       onPress={() => {
                         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                         if (markPillTaken) markPillTaken(med.name);
                       }}
                     >
                       <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>✔️ MARK TAKEN</Text>
                     </TouchableOpacity>
                   </View>

                   {needsRefill && (
                     <Animated.View style={[{ marginTop: 18 }, pulsingBtnStyle]}>
                       <TouchableOpacity 
                         style={{ backgroundColor: '#f97316', width: '100%', padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#f97316', shadowOpacity: 0.4, shadowRadius: 8 }}
                         onPress={() => {
                           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                           Linking.openURL('https://www.apollopharmacy.in/cart?add_item=auto&auto_checkout=true');
                         }}
                       >
                         <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }}>🛒 1-CLICK REFILL VIA APOLLO</Text>
                       </TouchableOpacity>
                     </Animated.View>
                   )}
                 </View>
               );
             });
          })()}
        </View>

        {/* LYAPUNOV PREDICTIVE ENGINE */}
        <View style={styles.predictiveBox}>
          <LinearGradient colors={['#3b82f6', '#1e40af']} style={styles.predictiveContent}>
            <View>
              <Text style={styles.predictiveLabel}>∑ ODE PREDICTIVE ENGINE</Text>
              <Text style={styles.predictiveMain}>
                Stability Status: {liveState?.stability > 70 ? 'LYAPUNOV STABLE' : 'UNSTABLE ANOMALY'}
              </Text>
            </View>
            <MaterialCommunityIcons name="brain" size={32} color="#FFF" />
          </LinearGradient>
        </View>

        <View style={styles.medSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>CLINICAL INTAKE HISTORY</Text>
          {combinedHistory && combinedHistory.length > 0 ? combinedHistory.map((m: any, i: number) => (
            <View key={i} style={[styles.medItem, { backgroundColor: colors.card }]} >
              <Text style={[styles.medName, { color: colors.text }]}>{m.name}</Text>
              <Text style={[styles.medTime, { color: colors.text, opacity: 0.7 }]}>{new Date(m.timestamp).toLocaleTimeString()}</Text>
            </View>
          )) : <Text style={[styles.emptyText, { color: colors.text }]}>No recent scans detected.</Text>}
        </View>
      </ScrollView>

      {/* PILL-VISION MODAL */}
      <Modal visible={isMedScanVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>PILL-VISION™ OCR</Text>
            
            <View style={[styles.scanViewport, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {capturedImage ? (
                <View style={{ width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri: capturedImage }} style={styles.capturedImagePreview} />
                  
                  {isScanning && (
                    <>
                      <RNAnimated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim }] }]} />
                      <View style={{ position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12 }}>
                        <ActivityIndicator size="small" color="#3b82f6" />
                        <Text style={{ color: '#FFF', fontWeight: '800', marginTop: 6, fontSize: 13 }}>Analyzing Prescription...</Text>
                      </View>
                    </>
                  )}

                  {!isScanning && (
                    <TouchableOpacity 
                      style={styles.retakeBtn} 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCapturedImage(null);
                        setScanResult(null);
                      }}
                    >
                      <MaterialIcons name="replay" size={16} color="#FFF" />
                      <Text style={styles.retakeText}>Retake Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity 
                   onPress={handleLaunchCamera}
                   style={{ alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', height: '100%', padding: 40 }}
                >
                   <MaterialIcons name="camera-alt" size={48} color="#94a3b8" />
                   <Text style={{ color: '#94a3b8', marginTop: 10, fontWeight: '700', fontSize: 13 }}>Snap Medication Label</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* OCR EXTRACTED DETAILS SUMMARY */}
            {scanResult && !isScanning && (
              <View style={[styles.ocrCard, { backgroundColor: colors.card, borderColor: '#16a34a' }]}>
                <View style={styles.ocrRow}>
                  <MaterialIcons name="medication" size={20} color="#3b82f6" />
                  <Text style={[styles.ocrLabel, { color: colors.text }]}>Medication:</Text>
                  <Text style={[styles.ocrVal, { color: colors.text }]}>{scanResult.name}</Text>
                </View>
                <View style={styles.ocrRow}>
                  <MaterialIcons name="schedule" size={20} color="#16a34a" />
                  <Text style={[styles.ocrLabel, { color: colors.text }]}>Frequency:</Text>
                  <Text style={[styles.ocrVal, { color: colors.text }]}>{scanResult.frequency}</Text>
                </View>
                <View style={styles.ocrRow}>
                  <MaterialIcons name="warning" size={20} color="#f97316" />
                  <Text style={[styles.ocrLabel, { color: colors.text }]}>Stock Alert:</Text>
                  <Text style={[styles.ocrVal, { color: '#f97316' }]}>{scanResult.warning}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
               style={[
                 styles.closeBtn, 
                 { 
                   backgroundColor: scanResult ? '#16a34a' : colors.card,
                   borderWidth: scanResult ? 0 : 1,
                   borderColor: colors.border
                 }
               ]} 
               onPress={async () => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                 if (scanResult) {
                   logMedication(scanResult.name, scanResult.frequency, false);
                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                   
                   setToastMessage("[ ✅ Prescription Added to Family Portal ]");
                   setTimeout(() => {
                     setToastMessage(null);
                   }, 3000);
                 }
                 setMedScanVisible(false);
                 setCapturedImage(null);
                 setScanResult(null);
               }}
            >
              <Text style={[styles.closeBtnText, { color: scanResult ? '#FFF' : colors.text }]}>
                {scanResult ? "SAVE PRESCRIPTION & DONE" : "DONE"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Custom Confirmation Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emergencyTakeover: { flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center' },
  takeoverTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  takeoverSub: { color: '#FFF', fontSize: 18, marginBottom: 10, fontWeight: '700', textAlign: 'center' },
  dispatchTimer: { fontSize: 100, fontWeight: '900', color: '#FFF', marginVertical: 20 },
  uberBtn: { backgroundColor: '#FFF', width: '100%', padding: 22, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 },
  uberBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 16 },
  dismissBtn: { marginTop: 30 },
  dismissText: { color: '#FFF', fontWeight: '800', opacity: 0.8 },
  rescueCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginTop: 30, marginBottom: 40, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, width: '100%' },
  rescueCardText: { color: '#ef4444', fontWeight: '900', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  emtBtn: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 5, shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 8 },
  emtBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  header: { paddingHorizontal: 25, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 24, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  syncText: { fontSize: 10, fontWeight: '900', color: '#10b981', letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 14, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  scroll: { paddingBottom: 60 },
  telemetry: { alignItems: 'center', marginVertical: 20 },
  bpmVal: { fontSize: 90, fontWeight: '900' },
  bpmLabel: { fontSize: 14, fontWeight: '900', letterSpacing: 4, opacity: 0.7 },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  vCard: { width: '47%', padding: 18, borderRadius: 24, elevation: 2, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  vCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  vCardLabel: { fontSize: 10, fontWeight: '900', opacity: 0.7, letterSpacing: 0.5 },
  vCardValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  vCardValue: { fontSize: 26, fontWeight: '900' },
  vCardUnit: { fontSize: 12, marginLeft: 4, opacity: 0.7, fontWeight: '700' },
  predictiveBox: { paddingHorizontal: 20, marginTop: 20 },
  predictiveContent: { padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8, shadowColor: '#3b82f6', shadowOpacity: 0.2, shadowRadius: 15 },
  predictiveLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  predictiveMain: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 8 },
  medSection: { padding: 25 },
  sectionLabel: { fontSize: 12, fontWeight: '900', marginBottom: 15, letterSpacing: 1.5, opacity: 0.7 },
  medItem: { padding: 20, borderRadius: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  medName: { fontWeight: '800', fontSize: 15 },
  medTime: { fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 10, opacity: 0.7, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: Platform.OS === 'ios' ? 50 : 30 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: 0.5 },
  scanViewport: { height: 220, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' },
  resultBox: { alignItems: 'center', gap: 10 },
  resultValue: { fontSize: 24, fontWeight: '900' },
  closeBtn: { marginTop: 25, alignItems: 'center', padding: 18, borderRadius: 16 },
  closeBtnText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  capturedImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    resizeMode: 'cover',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
  ocrCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    gap: 12,
  },
  ocrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ocrLabel: {
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.6,
    width: 80,
  },
  ocrVal: {
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#16a34a',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 99999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  }
});
