import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccessibility } from './SeniorAccessibilityProvider';
import { parseVoiceIntent } from './VoiceIntentEngine';
import * as Speech from 'expo-speech';
import { confirmAction, successAction, withTremorFilter } from '../../utils/hapticsEngine';

export default function SeniorOSDemoSuite({ onDemoTriggered }) {
  const { themeStyles, getResponsiveStyle } = useAccessibility();

  // Pulse scale animation for Demo/Haptic buttons
  const testScale = useRef(new Animated.Value(1)).current;

  const triggerTestAnimation = () => {
    Animated.sequence([
      Animated.timing(testScale, { toValue: 0.85, duration: 60, useNativeDriver: true }),
      Animated.spring(testScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
  };

  const runDemoScenario = (scenarioNum) => {
    let transcript = "";
    
    if (scenarioNum === 1) {
      transcript = "Where is the nearest medical store?";
    } else if (scenarioNum === 2) {
      transcript = "Tell my daughter I need help finding my LIC policy card.";
    } else if (scenarioNum === 3) {
      transcript = "I am feeling very dizzy and my heart is racing.";
    }

    const result = parseVoiceIntent(transcript);
    
    // Voice response
    Speech.speak(result.ai_response_text, { rate: 0.95 });
    
    // Propagate to main view
    onDemoTriggered(result);
  };

  const handleTestHaptics = () => {
    triggerTestAnimation();
    // Bi-modal feedback loop: vibration + ripple + sound chime
    confirmAction();
    setTimeout(() => {
      successAction();
    }, 150);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
      <View style={styles.header}>
        <MaterialIcons name="gavel" size={16} color={themeStyles.accent} />
        <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.accent, marginLeft: 4 }]} numberOfLines={1}>
          JUDGE DEMOS:
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.demoBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
          onPress={withTremorFilter(() => {
            confirmAction();
            runDemoScenario(1);
          })}
        >
          <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.text }]}>DEMO 1</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.demoBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
          onPress={withTremorFilter(() => {
            confirmAction();
            runDemoScenario(2);
          })}
        >
          <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.text }]}>DEMO 2</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.demoBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
          onPress={withTremorFilter(() => {
            confirmAction();
            runDemoScenario(3);
          })}
        >
          <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.danger }]}>DEMO 3</Text>
        </TouchableOpacity>

        {/* Demo Haptics test button */}
        <Animated.View style={{ transform: [{ scale: testScale }] }}>
          <TouchableOpacity 
            style={[
              styles.demoBtn, 
              { 
                backgroundColor: themeStyles.primary, 
                borderColor: themeStyles.border, 
                borderWidth: 2 
              }
            ]}
            onPress={withTremorFilter(handleTestHaptics)}
          >
            <Text style={[getResponsiveStyle(11), { fontWeight: '950', color: '#FFF' }]}>TEST HAPTICS 🔔</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 15,
    marginTop: 6,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  demoBtn: {
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
