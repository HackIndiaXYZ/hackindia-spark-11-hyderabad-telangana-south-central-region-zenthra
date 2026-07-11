import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SeniorOSMainView from './SeniorOSMainView';

export default function SeniorOSOverlayTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="accessibility-new" size={24} color="#000" />
        <Text style={styles.buttonText}>Senior OS Mode</Text>
      </TouchableOpacity>

      {/* FULL SCREEN SENIOR OS MODAL OVERLAY */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <SeniorOSMainView onClose={() => setIsOpen(false)} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90,
    right: 16,
    backgroundColor: '#FFD700', // High contrast yellow
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 99999, // Ensure it sits on top of everything
    borderWidth: 2,
    borderColor: '#000', // High contrast border
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000', // Match base dark theme / high contrast
  },
});
