import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Linking, Alert, Platform, Modal } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Responder {
  id: string;
  name: string;
  role: string;
  dist: string;
  lat: number;
  lng: number;
  type: 'doctor' | 'volunteer' | 'hospital';
}

const RESPONDERS: Responder[] = [
  { id: '1', name: 'Dr. Aruna S.', role: 'Cardiologist', dist: '200m', lat: 17.4448, lng: 78.3789, type: 'doctor' },
  { id: '2', name: 'Rahul M.', role: 'Certified EMT', dist: '450m', lat: 17.4475, lng: 78.3762, type: 'volunteer' },
  { id: '3', name: 'Medicover Hospital', role: 'Emergency Hub', dist: '1.2km', lat: 17.4421, lng: 78.3820, type: 'hospital' },
];

export default function Community() {
  const [selectedLocation, setSelectedLocation] = useState<Responder | null>(null);

  const handleNavigate = (loc: Responder) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${loc.lat},${loc.lng}`,
      android: `google.navigation:q=${loc.lat},${loc.lng}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Navigation Error", "Could not open map application.");
        }
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>COR-COMMUNITY</Text>
        <Text style={styles.subtitle}>Nearby Volunteers & Safety Net</Text>
      </View>

      {/* PRIMARY SOS ACTION */}
      <View style={styles.sosContainer}>
        <TouchableOpacity style={styles.sosBtn} onPress={() => Alert.alert("SOS SENT", "Nearby responders have been alerted.")}>
          <Text style={styles.sosBtnText}>AGREE & SEND SOS SIGNAL</Text>
        </TouchableOpacity>
        <View style={styles.volStatusRow}>
          <Text style={styles.volStatusText}>3 VOLUNTEERS WITHIN 500M</Text>
          <Text style={styles.volStatusSub}>ARMED & READY FOR DISPATCH</Text>
        </View>
      </View>

      {/* INTERACTIVE MAP VIEWPORT */}
      <View style={styles.mapCard}>
        <View style={styles.mapViewport}>
          {/* User Dot */}
          <View style={styles.userDot}>
            <View style={styles.userIconInner}>
              <MaterialIcons name="person" size={16} color="#FFF" />
            </View>
          </View>
          
          {/* Interactive Responder Markers */}
          {RESPONDERS.map(res => (
            <TouchableOpacity 
              key={res.id} 
              style={[styles.markerBtn, { top: 40 + (Math.random() * 100), left: 30 + (Math.random() * 200) }]}
              onPress={() => setSelectedLocation(res)}
            >
              <MaterialIcons name="add-box" size={24} color={res.type === 'hospital' ? '#ef4444' : '#22c55e'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* RESPONDER LIST */}
      <Text style={styles.sectionLabel}>VERIFIED RESPONDER NETWORK</Text>
      {RESPONDERS.map(res => (
        <TouchableOpacity key={res.id} style={styles.resCard} onPress={() => handleNavigate(res)}>
          <View style={[styles.iconBox, { backgroundColor: res.type === 'hospital' ? '#fef2f2' : '#eff6ff' }]}>
            <MaterialIcons 
              name={res.type === 'hospital' ? 'local-hospital' : 'person'} 
              size={24} 
              color={res.type === 'hospital' ? '#ef4444' : '#3b82f6'} 
            />
          </View>
          <View style={styles.resInfo}>
            <Text style={styles.resName}>{res.name}</Text>
            <Text style={styles.resSub}>{res.role} • {res.dist}</Text>
          </View>
          <View style={styles.navAction}>
            <Ionicons name="navigate-circle" size={32} color="#3b82f6" />
            <Text style={styles.navLabel}>ROUTE</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* NAVIGATION MODAL (POPUP) */}
      <Modal visible={!!selectedLocation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedLocation?.name}</Text>
            <Text style={styles.modalSub}>{selectedLocation?.role} ({selectedLocation?.dist})</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSelectedLocation(null)}>
                <Text style={styles.modalCancelText}>CLOSE</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirm} 
                onPress={() => {
                  if (selectedLocation) handleNavigate(selectedLocation);
                  setSelectedLocation(null);
                }}
              >
                <Text style={styles.modalConfirmText}>START NAVIGATION</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  header: { marginBottom: 25 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginTop: 2 },
  sosContainer: { marginBottom: 20 },
  sosBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 24, alignItems: 'center', elevation: 5, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10 },
  sosBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  volStatusRow: { marginTop: 15, backgroundColor: '#eff6ff', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  volStatusText: { fontSize: 10, fontWeight: '900', color: '#1e3a8a', letterSpacing: 0.5 },
  volStatusSub: { fontSize: 8, fontWeight: '900', color: '#3b82f6', marginTop: 4, letterSpacing: 0.5 },
  mapCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  mapViewport: { height: 260, backgroundColor: '#f1f5f9', borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  userDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f640', justifyContent: 'center', alignItems: 'center' },
  userIconInner: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  markerBtn: { position: 'absolute' },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  resCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  resInfo: { flex: 1, gap: 2 },
  resName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  resSub: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  navAction: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 8, fontWeight: '900', color: '#3b82f6' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b', fontWeight: '700', marginTop: 8, marginBottom: 25 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  modalCancelText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  modalConfirm: { flex: 2, padding: 18, borderRadius: 18, backgroundColor: '#3b82f6', alignItems: 'center' },
  modalConfirmText: { fontSize: 12, fontWeight: '900', color: '#FFF' }
});
