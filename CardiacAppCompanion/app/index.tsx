import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function GatewayLanding() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'secured'>('idle');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'guardian' | null>(null);

  const handleRoleSelection = async (role: 'patient' | 'guardian') => {
    if (authStatus !== 'idle') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedRole(role);
    setAuthStatus('authenticating');

    // Simulate Auth Flow
    setTimeout(() => {
      setAuthStatus('secured');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate after success state is briefly shown
      setTimeout(() => {
        if (role === 'patient') {
          router.replace('/(tabs)');
        } else {
          router.replace('/guardian-dashboard');
        }
      }, 500);
    }, 1500);
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#020617']} style={styles.container}>
      {/* HEADER SECTION */}
      <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.headerContainer}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="heart-pulse" size={48} color="#3b82f6" />
        </View>
        <Text style={styles.title}>CorAssist Clinical OS</Text>
        <Text style={styles.subtitle}>Unified Edge-to-Cloud Cardiac Monitoring</Text>
      </Animated.View>

      {/* CARDS SECTION */}
      <View style={styles.cardsContainer}>
        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => handleRoleSelection('patient')}
          >
            <LinearGradient colors={['rgba(59,130,246,0.1)', 'rgba(30,64,175,0.05)']} style={styles.cardGradient}>
              <MaterialCommunityIcons name="heart-pulse" size={42} color="#3b82f6" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Patient Terminal</Text>
              <Text style={styles.cardDescription}>Continuous Telemetry & ODE Predictive Engine</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => handleRoleSelection('guardian')}
          >
            <LinearGradient colors={['rgba(16,185,129,0.1)', 'rgba(4,120,87,0.05)']} style={styles.cardGradient}>
              <MaterialCommunityIcons name="shield-account" size={42} color="#10b981" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Guardian Command</Text>
              <Text style={styles.cardDescription}>Remote Monitoring & Autonomous Rescue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* AUTHENTICATION OVERLAY */}
      {authStatus !== 'idle' && (
        <Animated.View entering={FadeIn} style={styles.overlay}>
          <LinearGradient colors={['rgba(2,6,23,0.95)', 'rgba(15,23,42,0.98)']} style={styles.overlayContent}>
            {authStatus === 'authenticating' ? (
              <>
                <ActivityIndicator size="large" color="#3b82f6" style={{ transform: [{ scale: 1.5 }] }} />
                <Text style={styles.overlayText}>Authenticating Edge Node Sync...</Text>
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="check-circle" size={80} color="#10b981" />
                <Text style={[styles.overlayText, { color: '#10b981', marginTop: 20 }]}>Connection Secured</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: width * 0.8,
    lineHeight: 24,
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(30,41,59,0.4)',
  },
  cardGradient: {
    padding: 30,
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
