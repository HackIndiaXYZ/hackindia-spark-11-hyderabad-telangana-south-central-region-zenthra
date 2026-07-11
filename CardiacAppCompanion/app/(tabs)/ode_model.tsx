import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useCardiacData } from '../../src/context/CardiacDataContext';

const { width } = Dimensions.get('window');

export default function ODEModel() {
  const { liveState } = useCardiacData();
  
  const h0 = liveState.hrv || 50;
  const k = 0.05;
  const trajectory = [0, 5, 10, 15, 20, 25, 30].map(t => h0 * Math.exp(-k * t));

  const trajectoryData = {
    labels: ["0m", "5m", "10m", "15m", "20m", "25m", "30m"],
    datasets: [
      {
        data: trajectory,
        color: (opacity = 1) => `rgba(132, 204, 22, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Predictive Modeling</Text>
      </View>

      <View style={styles.formulaCard}>
        <MaterialCommunityIcons name="sigma" size={24} color="#a855f7" style={styles.sigma} />
        <View style={styles.formulaInfo}>
          <Text style={styles.formulaValue}>H(t) = {h0.toFixed(1)} • e⁻ᵏᵗ</Text>
          <Text style={styles.formulaName}>Lyapunov HRV Decay Model</Text>
        </View>
      </View>

      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Forecasted Trajectory</Text>
        <LineChart
          data={trajectoryData}
          width={width - 40}
          height={260}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            color: (opacity = 1) => `rgba(132, 204, 22, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
            propsForBackgroundLines: { strokeDasharray: "5, 5", stroke: "#f1f5f9" }
          }}
          withInnerLines={true}
          withOuterLines={false}
          withShadow={true}
          bezier
          style={styles.chart}
        />

        <View style={styles.paramsRow}>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>H₀ (Base)</Text>
            <Text style={styles.paramValue}>{h0.toFixed(1)} ms</Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>k (Decay)</Text>
            <Text style={styles.paramValue}>{k.toFixed(3)}</Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>Current</Text>
            <Text style={[styles.paramValue, { color: '#3b82f6' }]}>{trajectory[trajectory.length-1].toFixed(1)} ms</Text>
          </View>
        </View>
      </View>

      <View style={[styles.riskBox, liveState.emergency_active && { borderLeftColor: '#ef4444' }]}>
        <View style={styles.riskIcon}>
          <Ionicons name="hourglass-outline" size={20} color="#0f172a" />
        </View>
        <View style={styles.riskInfo}>
          <Text style={styles.riskTitle}>ESTIMATED RISK WINDOW</Text>
          <Text style={[styles.riskDesc, liveState.emergency_active && { color: '#ef4444' }]}>
            {liveState.emergency_active ? "IMMEDIATE CRITICAL WINDOW OPEN" : "Insufficient decay trajectory to predict horizon."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  formulaCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  sigma: { opacity: 0.8 },
  formulaInfo: { gap: 4 },
  formulaValue: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  formulaName: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  graphCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  graphTitle: { fontSize: 13, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  chart: { marginLeft: -10 },
  paramsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 20 },
  paramItem: { alignItems: 'center' },
  paramLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 4 },
  paramValue: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  riskBox: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', gap: 15, borderLeftWidth: 5, borderLeftColor: '#f59e0b' },
  riskIcon: { marginTop: 2 },
  riskInfo: { gap: 4 },
  riskTitle: { fontSize: 10, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  riskDesc: { fontSize: 12, fontWeight: '700', color: '#3b82f6' }
});
