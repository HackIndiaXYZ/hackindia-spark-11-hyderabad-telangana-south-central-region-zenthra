import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, 
  Switch, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import { AppContext } from '../../src/context/AppContext';

const SimulatedSlider = ({ colors }: any) => (
  <View style={{ marginTop: 20, marginBottom: 10 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, opacity: 0.8 }}>ODE Engine Sensitivity (Threshold Tuning)</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: '#3b82f6' }}>85%</Text>
    </View>
    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, flexDirection: 'row', alignItems: 'center' }}>
       <View style={{ width: '85%', height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 }} />
       <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#3b82f6', marginLeft: -8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3 }} />
    </View>
  </View>
);

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme() as any;
  const router = useRouter();
  const rawData = useCardiacData() as any;
  const { triggerEmergency } = rawData;
  
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [simMode, setSimMode] = useState(true);
  const [pinRequired, setPinRequired] = useState(false);

  const [patientProfile, setPatientProfile] = useState({
    name: 'Jane Doe',
    age: '45',
    bloodType: 'O Negative'
  });

  const handleSaveProfile = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Patient Clinical Profile saved to Edge Node securely.");
  };

  const handleSyncContacts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSyncingContacts(true);
    setTimeout(() => {
      setSyncingContacts(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Synced", "Caregiver contacts successfully synchronized with hardware.");
    }, 1500);
  };

  const handleShareLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const mapUrl = "https://maps.apple.com/?ll=17.4411,78.3995&q=Patient+Safe+Zone";
    try {
      await Sharing.shareAsync(mapUrl, { dialogTitle: "Share Live Location" });
    } catch (e) {
      Alert.alert("Share Location", mapUrl);
    }
  };

  const handleForceAnomaly = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "SIMULATE ANOMALY",
      "Are you sure you want to force a hardware emergency? This will instantly trigger the SOS protocol.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "DEPLOY OVERRIDE", 
          style: "destructive", 
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (triggerEmergency) triggerEmergency(true);
            router.push('/_(tabs)');
          }
        }
      ]
    );
  };

  const handleHIPAA = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Export Requested", "A HIPAA-compliant data package is being compiled and will be emailed securely.");
  };

  const renderInput = (icon: any, value: string, onChange: (text: string) => void) => (
    <View style={styles.inputRow}>
      <View style={styles.inputIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.text} style={{ opacity: 0.6 }} />
      </View>
      <TextInput 
        style={[styles.inputBox, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
        value={value} 
        onChangeText={onChange}
        editable={false}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      <View style={{ marginBottom: 35 }}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>System Control</Text>
        <Text style={[styles.pageSub, { color: colors.text }]}>CorAssist OS • Edge Node Settings</Text>
      </View>

      {/* SECTION 1: PATIENT CLINICAL PROFILE */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>PATIENT CLINICAL PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderInput("account-outline", patientProfile.name, t => setPatientProfile({...patientProfile, name: t}))}
          {renderInput("calendar-blank-outline", patientProfile.age, t => setPatientProfile({...patientProfile, age: t}))}
          {renderInput("water-outline", patientProfile.bloodType, t => setPatientProfile({...patientProfile, bloodType: t}))}
          
          <View style={{ marginTop: 15, marginBottom: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <MaterialCommunityIcons name="medical-bag" size={20} color={colors.text} style={{ opacity: 0.6, width: 40, textAlign: 'center' }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, opacity: 0.8 }}>Past Medical History (PMH)</Text>
            </View>
            <View style={styles.pmhContainer}>
              <View style={styles.pmhBadge}><Text style={styles.pmhBadgeText}>Hypertension</Text></View>
              <View style={styles.pmhBadge}><Text style={styles.pmhBadgeText}>Prior Arrhythmia - 2024</Text></View>
              <View style={styles.pmhBadge}><Text style={styles.pmhBadgeText}>Type 2 Diabetes</Text></View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProfile}>
            <MaterialIcons name="save" size={18} color="#FFF" />
            <Text style={styles.btnPrimaryText}>SAVE PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 2: EMERGENCY CONTACTS & SOS PROTOCOL */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>EMERGENCY CONTACTS & SOS PROTOCOL</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {[
            { name: "Ram", rel: "Primary Caregiver", phone: "+91 98765 43210" },
            { name: "Dr. Sharma", rel: "Cardiologist", phone: "+91 91234 56789" },
            { name: "Apollo ER Desk", rel: "Hospital Response", phone: "+91 040 1234 5678" }
          ].map((c, i) => (
            <View key={i} style={[styles.contactRow, { borderBottomColor: colors.border, borderBottomWidth: i === 2 ? 0 : 1 }]}>
              <MaterialCommunityIcons name="shield-account" size={32} color="#3b82f6" />
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>{c.name} <Text style={{ opacity: 0.6, fontSize: 12 }}>({c.rel})</Text></Text>
                <Text style={[styles.contactPhone, { color: colors.text }]}>{c.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={styles.dialBtn}>
                 <MaterialCommunityIcons name="phone-outline" size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.btnSecondary} onPress={handleSyncContacts}>
            {syncingContacts ? <ActivityIndicator color="#3b82f6" size="small" /> : (
              <>
                <MaterialCommunityIcons name="cloud-sync" size={18} color="#3b82f6" />
                <Text style={styles.btnSecondaryText}>SYNC DEVICE CONTACTS</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnSecondary, { borderColor: '#10b981', marginTop: 10 }]} onPress={handleShareLocation}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#10b981" />
            <Text style={[styles.btnSecondaryText, { color: '#10b981' }]}>SHARE LIVE LOCATION LINK</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* SECTION 3: APP PREFERENCES & SECURITY */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SECURITY & PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.text} />
              <Text style={[styles.prefText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch 
              value={theme === 'dark'} 
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (toggleTheme) toggleTheme();
              }} 
              trackColor={{ true: '#3b82f6' }}
            />
          </View>

          <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="server-network" size={22} color={colors.text} />
              <Text style={[styles.prefText, { color: colors.text }]}>Live IoT Mode</Text>
            </View>
            <Switch 
              value={!simMode} 
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSimMode(!val);
              }} 
              trackColor={{ true: '#10b981', false: '#ef4444' }}
            />
          </View>

          <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
            <View style={styles.prefLeft}>
              <MaterialIcons name="fingerprint" size={22} color={colors.text} />
              <Text style={[styles.prefText, { color: colors.text }]}>Require Biometric Unlock</Text>
            </View>
            <Switch 
              value={pinRequired} 
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPinRequired(val);
              }} 
              trackColor={{ true: '#3b82f6' }}
            />
          </View>

          <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.border }]}>
            <MaterialIcons name="password" size={18} color={colors.text} />
            <Text style={[styles.btnSecondaryText, { color: colors.text }]}>UPDATE SECURITY PIN</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* SECTION 4: SYSTEM DIAGNOSTICS & ACCESS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SYSTEM DIAGNOSTICS & ACCESS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          <TouchableOpacity 
            style={[styles.btnPrimary, { marginBottom: 20 }]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/guardian-dashboard');
            }}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#FFF" />
            <Text style={styles.btnPrimaryText}>SWITCH TO GUARDIAN COMMAND CENTER</Text>
          </TouchableOpacity>

          <View style={styles.diagRow}>
            <View style={styles.diagLeft}>
              <MaterialCommunityIcons name="firebase" size={18} color="#f59e0b" />
              <Text style={[styles.diagText, { color: colors.text }]}>Firebase RTDB</Text>
            </View>
            <Text style={[styles.diagVal, { color: '#10b981' }]}>Connected</Text>
          </View>

          <View style={styles.diagRow}>
            <View style={styles.diagLeft}>
              <MaterialCommunityIcons name="server-network" size={18} color="#3b82f6" />
              <Text style={[styles.diagText, { color: colors.text }]}>Edge Node Latency</Text>
            </View>
            <Text style={[styles.diagVal, { color: colors.text }]}>14ms</Text>
          </View>

          <View style={styles.diagRow}>
            <View style={styles.diagLeft}>
              <MaterialCommunityIcons name="brain" size={18} color="#8b5cf6" />
              <Text style={[styles.diagText, { color: colors.text }]}>Lyapunov Engine</Text>
            </View>
            <Text style={[styles.diagVal, { color: '#10b981' }]}>Active</Text>
          </View>

          <SimulatedSlider colors={colors} />

        </View>
      </View>

      {/* SECTION 5: DEVELOPER DEMO TOOLS (FAILSAFES) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>DEMO FAILSAFES</Text>
        <View style={[styles.warningCard, { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.3)' }]}>
           
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }}>
             <MaterialIcons name="warning" size={24} color="#ef4444" />
             <Text style={styles.warningTitle}>Hardware Simulation Bypass</Text>
           </View>
           
           <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, opacity: 0.8, lineHeight: 20 }}>
             Use these commands if physical IoT sensors lose connection during the live pitch.
           </Text>
           
           <TouchableOpacity style={styles.dangerBtn} onPress={handleForceAnomaly}>
             <MaterialCommunityIcons name="heart-broken" size={20} color="#FFF" />
             <Text style={styles.dangerBtnText}>FORCE SIMULATE HARDWARE ANOMALY</Text>
           </TouchableOpacity>

           <TouchableOpacity style={styles.hipaaBtn} onPress={handleHIPAA}>
             <MaterialCommunityIcons name="file-lock" size={20} color="#FFF" />
             <Text style={[styles.dangerBtnText, { color: '#FFF' }]}>REQUEST HIPAA DATA EXPORT</Text>
           </TouchableOpacity>

        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80, paddingTop: Platform.OS === 'ios' ? 70 : 40 },
  pageTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 0.5, marginBottom: 5 },
  pageSub: { fontSize: 14, fontWeight: '700', opacity: 0.6, letterSpacing: 1, marginBottom: 30 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 12, opacity: 0.7, paddingLeft: 4 },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  inputIcon: { width: 40, alignItems: 'center' },
  inputBox: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, fontWeight: '600', opacity: 0.8 },
  pmhContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingLeft: 40, marginBottom: 10 },
  pmhBadge: { backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  pmhBadgeText: { color: '#3b82f6', fontSize: 12, fontWeight: '800' },
  btnPrimary: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  contactInfo: { flex: 1, marginLeft: 15, marginRight: 10 },
  contactName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  contactPhone: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  dialBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#3b82f6', padding: 14, borderRadius: 16, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnSecondaryText: { color: '#3b82f6', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  prefText: { fontSize: 15, fontWeight: '700' },
  diagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  diagLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diagText: { fontSize: 14, fontWeight: '700' },
  diagVal: { fontSize: 13, fontWeight: '900', opacity: 0.8 },
  warningCard: { padding: 20, borderRadius: 24, borderWidth: 2 },
  warningTitle: { fontSize: 18, fontWeight: '900', color: '#ef4444' },
  dangerBtn: { backgroundColor: '#ef4444', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5, shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 10, marginTop: 25 },
  dangerBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  hipaaBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
});
