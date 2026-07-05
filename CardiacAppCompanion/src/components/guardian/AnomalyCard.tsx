import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

type Severity = 'warning' | 'caution' | 'info';

interface Anomaly {
  time: string;
  label: string;
  detail: string;
  severity: Severity;
  icon: string;
}

const ANOMALIES: Anomaly[] = [
  {
    time: '02:00 PM',
    label: 'Slight Tachycardia',
    detail: 'HR peaked at 103 BPM during exercise. Lyapunov exponent: +0.31 (unstable)',
    severity: 'caution',
    icon: 'trending-up',
  },
  {
    time: '03:00–04:00 AM',
    label: 'HRV Volatility Window',
    detail: 'High variability in SDNN observed (Δ42ms). Possible sleep arrhythmia.',
    severity: 'warning',
    icon: 'warning',
  },
  {
    time: '07:45 AM',
    label: 'Cardiac Stability Restored',
    detail: 'Lyapunov exponent returned to -0.12 (stable). Normal sinus rhythm confirmed.',
    severity: 'info',
    icon: 'check-circle',
  },
];

const SEVERITY_COLORS: Record<Severity, string> = {
  warning: '#f59e0b',
  caution: '#fb923c',
  info: '#10b981',
};

export default function AnomalyCard() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="brain" size={16} color="#8b5cf6" />
        <Text style={styles.title}>AI HEALTH ANOMALY DETECTION</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LYAPUNOV ENGINE</Text>
        </View>
      </View>

      {ANOMALIES.map((a, i) => (
        <View key={i} style={[styles.item, i < ANOMALIES.length - 1 && styles.itemBorder]}>
          <View style={[styles.iconBox, { backgroundColor: `${SEVERITY_COLORS[a.severity]}18` }]}>
            <MaterialIcons name={a.icon as any} size={18} color={SEVERITY_COLORS[a.severity]} />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.itemTop}>
              <Text style={[styles.itemLabel, { color: SEVERITY_COLORS[a.severity] }]}>{a.label}</Text>
              <Text style={styles.itemTime}>{a.time}</Text>
            </View>
            <Text style={styles.itemDetail}>{a.detail}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title: { flex: 1, fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  badge: { backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  badgeText: { color: '#8b5cf6', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemContent: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemLabel: { fontSize: 13, fontWeight: '800' },
  itemTime: { fontSize: 10, color: '#475569', fontWeight: '700' },
  itemDetail: { fontSize: 12, color: '#94a3b8', lineHeight: 17 },
});
