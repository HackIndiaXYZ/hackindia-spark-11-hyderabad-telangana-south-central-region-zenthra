import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmergencyCardProps {
  onDismiss: () => void;
}

export default function EmergencyCard({ onDismiss }: EmergencyCardProps) {
  const { colors } = useTheme();

  return (
    <Modal animationType="slide" transparent={true} visible={true}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="medical-services" size={24} color="#EF4444" />
              <Text style={[styles.title, { color: colors.text }]}>MEDICAL ID</Text>
            </View>
            <TouchableOpacity onPress={onDismiss}>
              <MaterialIcons name="close" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>PATIENT INFO</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.subtext }]}>NAME:</Text>
                <Text style={[styles.value, { color: colors.text }]}>John Doe</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.subtext }]}>AGE/SEX:</Text>
                <Text style={[styles.value, { color: colors.text }]}>68 / Male</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.subtext }]}>BLOOD TYPE:</Text>
                <Text style={[styles.value, { color: '#EF4444', fontWeight: 'bold' }]}>O Positive</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>CONDITIONS</Text>
              <Text style={[styles.text, { color: colors.text }]}>
                • Chronic Heart Failure (Grade II){"\n"}
                • Hypertension{"n"}
                • Type 2 Diabetes
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>EMERGENCY CONTACTS</Text>
              <View style={[styles.contactCard, { backgroundColor: colors.cardAlt }]}>
                <Text style={[styles.contactName, { color: colors.text }]}>Jane Doe (Wife)</Text>
                <Text style={[styles.contactPhone, { color: colors.primary }]}>+91 98765 43210</Text>
              </View>
              <View style={[styles.contactCard, { backgroundColor: colors.cardAlt }]}>
                <Text style={[styles.contactName, { color: colors.text }]}>Dr. Smith (Cardiologist)</Text>
                <Text style={[styles.contactPhone, { color: colors.primary }]}>+91 12345 67890</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.sosBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => {}}
          >
            <MaterialIcons name="call" size={20} color="#FFF" />
            <Text style={styles.sosText}>CALL EMERGENCY SERVICES</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '600',
  },
  sosBtn: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sosText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
