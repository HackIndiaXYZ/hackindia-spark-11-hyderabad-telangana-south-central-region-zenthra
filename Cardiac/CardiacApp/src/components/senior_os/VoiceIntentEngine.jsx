import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccessibility } from './SeniorAccessibilityProvider';
import * as Speech from 'expo-speech';

export function parseVoiceIntent(transcript, customTime = null) {
  const t = transcript.toLowerCase();
  const timeStr = customTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. EMERGENCY OVERRIDE
  if (t.includes('dizzy') || t.includes('fell') || t.includes('chest') || t.includes('pain') || t.includes('heart') || t.includes('racing') || t.includes('help') || t.includes('ambulance')) {
    return {
      transcript: transcript,
      intent_category: "EMERGENCY_OVERRIDE",
      urgency_level: "CRITICAL",
      ai_response_text: "Jane, I've detected distress. Starting the 10-second rescue countdown and alerting your doctor and family.",
      caregiver_notification: {
        summary: "⚠️ CRITICAL ALERT: Jane reported feeling dizzy/chest pain.",
        recommended_action: "Confirm dispatch of medical response vehicle immediately.",
        timestamp: timeStr
      }
    };
  }

  // 2. CAREGIVER RELAY
  if (t.includes('son') || t.includes('daughter') || t.includes('rahul') || t.includes('family') || t.includes('notify') || t.includes('tell') || t.includes('call') || t.includes('policy') || t.includes('card') || t.includes('lic')) {
    let name = "Rahul";
    if (t.includes('daughter')) name = "Priya";
    return {
      transcript: transcript,
      intent_category: "CAREGIVER_RELAY",
      urgency_level: "MEDIUM",
      ai_response_text: `I have notified ${name}. I told them to call you and help you right away.`,
      caregiver_notification: {
        summary: `Jane needs help: "${transcript}"`,
        recommended_action: "Call Jane immediately or assist with her policy search.",
        timestamp: timeStr
      }
    };
  }

  // 3. DIRECT ANSWER (e.g. pharmacy, meds)
  if (t.includes('pharmacy') || t.includes('medical') || t.includes('store') || t.includes('medicine') || t.includes('pill') || t.includes('refill') || t.includes('remind')) {
    let ans = "I found the nearest pharmacies on your screen. The closest one is Apollo Pharmacy, 300 meters away.";
    if (t.includes('medicine') || t.includes('pill')) {
      ans = "You have Aspirin scheduled at 9:00 AM daily. Your stock is healthy.";
    }
    return {
      transcript: transcript,
      intent_category: "DIRECT_ANSWER",
      urgency_level: "LOW",
      ai_response_text: ans,
      caregiver_notification: null
    };
  }

  // Fallback direct answer
  return {
    transcript: transcript,
    intent_category: "DIRECT_ANSWER",
    urgency_level: "LOW",
    ai_response_text: "I am here. I can check your health, search for pharmacies, or contact your family. What do you need?",
    caregiver_notification: null
  };
}

export default function VoiceIntentEngine({ onIntentRouted, addNotification }) {
  const { themeStyles, getResponsiveStyle } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [waveHeights, setWaveHeights] = useState([10, 10, 10, 10, 10, 10, 10, 10]);

  const recognitionRef = useRef(null);
  const animIntervalRef = useRef(null);

  // Waveform animation
  useEffect(() => {
    if (isListening) {
      animIntervalRef.current = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 8 }, () => Math.floor(Math.random() * 45) + 15)
        );
      }, 150);
    } else {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      setWaveHeights([10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [isListening]);

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-IN';

        rec.onstart = () => {
          setIsListening(true);
          setTranscript('');
        };

        rec.onerror = (event) => {
          console.error("Speech Recognition Error", event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event) => {
          const resultText = event.results[0][0].transcript;
          setTranscript(resultText);
          handleProcessTranscript(resultText);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported on this device/browser. Please use the scenario buttons or type your request below.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProcessTranscript = (text) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = parseVoiceIntent(text);
      setIsProcessing(false);

      // Speech Synthesis
      Speech.speak(result.ai_response_text, { rate: 0.95 });

      // Callback
      onIntentRouted(result);
    }, 1000);
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    const text = manualText;
    setManualText('');
    setTranscript(text);
    handleProcessTranscript(text);
  };

  // Get status color for mic indicator
  const getStatusColor = () => {
    if (isProcessing) return '#f59e0b'; // yellow
    if (isListening) return '#10b981'; // green
    return '#94a3b8'; // gray
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
      <View style={styles.header}>
        <View style={styles.micStatus}>
          <View style={[styles.indicatorDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[getResponsiveStyle(14), { color: themeStyles.textMuted }]}>
            {isListening ? "Listening..." : isProcessing ? "Processing Voice..." : "Voice Assistant Idle"}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.micButton, { backgroundColor: isListening ? '#ef4444' : themeStyles.primary }]} 
          onPress={toggleListening}
        >
          <MaterialIcons name={isListening ? "mic-off" : "mic"} size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Waveform Visualizer */}
      <View style={styles.waveformContainer}>
        {waveHeights.map((h, i) => (
          <View 
            key={i} 
            style={[
              styles.waveBar, 
              { 
                height: h, 
                backgroundColor: isListening ? themeStyles.accent : themeStyles.textMuted,
                opacity: isListening ? 1 : 0.4
              }
            ]} 
          />
        ))}
      </View>

      {transcript ? (
        <View style={styles.transcriptBox}>
          <Text style={[getResponsiveStyle(13), { color: themeStyles.textMuted, fontStyle: 'italic' }]}>
            {"\""} {transcript} {"\""}
          </Text>

        </View>
      ) : null}

      {/* Manual Input Fallback */}
      <View style={styles.fallbackContainer}>
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: themeStyles.background, 
              color: themeStyles.text, 
              borderColor: themeStyles.border,
              fontSize: 16
            }
          ]}
          placeholder="Or type voice command..."
          placeholderTextColor={themeStyles.textMuted}
          value={manualText}
          onChangeText={setManualText}
          onSubmitEditing={handleManualSubmit}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: themeStyles.primary }]}
          onPress={handleManualSubmit}
        >
          <MaterialIcons name="send" size={20} color={themeStyles.highContrast ? "#000" : "#FFF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  micStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 65,
    marginVertical: 10,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 8,
    transition: 'height 0.15s ease',
  },
  transcriptBox: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  fallbackContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
