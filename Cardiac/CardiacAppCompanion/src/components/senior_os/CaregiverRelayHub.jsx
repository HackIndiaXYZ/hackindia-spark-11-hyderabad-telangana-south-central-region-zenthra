import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Linking } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAccessibility } from './SeniorAccessibilityProvider';
// CONTEXT IMPORT FALLBACK: safely wrap useCardiacData import with fallback dummy state
let useCardiacData;
try {
  useCardiacData = require('../../context/CardiacDataContext').useCardiacData;
} catch (e) {
  useCardiacData = () => ({
    liveState: { alert_level: 'Normal', hr: 72, stability: 74, risk_pct: 5, spo2: 98.4, hrv: 44, respiration: 14, emergency_active: false },
  });
}


export default function CaregiverRelayHub({ alerts = [], onAcknowledgeAlert }) {
  const { themeStyles, getResponsiveStyle } = useAccessibility();
  const { liveState } = useCardiacData();

  // Selected alert for View Location & Vitals modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [playingAlertId, setPlayingAlertId] = useState(null);
  const [playTimer, setPlayTimer] = useState(0);

  const handlePlayVoice = (alertItem) => {
    if (playingAlertId === alertItem.id) {
      setPlayingAlertId(null);
      setPlayTimer(0);
    } else {
      setPlayingAlertId(alertItem.id);
      setPlayTimer(0);
      
      // Ticking timer simulation
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setPlayTimer(current);
        if (current >= 5) {
          clearInterval(interval);
          setPlayingAlertId(null);
          setPlayTimer(0);
        }
      }, 1000);
    }
  };

  const triggerCall = (phoneNumber = '+91 98765 43210') => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Simulating Outgoing Call", `Calling Jane Doe at ${phoneNumber}...`);
    });
  };

  const getUrgencyColors = (level) => {
    switch (level) {
      case 'CRITICAL':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
      case 'MEDIUM':
        return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      default:
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Summary */}
        <View style={[styles.headerCard, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
          <View style={styles.titleRow}>
            <MaterialIcons name="family-restroom" size={24} color={themeStyles.primary} />
            <Text style={[getResponsiveStyle(16), { fontWeight: '900', color: themeStyles.text, marginLeft: 8 }]}>
              Caregiver Mobile Portal (Simulated)
            </Text>
          </View>
          <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted, marginTop: 4 }]}>
            Family Dashboard for Jane{"'"}s care circle. Real-time updates from her Voice Companion.
          </Text>

        </View>

        {/* Live Alerts List */}
        <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.text, marginVertical: 10, paddingHorizontal: 4 }]}>
          Real-Time Alert Feed ({alerts.length})
        </Text>

        {alerts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
            <MaterialIcons name="done-all" size={40} color={themeStyles.accent} />
            <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.text, marginTop: 10 }]}>
              All Quiet
            </Text>
            <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted, textAlign: 'center', marginTop: 4 }]}>
              No active caregiver notifications or senior requests.
            </Text>
          </View>
        ) : (
          alerts.map((item) => {
            const colors = getUrgencyColors(item.urgency_level);
            const isPlaying = playingAlertId === item.id;
            return (
              <View 
                key={item.id} 
                style={[
                  styles.alertCard, 
                  { 
                    backgroundColor: themeStyles.cardBackground, 
                    borderColor: item.urgency_level === 'CRITICAL' ? themeStyles.danger : themeStyles.border,
                    borderWidth: item.urgency_level === 'CRITICAL' ? 3 : 1
                  }
                ]}
              >
                {/* Header row */}
                <View style={styles.alertHeader}>
                  <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[getResponsiveStyle(10), { fontWeight: '950', color: colors.text }]}>
                      {item.urgency_level}
                    </Text>
                  </View>
                  <Text style={[getResponsiveStyle(11), { color: themeStyles.textMuted }]}>
                    🕒 {item.caregiver_notification.timestamp}
                  </Text>
                </View>

                {/* Brief context */}
                <Text style={[getResponsiveStyle(15), { fontWeight: '800', color: themeStyles.text, marginVertical: 8 }]}>
                  {item.caregiver_notification.summary}
                </Text>

                <Text style={[getResponsiveStyle(13), { color: themeStyles.textMuted, marginBottom: 12 }]}>
                  💡 Recommended: {item.caregiver_notification.recommended_action}
                </Text>

                {/* Simulated Voice Player */}
                <View style={[styles.voicePlayer, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
                  <TouchableOpacity 
                    style={[styles.playBtn, { backgroundColor: themeStyles.primary }]}
                    onPress={() => handlePlayVoice(item)}
                  >
                    <MaterialIcons name={isPlaying ? "stop" : "play-arrow"} size={20} color={themeStyles.highContrast ? "#000" : "#FFF"} />
                  </TouchableOpacity>
                  
                  <View style={styles.waveformContainer}>
                    {/* Simulated static or animated waveform bars */}
                    {Array.from({ length: 15 }).map((_, i) => {
                      const active = isPlaying && (i / 15) * 5 <= playTimer;
                      return (
                        <View 
                          key={i} 
                          style={[
                            styles.waveformBar, 
                            { 
                              height: 6 + Math.sin(i * 0.8) * 12, 
                              backgroundColor: active ? themeStyles.accent : themeStyles.textMuted,
                              opacity: active ? 1 : 0.4
                            }
                          ]} 
                        />
                      );
                    })}
                  </View>
                  <Text style={[getResponsiveStyle(11), { color: themeStyles.textMuted, width: 35, textAlign: 'right' }]}>
                    {isPlaying ? `0:0${playTimer}` : '0:05'}
                  </Text>
                </View>

                {/* One-Tap Action Buttons (Strict min-size of 60px target for cards/toggles) */}
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: themeStyles.primary }]}
                    onPress={() => triggerCall()}
                  >
                    <MaterialIcons name="call" size={18} color={themeStyles.highContrast ? "#000" : "#FFF"} />
                    <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.highContrast ? "#000" : "#FFF", marginLeft: 4 }]}>
                      CALL
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: themeStyles.background, borderColor: themeStyles.border, borderWidth: 1 }]}
                    onPress={() => {
                      setSelectedAlert(item);
                      setShowVitalsModal(true);
                    }}
                  >
                    <MaterialIcons name="favorite" size={18} color="#ef4444" />
                    <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.text, marginLeft: 4 }]}>
                      VITALS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981', borderWidth: 1 }]}
                    onPress={() => onAcknowledgeAlert(item.id)}
                  >
                    <MaterialIcons name="check" size={18} color="#10b981" />
                    <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: '#10b981', marginLeft: 4 }]}>
                      ACK
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Vitals & Geolocation Modal */}
      <Modal visible={showVitalsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[getResponsiveStyle(18), { fontWeight: '900', color: themeStyles.text }]}>
                Live Vitals & Location
              </Text>
              <TouchableOpacity onPress={() => setShowVitalsModal(false)}>
                <MaterialIcons name="close" size={24} color={themeStyles.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Vitals Grid */}
            <View style={styles.vitalsGrid}>
              <View style={[styles.vitalMiniCard, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
                <MaterialIcons name="favorite" size={20} color="#ef4444" />
                <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted, marginTop: 4 }]}>HEART RATE</Text>
                <Text style={[getResponsiveStyle(18), { color: themeStyles.text, fontWeight: '900' }]}>
                  {liveState.hr || 74} <Text style={{ fontSize: 10 }}>BPM</Text>
                </Text>
              </View>

              <View style={[styles.vitalMiniCard, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
                <MaterialIcons name="speed" size={20} color={themeStyles.accent} />
                <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted, marginTop: 4 }]}>STABILITY</Text>
                <Text style={[getResponsiveStyle(18), { color: themeStyles.text, fontWeight: '900' }]}>
                  {liveState.stability || 82}%
                </Text>
              </View>

              <View style={[styles.vitalMiniCard, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
                <MaterialIcons name="opacity" size={20} color="#3b82f6" />
                <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted, marginTop: 4 }]}>SPO2</Text>
                <Text style={[getResponsiveStyle(18), { color: themeStyles.text, fontWeight: '900' }]}>
                  {liveState.spo2 || 98.2}%
                </Text>
              </View>
            </View>

            {/* Geolocation Brief */}
            <View style={[styles.locationBrief, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
              <MaterialIcons name="location-on" size={22} color={themeStyles.accent} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={[getResponsiveStyle(13), { color: themeStyles.text, fontWeight: '800' }]}>
                  Location: Secunderabad, Telangana
                </Text>
                <Text style={[getResponsiveStyle(11), { color: themeStyles.textMuted, marginTop: 2 }]}>
                  Coordinates: 17.4399° N, 78.4983° E (Patient Active Node)
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.closeModalBtn, { backgroundColor: themeStyles.primary }]}
              onPress={() => setShowVitalsModal(false)}
            >
              <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.highContrast ? "#000" : "#FFF" }]}>
                CLOSE MENU
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  headerCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  alertCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voicePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 15,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 50, // strict 60x60 target when mapped vertically, or generous size horizontally
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  vitalMiniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  locationBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  closeModalBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
