import React from 'react';
import { TouchableOpacity, StyleSheet, Alert, Vibration, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCardiacData } from '../src/context/CardiacDataContext';
import * as Haptics from 'expo-haptics';

export default function SOSButton() {
  const { triggerEmergency, liveState } = useCardiacData();

  const handlePress = () => {
    if (liveState.emergency_active) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    triggerEmergency(true);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, liveState.emergency_active && { display: 'none' }]} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      <MaterialIcons name="emergency" size={28} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85, 
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999, 
  },
});
