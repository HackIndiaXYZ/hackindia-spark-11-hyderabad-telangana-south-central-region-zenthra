import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useCardiacData } from '../../src/context/CardiacDataContext';

export default function Alerts() {
  const { history } = useCardiacData();

  const mockAlerts = [
    { id: '1', risk: '5%', time: '12:45:02', msg: 'Stability index remains within optimal bounds.' },
    { id: '2', risk: '8%', time: '11:30:15', msg: 'Minor HRV variance detected during resting state.' },
    { id: '3', risk: '4%', time: '09:15:44', msg: 'System diagnostic completed. Sensors synchronized.' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Log & Alerts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>LATEST NOTIFICATIONS</Text>
        {mockAlerts.map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.statusGroup}>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>NORMAL NOTIFICATION</Text>
              </View>
              <Text style={styles.timestamp}>{alert.time}</Text>
            </View>
            <Text style={styles.alertBody}>{alert.msg}</Text>
            <View style={styles.riskFooter}>
              <Text style={styles.riskLabel}>RISK ASSESSMENT:</Text>
              <Text style={styles.riskValue}>{alert.risk}</Text>
            </View>
          </View>
        ))}

        <View style={styles.historySection}>
          <Text style={styles.sectionLabel}>RAW TELEMETRY HISTORY</Text>
          {history.slice(-5).reverse().map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.hTime}>{new Date(h.timestamp).toLocaleTimeString()}</Text>
              <Text style={styles.hVal}>{h.heart_rate} BPM</Text>
              <Text style={styles.hStability}>{h.stability}% STABLE</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  alertCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#10b981', borderLeftWidth: 6, borderLeftColor: '#10b981' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  statusText: { fontSize: 10, fontWeight: '900', color: '#10b981', letterSpacing: 0.5 },
  timestamp: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  alertBody: { fontSize: 14, fontWeight: '700', color: '#1e293b', lineHeight: 20, marginBottom: 15 },
  riskFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  riskLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
  riskValue: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  historySection: { marginTop: 20 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  hTime: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  hVal: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  hStability: { fontSize: 11, fontWeight: '900', color: '#22c55e' }
});
