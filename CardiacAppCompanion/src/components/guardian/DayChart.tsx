import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// 24-pt hourly data per day
const BPM_DATA: Record<string, number[]> = {
  Mon: [68,69,67,67,71,78,86,88,82,77,74,76,80,84,87,91,83,77,74,71,70,71,72,70],
  Tue: [70,71,69,68,73,80,85,84,78,74,72,76,78,82,84,88,81,75,72,70,69,70,71,69],
  Wed: [73,74,71,70,76,83,90,92,88,82,78,80,83,86,88,91,84,78,75,73,71,73,74,72],
  Thu: [71,72,70,69,74,81,87,86,80,76,73,77,79,83,85,89,82,76,73,71,70,71,72,70],
  Fri: [74,75,72,71,77,84,91,93,89,83,79,81,84,87,89,92,85,79,76,74,72,74,75,73],
  Sat: [68,70,68,67,72,78,84,83,77,73,71,75,77,81,83,87,80,74,71,69,68,69,70,68],
  Sun: [69,71,69,68,73,79,85,84,78,74,72,76,78,82,84,88,81,75,72,70,69,70,71,69],
};
const HRV_DATA: Record<string, number[]> = {
  Mon: [52,54,55,53,50,46,42,40,43,46,48,47,45,43,41,38,42,46,49,51,52,53,52,51],
  Tue: [50,52,53,51,48,44,40,39,42,45,47,46,44,42,40,37,41,45,48,50,51,52,51,50],
  Wed: [48,50,51,49,46,42,38,36,39,43,46,44,42,40,38,35,40,44,47,49,50,51,50,49],
  Thu: [51,53,54,52,49,45,41,40,43,46,48,47,45,43,41,38,42,46,49,51,52,53,52,51],
  Fri: [47,49,50,48,45,41,37,35,38,42,45,43,41,39,37,34,39,43,46,48,49,50,49,48],
  Sat: [54,56,57,55,52,48,44,43,46,49,51,50,48,46,44,41,45,49,52,54,55,56,55,54],
  Sun: [53,55,56,54,51,47,43,42,45,48,50,49,47,45,43,40,44,48,51,53,54,55,54,53],
};

const ANOMALIES: Record<string, { time: string; label: string; severity: 'warn' | 'alert' | 'ok' }[]> = {
  Mon: [{ time: '03:14 AM', label: 'Atrial Flutter during sleep', severity: 'alert' }, { time: '02:00 PM', label: 'Slight Tachycardia during exercise (HR: 103)', severity: 'warn' }],
  Tue: [{ time: '07:45 AM', label: 'Cardiac stability restored — NSR confirmed', severity: 'ok' }],
  Wed: [{ time: '03:00–04:00 AM', label: 'High HRV volatility (SDNN Δ42ms) — sleep arrhythmia', severity: 'alert' }, { time: '06:10 PM', label: 'Lyapunov exponent spike (+0.31)', severity: 'warn' }],
  Thu: [{ time: '11:30 AM', label: 'Mild Bradycardia during rest (HR: 58)', severity: 'warn' }],
  Fri: [{ time: '04:45 PM', label: 'QTc prolongation detected (422ms)', severity: 'alert' }],
  Sat: [{ time: '09:00 AM', label: 'All vitals within clinical norms', severity: 'ok' }],
  Sun: [{ time: '02:00 PM', label: 'Slight Tachycardia (HR: 96) post-meal', severity: 'warn' }],
};

const W = 320, H = 110, P = 10;
const SEVERITY_COLOR = { warn: '#f59e0b', alert: '#FF0000', ok: '#00FFCC' };

function multiLine(data: number[], minV: number, maxV: number) {
  return data.map((v, i) =>
    `${P + i * ((W - P * 2) / (data.length - 1))},${H - P - ((v - minV) / (maxV - minV)) * (H - P * 2)}`
  ).join(' ');
}

