import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccessibility } from './SeniorAccessibilityProvider';
import { parseVoiceIntent } from './VoiceIntentEngine';
import * as Speech from 'expo-speech';

export default function SeniorOSDemoSuite({ onDemoTriggered }) {
  const { themeStyles, getResponsiveStyle } = useAccessibility();

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

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.accent }]}>
      <View style={styles.header}>
        <MaterialIcons name="gavel" size={18} color={themeStyles.accent} />
        <Text style={[getResponsiveStyle(12), { fontWeight: '950', color: themeStyles.accent, marginLeft: 6 }]}>
          JUDGE LIVE DEMO CONTROLS
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.demoBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
          onPress={() => runDemoScenario(1)}
        >
          <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.text }]}>DEMO 1</Text>
          <Text style={[getResponsiveStyle(8), { color: themeStyles.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Direct AI Answer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.demoBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
          onPress={() => runDemoScenario(2)}
        >
          <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.text }]}>DEMO 2</Text>
          <Text style={[getResponsiveStyle(8), { color: themeStyles.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Caregiver Relay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.demoBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
          onPress={() => runDemoScenario(3)}
        >
          <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: themeStyles.danger }]}>DEMO 3</Text>
          <Text style={[getResponsiveStyle(8), { color: themeStyles.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Critical Emergency
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
