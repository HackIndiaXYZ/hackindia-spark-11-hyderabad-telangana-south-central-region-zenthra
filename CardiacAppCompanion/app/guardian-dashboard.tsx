import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Modal, Linking, SafeAreaView, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useCardiacData } from '../src/context/CardiacDataContext';
import { useTheme } from '../src/context/ThemeContext';
import Animated, { 
  withRepeat, withTiming, withSequence, 
  useAnimatedStyle, useSharedValue 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function GuardianDashboard() {
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme() as any;
  const rawData = useCardiacData() as any;
  const { liveState, medHistory, triggerEmergency } = rawData;
  const [modalVisible, setModalVisible] = useState(false);
  const [addPatientModal, setAddPatientModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  
  const [fleet, setFleet] = useState([
    { id: '4092', name: 'Jane Doe', status: 'STABLE' }
  ]);

  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unread, setUnread] = useState(false);
  const [richPayload, setRichPayload] = useState<any>(null);

  useEffect(() => {
    if (rawData.liveState?.notificationPayload && rawData.liveState.notificationPayload.id !== richPayload?.id) {
      setRichPayload(rawData.liveState.notificationPayload);
      setUnread(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [rawData.liveState?.notificationPayload]);

  useEffect(() => {
    if (rawData.liveState?.dispatchNotification && rawData.liveState.dispatchNotification !== dispatchAlert) {
      setDispatchAlert(rawData.liveState.dispatchNotification);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [rawData.liveState?.dispatchNotification]);

  const carPulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (dispatchAlert) {
      carPulseOpacity.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1, true
      );
    }
  }, [dispatchAlert]);

  const carStyle = useAnimatedStyle(() => ({ opacity: carPulseOpacity.value }));

  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }), 
        withTiming(0.4, { duration: 800 })
      ), -1, true
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  useEffect(() => {
    if (liveState?.emergency_active) {
      setModalVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setModalVisible(false);
    }
  }, [liveState?.emergency_active]);

  const handleConnect = () => {
    if (!newPatientName) return Alert.alert("Error", "Enter patient name");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setAddPatientModal(false);
      setFleet(prev => [...prev, { id: Math.floor(Math.random() * 9000 + 1000).toString(), name: newPatientName, status: 'SYNCING' }]);
      setNewPatientName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  const generateDossier = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timeOccurred = new Date().toLocaleTimeString();
    
    const html = `
      <div style="padding:40px; font-family:Helvetica; color:#0f172a; background:#ffffff;">
        <div style="border-bottom: 4px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color:#b91c1c; margin:0;">Guardian Command: ER Intake Dossier</h1>
          <p style="color:#64748b; font-size:14px; margin-top:5px;">Secure Telemetry Handover</p>
        </div>
        
        <h2>Patient Demographics</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom: 30px;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>Name:</strong> Jane Doe</td>
            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>ID:</strong> 4092</td>
          </tr>
        </table>

        <h2>Live Telemetry Snapshot</h2>
        <div style="background:#fef2f2; border-left: 5px solid #ef4444; padding:20px; margin-bottom: 30px;">
          <p><strong>Snapshot Time:</strong> ${timeOccurred}</p>
          <p><strong>Heart Rate:</strong> ${liveState?.hr || 'N/A'} BPM</p>
          <p><strong>Lyapunov Stability:</strong> ${liveState?.stability || 0}%</p>
          <p><strong>SpO2:</strong> ${(liveState as any)?.spo2 || 98}%</p>
        </div>

        <h2>Verified Clinical History (Pill-Vision™)</h2>
        <ul>
          ${medHistory && medHistory.length > 0 ? medHistory.map((m: any) => `<li><strong>${m.name}</strong> - ${m.dosage} (Logged at ${new Date(m.timestamp).toLocaleTimeString()})</li>`).join('') : '<li>No recent intake verified on system.</li>'}
        </ul>
      </div>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Dossier generation failed."); }
  };

  const getBorderColor = (label: string, value: number) => {
    if (label === 'HEART RATE') return value > 100 || value < 50 ? '#ef4444' : '#10b981';
    if (label === 'STABILITY') return value < 70 ? '#ef4444' : '#10b981';
    if (label === 'SPO2') return value < 95 ? '#ef4444' : '#10b981';
    if (label === 'RISK INDEX') return value > 15 ? '#f59e0b' : '#10b981';
    return colors.border || 'rgba(150,150,150,0.1)';
  };

  const renderVitalCard = (icon: any, label: string, value: any, unit: string, iconColor: string) => {
    const numericVal = Number(value) || 0;
    const bColor = getBorderColor(label, numericVal);
    
    return (
      <View style={[styles.vCard, { backgroundColor: colors.card, borderColor: bColor }]}>
        <View style={styles.vCardHeader}>
          <MaterialIcons name={icon} size={16} color={iconColor} />
          <Text style={[styles.vCardLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <View style={styles.vCardValueRow}>
          <Text style={[styles.vCardValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.vCardUnit, { color: colors.text }]}>{unit}</Text>
        </View>
      </View>
    );
  };

  const showPredictiveWarning = liveState?.stability < 80 && !liveState?.emergency_active;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      {/* NOTIFICATION CENTER MODAL */}
      <Modal visible={notificationModalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={[styles.addModalContent, { backgroundColor: colors.background, padding: 25 }]}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                 <Text style={[styles.addModalTitle, { color: colors.text, marginBottom: 0 }]}>Notifications</Text>
                 <MaterialIcons name="notifications-active" size={24} color={colors.text} />
               </View>

               {richPayload ? (
                 richPayload.type === 'PHARMACY_ALERT' ? (
                   <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#f59e0b', marginBottom: 20 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                       <MaterialCommunityIcons name="pill" size={20} color="#f59e0b" />
                       <Text style={{ color: '#f59e0b', fontWeight: '900', fontSize: 16 }}>{richPayload.title || 'Medication Restock'}</Text>
                     </View>
                     <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 5 }}>
                       ⚠️ Supply Warning: Patient has exactly 3 days of {richPayload.medName || 'medication'} remaining.
                     </Text>
                     <Text style={{ color: colors.text, opacity: 0.6, fontSize: 12, marginBottom: 20 }}>
                       Received: {richPayload.timestamp || new Date().toLocaleTimeString()}
                     </Text>
                     
                     <TouchableOpacity 
                       style={{ backgroundColor: '#ef4444', width: '100%', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 10 }}
                       onPress={() => {
                         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                         Linking.openURL('https://pharmeasy.in/cart?add_item=aspirin81mg&caregiver_auth=true');
                       }}
                     >
                       <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }}>🛒 AUTHORIZE 1-CLICK REFILL</Text>
                     </TouchableOpacity>
                   </View>
                 ) : (
                   <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#f59e0b', marginBottom: 20 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                       <FontAwesome5 name="ambulance" size={20} color="#f59e0b" />
                       <Text style={{ color: '#f59e0b', fontWeight: '900', fontSize: 16 }}>{richPayload.title}</Text>
                     </View>
                     <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 5 }}>{richPayload.message}</Text>
                     <Text style={{ color: colors.text, opacity: 0.6, fontSize: 12, marginBottom: 20 }}>Received: {richPayload.timestamp}</Text>
                     
                     <View style={{ backgroundColor: colors.card, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                       <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 15, textAlign: 'center' }}>Patient is en route. ETA to Apollo ER: 4 Mins.</Text>
                       
                       <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 10 }}>
                         <View style={{ alignItems: 'center' }}>
                           <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6', marginBottom: 5 }} />
                           <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>Pickup</Text>
                         </View>
                         
                         <View style={{ flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 10, justifyContent: 'center' }}>
                           <Animated.View style={[{ position: 'absolute', alignSelf: 'center' }, carStyle]}>
                             <FontAwesome5 name="car-side" size={20} color="#f59e0b" style={{ transform: [{ translateY: -2 }] }} />
                           </Animated.View>
                         </View>
                         
                         <View style={{ alignItems: 'center' }}>
                           <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', marginBottom: 5 }} />
                           <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>Dropoff</Text>
                         </View>
                       </View>
                     </View>
                   </View>
                 )
               ) : (
                 <Text style={{ color: colors.text, opacity: 0.5, textAlign: 'center', marginVertical: 40, fontWeight: '700' }}>No new notifications.</Text>
               )}
               
               <View style={{ flexDirection: 'row', gap: 10 }}>
                 <TouchableOpacity 
                   style={[styles.closeModalBtn, { backgroundColor: colors.card, flex: 1, borderWidth: 1, borderColor: colors.border }]} 
                   onPress={() => {
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     setRichPayload(null);
                     setUnread(false);
                   }}
                 >
                    <Text style={[styles.closeModalText, { color: colors.text }]}>CLEAR ALL</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={[styles.closeModalBtn, { backgroundColor: '#3b82f6', flex: 1 }]} 
                   onPress={() => {
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     setNotificationModalVisible(false);
                   }}
                 >
                    <Text style={[styles.closeModalText, { color: '#FFF' }]}>CLOSE</Text>
                 </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      {/* ADD PATIENT MODAL */}
      <Modal visible={addPatientModal} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={[styles.addModalContent, { backgroundColor: colors.background }]}>
               <Text style={[styles.addModalTitle, { color: colors.text }]}>Add Patient Node</Text>
               <TextInput 
                 style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} 
                 placeholder="Patient Name (e.g. John Doe)" 
                 placeholderTextColor="#94a3b8"
                 value={newPatientName}
                 onChangeText={setNewPatientName}
               />
               <TextInput 
                 style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} 
                 placeholder="Hardware MAC Address" 
                 placeholderTextColor="#94a3b8"
               />
               
               <TouchableOpacity 
                 style={styles.connectBtn} 
                 onPress={handleConnect}
               >
                  {isConnecting ? <Text style={styles.connectBtnText}>Syncing with Patient...</Text> : <Text style={styles.connectBtnText}>CONNECT & SYNC</Text>}
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[styles.closeModalBtn, { backgroundColor: colors.card }]} 
                 onPress={() => {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   setAddPatientModal(false);
                 }}
               >
                  <Text style={[styles.closeModalText, { color: colors.text }]}>CANCEL</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* TACTICAL OVERRIDE MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <LinearGradient colors={['#ef4444', '#dc2626', '#b91c1c']} style={styles.overrideModal}>
          <MaterialIcons name="warning" size={120} color="#FFF" style={{ marginBottom: 20 }} />
          <Text style={styles.overrideTitle}>CRITICAL EMERGENCY</Text>
          <Text style={styles.overrideSub}>Jane Doe - Anomaly Detected</Text>
          
          <TouchableOpacity 
            style={styles.overrideBtnDeploy} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const url = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=Apollo%20Hospitals%20Jubilee%20Hills%20Hyderabad';
              Linking.openURL(url).catch(() => Alert.alert("Error", "Uber Dispatch Failed"));
            }}
          >
             <FontAwesome5 name="ambulance" size={24} color="#ef4444" />
             <Text style={styles.overrideBtnTextDeploy}>FORCE DISPATCH UBER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.overrideBtnCancel} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              triggerEmergency(false);
            }}
          >
            <MaterialIcons name="cancel" size={24} color="#FFF" />
            <Text style={styles.overrideBtnTextCancel}>STAND DOWN / FALSE ALARM</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Modal>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
             onPress={() => {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
               if (router.canGoBack()) {
                 router.back();
               } else {
                 router.replace('/');
               }
             }} 
             style={[styles.backBtn, { backgroundColor: colors.background }]}
          >
            <MaterialIcons name="arrow-back-ios" size={18} color={colors.text} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Guardian Command</Text>
          
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
             
             <TouchableOpacity 
               onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 setNotificationModalVisible(true);
                 setUnread(false);
               }} 
               style={[styles.backBtn, { backgroundColor: colors.background }]}
             >
               <MaterialIcons name="notifications-none" size={18} color={colors.text} />
               {unread && <View style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />}
             </TouchableOpacity>

             <TouchableOpacity 
               onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 if (toggleTheme) toggleTheme();
               }} 
               style={[styles.backBtn, { backgroundColor: colors.background }]}
             >
               <MaterialCommunityIcons name={theme === 'dark' ? "white-balance-sunny" : "moon-waning-crescent"} size={18} color={colors.text} />
             </TouchableOpacity>

             <TouchableOpacity 
               onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 router.push('/_(tabs)');
               }} 
               style={[styles.switchBtn, { backgroundColor: '#3b82f6' }]}
             >
               <Text style={styles.switchBtnText}>Patient View</Text>
             </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[styles.syncBadge, badgeStyle]}>
           <View style={styles.syncDot} />
           <Text style={styles.syncText}>LIVE SYNC: ACTIVE</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* FLEET SCALABILITY */}
        <Text style={[styles.sectionHeader, { color: colors.text, opacity: 0.7 }]}>MONITORED FLEET</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fleetScroll}>
           {fleet.map((patient, i) => (
             <View key={i} style={[styles.fleetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.fleetAvatar}>
                   <Text style={styles.fleetInitial}>{patient.name.substring(0,2).toUpperCase()}</Text>
                </View>
                <View>
                   <Text style={[styles.fleetName, { color: colors.text }]}>{patient.name} (ID: {patient.id})</Text>
                   <Text style={styles.fleetStatus}>● {patient.status}</Text>
                </View>
             </View>
           ))}
           <TouchableOpacity 
             style={[styles.fleetCard, { opacity: 0.6, backgroundColor: colors.card, borderColor: colors.border }]}
             onPress={() => {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
               setAddPatientModal(true);
             }}
           >
              <View style={[styles.fleetAvatar, { backgroundColor: '#334155' }]}>
                 <Text style={styles.fleetInitial}>+</Text>
              </View>
              <View>
                 <Text style={[styles.fleetName, { color: colors.text }]}>Add Patient Node</Text>
                 <Text style={[styles.fleetStatus, { color: '#94a3b8' }]}>Enroll Device</Text>
              </View>
           </TouchableOpacity>
        </ScrollView>

        {/* PREDICTIVE AI WARNING */}
        {showPredictiveWarning && (
          <View style={styles.predictiveWarning}>
             <MaterialIcons name="warning" size={24} color="#f59e0b" />
             <Text style={styles.predictiveText}>⚠️ AI PREDICTION: Lyapunov Stability trending downward. Projected critical threshold in 45 mins.</Text>
          </View>
        )}

        {/* GEOFENCE TRACKER */}
        <Text style={[styles.sectionHeader, { color: colors.text, opacity: 0.7 }]}>CONTEXT INTELLIGENCE</Text>
        <View style={[styles.geofenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.geoIconBox}>
             <MaterialCommunityIcons name="map-marker-radius" size={28} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
             <Text style={[styles.geoTitle, { color: colors.text }]}>📍 Last Known: Secunderabad Safe Zone</Text>
             <Text style={[styles.geoSub, { color: colors.text, opacity: 0.6 }]}>Distance: 2.4km | Device Battery: 88% | Sensor Sync: Excellent</Text>
          </View>
        </View>

        {/* LIVE DISPATCH NOTIFICATION */}
        {dispatchAlert && (
          <View style={{ marginTop: 25, marginHorizontal: 20 }}>
            <Text style={[styles.sectionHeader, { color: colors.text, opacity: 0.7, marginHorizontal: 0, marginTop: 0 }]}>LIVE DISPATCH TRACKING</Text>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', padding: 18, borderRadius: 20, borderWidth: 2, borderColor: '#f59e0b', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <Animated.View style={[{ backgroundColor: 'rgba(245,158,11,0.2)', padding: 12, borderRadius: 16 }, carStyle]}>
                <FontAwesome5 name="ambulance" size={24} color="#f59e0b" />
              </Animated.View>
              <Text style={{ flex: 1, color: '#f59e0b', fontWeight: '800', fontSize: 13, lineHeight: 20 }}>{dispatchAlert}</Text>
            </View>
          </View>
        )}

        {/* LIVE TELEMETRY */}
        <Text style={[styles.sectionHeader, { color: colors.text, opacity: 0.7 }]}>LIVE TELEMETRY (JANE DOE)</Text>
        <View style={styles.grid}>
          {renderVitalCard("favorite", "HEART RATE", liveState?.hr || 72, "BPM", "#ef4444")}
          {renderVitalCard("favorite-outline", "HRV (SDNN)", Math.round((liveState as any)?.hrv || 44), "ms", "#3b82f6")}
          {renderVitalCard("waves", "SPO2", (liveState as any)?.spo2 || 98.6, "%", "#06b6d4")}
          {renderVitalCard("speed", "STABILITY", liveState?.stability || 75, "%", "#10b981")}
          {renderVitalCard("warning", "RISK INDEX", (liveState as any)?.risk_pct || 4, "%", "#f59e0b")}
          {renderVitalCard("air", "RESPIRATION", (liveState as any)?.respiration || 14, "br/m", "#f97316")}
        </View>

        {/* MEDICATION ADHERENCE & SMS NUDGE */}
        <Text style={[styles.sectionHeader, { color: colors.text, opacity: 0.7 }]}>MEDICATION ADHERENCE</Text>
        <View style={styles.medContainer}>
          
          <View style={[styles.medRow, { backgroundColor: colors.card, borderColor: '#10b981' }]}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
               <MaterialIcons name="check-circle" size={24} color="#10b981" />
               <View>
                 <Text style={[styles.medName, { color: colors.text }]}>Aspirin 81mg</Text>
                 <Text style={[styles.medTime, { color: colors.text, opacity: 0.6 }]}>Taken at 09:15 AM</Text>
               </View>
             </View>
          </View>

          <View style={[styles.medRow, { backgroundColor: colors.card, borderColor: '#ef4444' }]}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
               <MaterialIcons name="cancel" size={24} color="#ef4444" />
               <View style={{ flex: 1 }}>
                 <Text style={[styles.medName, { color: colors.text }]}>Beta Blocker</Text>
                 <Text style={[styles.medTime, { color: '#ef4444', fontWeight: '900' }]}>MISSED</Text>
               </View>
             </View>
             <TouchableOpacity 
               style={styles.nudgeBtn} 
               onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                 Linking.openURL('sms:?body=CorAssist%20System%20Alert:%20Please%20take%20your%20scheduled%20medication%20immediately.');
               }}
             >
               <MaterialCommunityIcons name="message-alert" size={16} color="#FFF" />
               <Text style={styles.nudgeBtnText}>SEND NUDGE</Text>
             </TouchableOpacity>
          </View>

        </View>

        {/* DOSSIER EXPORT */}
        <TouchableOpacity 
           style={styles.exportBtn} 
           onPress={() => {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
             generateDossier();
           }}
        >
           <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
           <Text style={styles.exportBtnText}>GENERATE ER INTAKE DOSSIER</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: 20, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  switchBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  switchBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 15, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 },
  syncText: { color: '#10b981', fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  scroll: { paddingBottom: 50 },
  sectionHeader: { fontSize: 12, fontWeight: '900', letterSpacing: 2, paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  fleetScroll: { paddingHorizontal: 20 },
  fleetCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginRight: 15, borderWidth: 1, minWidth: 220 },
  fleetAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fleetInitial: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  fleetName: { fontWeight: '800', fontSize: 14, marginBottom: 4 },
  fleetStatus: { color: '#10b981', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  predictiveWarning: { marginHorizontal: 20, marginTop: 20, backgroundColor: 'rgba(245,158,11,0.1)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#f59e0b', flexDirection: 'row', alignItems: 'center', gap: 12 },
  predictiveText: { color: '#f59e0b', fontWeight: '800', fontSize: 12, flex: 1, lineHeight: 18 },
  geofenceCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1 },
  geoIconBox: { backgroundColor: 'rgba(59,130,246,0.15)', padding: 15, borderRadius: 20 },
  geoTitle: { fontWeight: '800', fontSize: 14, marginBottom: 5 },
  geoSub: { fontWeight: '600', fontSize: 12 },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  vCard: { width: '47%', padding: 18, borderRadius: 24, borderWidth: 2 },
  vCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  vCardLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  vCardValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  vCardValue: { fontSize: 26, fontWeight: '900' },
  vCardUnit: { fontSize: 12, marginLeft: 4, fontWeight: '800' },
  medContainer: { paddingHorizontal: 20, gap: 12 },
  medRow: { padding: 20, borderRadius: 20, borderWidth: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
  medTime: { fontWeight: '700', fontSize: 12 },
  nudgeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nudgeBtnText: { color: '#FFF', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
  exportBtn: { marginHorizontal: 20, marginTop: 40, backgroundColor: '#3b82f6', padding: 22, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 10, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 15 },
  exportBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  overrideModal: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  overrideTitle: { color: '#FFF', fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  overrideSub: { color: '#fca5a5', fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 50 },
  overrideBtnDeploy: { backgroundColor: '#FFF', width: '100%', padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, elevation: 20, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  overrideBtnTextDeploy: { color: '#ef4444', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  overrideBtnCancel: { width: '100%', padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20, borderWidth: 2, borderColor: '#FFF' },
  overrideBtnTextCancel: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  addModalContent: { padding: 30, borderRadius: 32, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  addModalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 25, textAlign: 'center' },
  input: { borderWidth: 1, padding: 18, borderRadius: 16, fontSize: 15, fontWeight: '600', marginBottom: 15 },
  connectBtn: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  connectBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  closeModalBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  closeModalText: { fontWeight: '900', fontSize: 14 }
});