export default function DayChart() {
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const [selected, setSelected] = useState(today);

  const bpm = BPM_DATA[selected];
  const hrv = HRV_DATA[selected];
  const bpmMin = Math.min(...bpm) - 4, bpmMax = Math.max(...bpm) + 4;
  const hrvMin = Math.min(...hrv) - 4, hrvMax = Math.max(...hrv) + 4;
  const avgBpm = Math.round(bpm.reduce((a, b) => a + b, 0) / bpm.length);
  const avgHrv = Math.round(hrv.reduce((a, b) => a + b, 0) / hrv.length);
  const csi = Math.max(85, Math.min(98, Math.round(100 - (Math.max(...bpm) - Math.min(...bpm)) / 1.8)));

  const anomalies = ANOMALIES[selected] || [];

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.row}>
        <Text style={s.title}>DEEP CARDIAC HISTORY</Text>
        <View style={s.csiBadge}><Text style={s.csiTxt}>CSI {csi}%</Text></View>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {DAYS.map(d => (
            <TouchableOpacity key={d} onPress={() => setSelected(d)}
              style={[s.dayBtn, selected === d && s.dayBtnOn]}>
              <Text style={[s.dayTxt, selected === d && s.dayTxtOn]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Multi-line chart */}
      <View style={{ alignItems: 'center' }}>
        <Svg width={W} height={H}>
          {[0, 0.33, 0.66, 1].map((t, i) => (
            <Line key={i} x1={P} y1={P + t * (H - P * 2)} x2={W - P} y2={P + t * (H - P * 2)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {/* HRV line (cyan) */}
          <Polyline points={multiLine(hrv, hrvMin, hrvMax)} fill="none"
            stroke="rgba(0,255,204,0.25)" strokeWidth="5" strokeLinecap="round" />
          <Polyline points={multiLine(hrv, hrvMin, hrvMax)} fill="none"
            stroke="#00FFCC" strokeWidth="1.5" strokeLinecap="round" />
          {/* BPM line (red) */}
          <Polyline points={multiLine(bpm, bpmMin, bpmMax)} fill="none"
            stroke="rgba(255,0,0,0.25)" strokeWidth="5" strokeLinecap="round" />
          <Polyline points={multiLine(bpm, bpmMin, bpmMax)} fill="none"
            stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
        {/* Legend */}
        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#FF0000' }]} /><Text style={s.legendTxt}>BPM</Text></View>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#00FFCC' }]} /><Text style={s.legendTxt}>HRV (SDNN)</Text></View>
        </View>
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={[s.statVal, { color: '#FF0000' }]}>{avgBpm}</Text><Text style={s.statLbl}>AVG BPM</Text></View>
          <View style={s.stat}><Text style={[s.statVal, { color: '#00FFCC' }]}>{avgHrv}ms</Text><Text style={s.statLbl}>AVG HRV</Text></View>
          <View style={s.stat}><Text style={[s.statVal, { color: '#f59e0b' }]}>{Math.max(...bpm)}</Text><Text style={s.statLbl}>PEAK BPM</Text></View>
        </View>
      </View>

      {/* Anomaly log */}
      <View style={s.anomalySection}>
        <Text style={s.anomalyHeader}>DETECTED IRREGULARITIES — {selected.toUpperCase()}</Text>
        {anomalies.length === 0
          ? <Text style={s.noAnomaly}>No irregularities detected for this day.</Text>
          : anomalies.map((a, i) => (
            <View key={i} style={s.anomalyItem}>
              <View style={[s.anomalyDot, { backgroundColor: SEVERITY_COLOR[a.severity] }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.anomalyLabel, { color: SEVERITY_COLOR[a.severity] }]}>{a.time}</Text>
                <Text style={s.anomalyDetail}>{a.label}</Text>
              </View>
            </View>
          ))
        }
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#0A0A0A', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(0,255,204,0.12)', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 1 },
  csiBadge: { backgroundColor: 'rgba(0,255,204,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,255,204,0.3)' },
  csiTxt: { color: '#00FFCC', fontSize: 11, fontWeight: '900' },
  dayBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dayBtnOn: { backgroundColor: 'rgba(0,255,204,0.12)', borderColor: '#00FFCC' },
  dayTxt: { fontSize: 13, fontWeight: '700', color: '#475569' },
  dayTxtOn: { color: '#00FFCC' },
  legend: { flexDirection: 'row', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', width: '100%', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 9, color: '#475569', fontWeight: '800', marginTop: 2 },
  anomalySection: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  anomalyHeader: { fontSize: 9, fontWeight: '900', color: '#475569', letterSpacing: 1, marginBottom: 10 },
  anomalyItem: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  anomalyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  anomalyLabel: { fontSize: 12, fontWeight: '900' },
  anomalyDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  noAnomaly: { fontSize: 13, color: '#00FFCC', fontWeight: '700', opacity: 0.6 },
});
