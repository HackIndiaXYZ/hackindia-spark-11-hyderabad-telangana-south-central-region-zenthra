import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
  FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppContext } from '../src/context/AppContext';

const { width, height } = Dimensions.get('window');

function PulseLine({ color, delay = 0 }: { color: string; delay?: number }) {
  const op = useSharedValue(0.2);
  useEffect(() => {
    op.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 + delay }), withTiming(0.2, { duration: 900 + delay })),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[styles.pulseLine, { backgroundColor: color }, style]} />
  );
}

export default function UserGateway() {
  const { setUserRole } = useContext(AppContext);

  const handleSelect = (role: 'patient' | 'guardian') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUserRole(role);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Ambient scan lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0.15, 0.35, 0.55, 0.75, 0.9].map((t, i) => (
          <PulseLine key={i} color={i % 2 === 0 ? '#00FFCC' : '#FF0000'} delay={i * 200} />
        ))}
      </View>

      <Animated.View entering={FadeInUp.duration(900)} style={styles.header}>
        <MaterialCommunityIcons name="heart-pulse" size={40} color="#00FFCC" />
        <Text style={styles.brandName}>CORASSIST</Text>
        <Text style={styles.brandTagline}>CLINICAL CARDIAC OS · v3.0</Text>
        <View style={styles.divider} />
        <Text style={styles.prompt}>SELECT YOUR TERMINAL</Text>
      </Animated.View>

      <View style={styles.cards}>
        {/* PATIENT TERMINAL */}
        <Animated.View entering={FadeInDown.delay(300).duration(700)}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect('patient')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(0,255,204,0.07)', 'rgba(0,255,204,0.02)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <View style={[styles.cardIconRow]}>
              <View style={[styles.iconBox, { borderColor: '#00FFCC' }]}>
                <MaterialCommunityIcons name="heart-pulse" size={28} color="#00FFCC" />
              </View>
              <View style={[styles.iconBox, { borderColor: '#00FFCC' }]}>
                <MaterialCommunityIcons name="pulse" size={28} color="#00FFCC" />
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: '#00FFCC' }]}>PATIENT TERMINAL</Text>
            <Text style={styles.cardSub}>Real-time cardiac monitoring, HRV analytics,{'\n'}Pill-Vision OCR, and autonomous SOS dispatch.</Text>
            <View style={[styles.selectBtn, { borderColor: '#00FFCC' }]}>
              <Text style={[styles.selectTxt, { color: '#00FFCC' }]}>ENTER PATIENT MODE</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#00FFCC" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* GUARDIAN COMMAND */}
        <Animated.View entering={FadeInDown.delay(550).duration(700)}>
          <TouchableOpacity
            style={[styles.card, { borderColor: 'rgba(255,0,0,0.35)' }]}
            onPress={() => handleSelect('guardian')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(255,0,0,0.08)', 'rgba(255,0,0,0.02)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <View style={styles.cardIconRow}>
              <View style={[styles.iconBox, { borderColor: '#FF0000' }]}>
                <MaterialIcons name="security" size={28} color="#FF0000" />
              </View>
              <View style={[styles.iconBox, { borderColor: '#FF0000' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={28} color="#FF0000" />
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: '#FF0000' }]}>GUARDIAN COMMAND</Text>
            <Text style={styles.cardSub}>Bio-digital twin mirror, geofencing, AI anomaly{'\n'}detection, and emergency Uber + VoIP dispatch.</Text>
            <View style={[styles.selectBtn, { borderColor: '#FF0000' }]}>
              <Text style={[styles.selectTxt, { color: '#FF0000' }]}>ENTER GUARDIAN MODE</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FF0000" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.footer}>
        <Text style={styles.footerTxt}>SECURED · HIPAA-COMPLIANT TELEMETRY NETWORK</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  pulseLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 30 },
  brandName: { fontSize: 38, fontWeight: '900', color: '#FFFFFF', letterSpacing: 6, marginTop: 12 },
  brandTagline: { fontSize: 11, fontWeight: '700', color: '#00FFCC', letterSpacing: 3, marginTop: 4, opacity: 0.7 },
  divider: { width: 60, height: 1, backgroundColor: 'rgba(0,255,204,0.3)', marginVertical: 20 },
  prompt: { fontSize: 12, fontWeight: '900', color: '#475569', letterSpacing: 4 },
  cards: { flex: 1, paddingHorizontal: 20, gap: 16, justifyContent: 'center' },
  card: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    borderColor: 'rgba(0,255,204,0.35)', overflow: 'hidden',
  },
  cardIconRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  iconBox: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  cardSub: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 18 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingVertical: 12,
  },
  selectTxt: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  footer: { alignItems: 'center', paddingBottom: 20 },
  footerTxt: { fontSize: 9, fontWeight: '700', color: '#1e293b', letterSpacing: 2 },
});
