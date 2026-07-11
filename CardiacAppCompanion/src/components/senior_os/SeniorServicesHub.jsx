import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccessibility } from './SeniorAccessibilityProvider';
import * as Speech from 'expo-speech';
import { confirmAction, successAction, withTremorFilter } from '../../utils/hapticsEngine';

const SCHEMES = [
  {
    id: 'pmvvy',
    name: 'LIC PMVVY (Pradhan Mantri Vaya Vandana Yojana)',
    desc: 'Government pension scheme for senior citizens offering guaranteed 7.4% returns.',
    benefits: 'Monthly pension payout, capital guarantee.',
    minAge: 60,
    maxIncome: 'Any',
    requiredHealth: 'Any'
  },
  {
    id: 'ayushman',
    name: 'Ayushman Bharat Senior Health Coverage',
    desc: 'Free health cover up to ₹5 Lakhs per family per year for all senior citizens.',
    benefits: 'Cashless treatment at all empanelled public and private hospitals.',
    minAge: 60,
    maxIncome: 'Low/Medium',
    requiredHealth: 'Any'
  },
  {
    id: 'aidpass',
    name: 'Hospital Senior Aid & OPD Discount Pass',
    desc: 'Priority passes offering 50% discount on diagnostic tests and consultation fees.',
    benefits: 'No wait times in OPD queues, affordable cardiac test packages.',
    minAge: 65,
    maxIncome: 'Any',
    requiredHealth: 'Chronic/Critical'
  }
];

export default function SeniorServicesHub() {
  const { themeStyles, getResponsiveStyle } = useAccessibility();

  // 1. Eligibility States
  const [age, setAge] = useState('68');
  const [income, setIncome] = useState('Low'); // Low, Medium, High
  const [healthStatus, setHealthStatus] = useState('Chronic'); // Normal, Chronic, Critical

  // 2. Appointment Wizard States
  const [wizardStep, setWizardStep] = useState(1); // 1: Specialty, 2: Time, 3: Confirmed
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reminderAdded, setReminderAdded] = useState(false);

  const specialties = [
    { id: 'cardio', name: 'Cardiologist (Heart Specialist)', doctor: 'Dr. Srinivas Rao' },
    { id: 'ortho', name: 'Orthopedic (Bone & Joint)', doctor: 'Dr. Anita Desai' },
    { id: 'general', name: 'General Physician (Routine Checkup)', doctor: 'Dr. Mohan Kumar' }
  ];

  const timeSlots = [
    'Today, 11:30 AM',
    'Today, 03:00 PM',
    'Tomorrow, 10:00 AM'
  ];

  // Helper to check scheme eligibility
  const isEligible = (scheme) => {
    const numAge = parseInt(age, 10) || 0;
    if (numAge < scheme.minAge) return false;
    
    if (scheme.id === 'ayushman') {
      if (income === 'High') return false;
    }
    
    if (scheme.id === 'aidpass') {
      if (numAge < 65 && healthStatus === 'Normal') return false;
    }
    
    return true;
  };

  const handleSpeechReminder = () => {
    setReminderAdded(true);
    const msg = `Voice reminder set for your appointment with ${selectedSpecialty} on ${selectedTime}.`;
    Speech.speak(msg, { rate: 0.95 });
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedSpecialty('');
    setSelectedTime('');
    setReminderAdded(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* SECTION 1: ELIGIBILITY CHECKER */}
      <View style={[styles.sectionCard, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="verified-user" size={26} color={themeStyles.accent} />
          <Text style={[getResponsiveStyle(18, true), { fontWeight: '900', color: themeStyles.text, marginLeft: 8 }]}>
            Welfare Scheme Eligibility
          </Text>
        </View>

        <Text style={[getResponsiveStyle(13), { color: themeStyles.textMuted, marginBottom: 15, fontWeight: '500' }]}>
          Adjust details below to see which government schemes Jane qualifies for:
        </Text>

        {/* Inputs */}
        <View style={styles.inputsGrid}>
          <View style={styles.inputWrapper}>
            <Text style={[getResponsiveStyle(12), { fontWeight: '800', color: themeStyles.textMuted, marginBottom: 4 }]}>AGE</Text>
            <TextInput
              keyboardType="numeric"
              maxLength={3}
              style={[
                styles.ageInput, 
                { 
                  backgroundColor: themeStyles.background, 
                  color: themeStyles.text, 
                  borderColor: themeStyles.border,
                  fontSize: 18,
                  borderWidth: 2,
                }
              ]}
              value={age}
              onChangeText={setAge}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[getResponsiveStyle(12), { fontWeight: '800', color: themeStyles.textMuted, marginBottom: 4 }]}>INCOME LEVEL</Text>
            <View style={styles.optionsRow}>
              {['Low', 'High'].map((inc) => (
                <TouchableOpacity
                  key={inc}
                  style={[
                    styles.optionBtn,
                    { 
                      backgroundColor: income === inc ? themeStyles.primary : themeStyles.background,
                      borderColor: themeStyles.border,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={withTremorFilter(() => {
                    confirmAction();
                    setIncome(inc);
                  })}
                >
                  <Text style={[getResponsiveStyle(12), { fontWeight: '900', color: income === inc ? '#FFF' : themeStyles.text }]}>
                    {inc.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[getResponsiveStyle(12), { fontWeight: '800', color: themeStyles.textMuted, marginBottom: 4 }]}>HEALTH STATUS</Text>
            <View style={styles.optionsRow}>
              {['Normal', 'Chronic'].map((hlth) => (
                <TouchableOpacity
                  key={hlth}
                  style={[
                    styles.optionBtn,
                    { 
                      backgroundColor: healthStatus === hlth ? themeStyles.primary : themeStyles.background,
                      borderColor: themeStyles.border,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={withTremorFilter(() => {
                    confirmAction();
                    setHealthStatus(hlth);
                  })}
                >
                  <Text style={[getResponsiveStyle(12), { fontWeight: '900', color: healthStatus === hlth ? '#FFF' : themeStyles.text }]}>
                    {hlth.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Schemes Results List */}
        <View style={styles.schemesList}>
          {SCHEMES.map((scheme) => {
            const eligible = isEligible(scheme);
            return (
              <View 
                key={scheme.id} 
                style={[
                  styles.schemeCard, 
                  { 
                    backgroundColor: themeStyles.background, 
                    borderColor: eligible ? themeStyles.accent : themeStyles.border,
                    borderWidth: 2,
                  }
                ]}
              >
                <View style={styles.schemeCardHeader}>
                  <Text style={[getResponsiveStyle(15, true), { fontWeight: '900', color: themeStyles.text, flex: 1 }]}>
                    {scheme.name}
                  </Text>
                  <View 
                    style={[
                      styles.statusBadge, 
                      { backgroundColor: eligible ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                    ]}
                  >
                    <Text style={[getResponsiveStyle(11), { fontWeight: '900', color: eligible ? '#16a34a' : '#ef4444' }]}>
                      {eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </Text>
                  </View>
                </View>

                <Text style={[getResponsiveStyle(13), { color: themeStyles.textMuted, marginTop: 6, fontWeight: '500' }]}>
                  {scheme.desc}
                </Text>
                <Text style={[getResponsiveStyle(12), { color: themeStyles.accent, fontWeight: '700', marginTop: 4 }]}>
                  🎁 Benefits: {scheme.benefits}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTION 2: APPOINTMENT WIZARD */}
      <View style={[styles.sectionCard, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="local-hospital" size={26} color={themeStyles.primary} />
          <Text style={[getResponsiveStyle(18, true), { fontWeight: '900', color: themeStyles.text, marginLeft: 8 }]}>
            Quick Doctor Appointment
          </Text>
        </View>

        {wizardStep === 1 && (
          <View>
            <Text style={[getResponsiveStyle(14), { color: themeStyles.text, fontWeight: '800', marginBottom: 12 }]}>
              Step 1: Choose Medical Specialty
            </Text>
            {specialties.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.wizardRow, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
                onPress={withTremorFilter(() => {
                  confirmAction();
                  setSelectedSpecialty(s.name);
                  setWizardStep(2);
                })}
              >
                <View>
                  <Text style={[getResponsiveStyle(15, true), { fontWeight: '900', color: themeStyles.text }]}>
                    {s.name}
                  </Text>
                  <Text style={[getResponsiveStyle(13), { color: themeStyles.accent, fontWeight: '700', marginTop: 2 }]}>
                    Doctor: {s.doctor}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={themeStyles.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {wizardStep === 2 && (
          <View>
            <Text style={[getResponsiveStyle(14), { color: themeStyles.text, fontWeight: '800', marginBottom: 12 }]}>
              Step 2: Select Time Slot for {selectedSpecialty}
            </Text>
            {timeSlots.map((time, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.wizardRow, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
                onPress={withTremorFilter(() => {
                  confirmAction();
                  setSelectedTime(time);
                  setWizardStep(3);
                })}
              >
                <Text style={[getResponsiveStyle(15, true), { fontWeight: '900', color: themeStyles.text }]}>
                  {time}
                </Text>
                <MaterialIcons name="alarm" size={24} color={themeStyles.primary} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.backBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
              onPress={withTremorFilter(() => {
                confirmAction();
                setWizardStep(1);
              })}
            >
              <Text style={[getResponsiveStyle(13), { color: themeStyles.textMuted, fontWeight: '900' }]}>
                ◀ GO BACK
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {wizardStep === 3 && (
          <View style={styles.confirmContainer}>
            <View style={styles.successIconWrapper}>
              <MaterialIcons name="check-circle" size={54} color="#16a34a" />
            </View>

            <Text style={[getResponsiveStyle(18, true), { fontWeight: '900', color: themeStyles.text, textAlign: 'center', marginVertical: 8 }]}>
              Appointment Scheduled!
            </Text>
            
            <View style={[styles.bookingCard, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
              <Text style={[getResponsiveStyle(14), { color: themeStyles.textMuted, fontWeight: '700' }]}>SPECIALTY</Text>
              <Text style={[getResponsiveStyle(15, true), { color: themeStyles.text, fontWeight: '900', marginVertical: 4 }]}>
                {selectedSpecialty}
              </Text>
              <Text style={[getResponsiveStyle(14), { color: themeStyles.textMuted, fontWeight: '700', marginTop: 10 }]}>CONFIRMED TIME</Text>
              <Text style={[getResponsiveStyle(15, true), { color: themeStyles.accent, fontWeight: '900', marginVertical: 4 }]}>
                {selectedTime}
              </Text>
            </View>

            {reminderAdded ? (
              <View style={[styles.reminderAlert, { backgroundColor: 'rgba(22, 163, 74, 0.15)', borderColor: '#16a34a' }]}>
                <MaterialIcons name="volume-up" size={20} color="#16a34a" />
                <Text style={[getResponsiveStyle(13), { color: '#16a34a', fontWeight: '900', marginLeft: 8 }]}>
                  Added to Voice Reminders!
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.voiceReminderBtn, { backgroundColor: themeStyles.primary }]}
                onPress={withTremorFilter(() => {
                  successAction();
                  handleSpeechReminder();
                })}
              >
                <MaterialIcons name="keyboard-voice" size={24} color={themeStyles.mode === 'light' ? '#FFF' : '#000'} />
                <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.mode === 'light' ? '#FFF' : '#000', marginLeft: 8 }]}>
                  ADD TO VOICE REMINDERS
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}
              onPress={withTremorFilter(() => {
                confirmAction();
                resetWizard();
              })}
            >
              <Text style={[getResponsiveStyle(13), { color: themeStyles.text, fontWeight: '900' }]}>
                BOOK ANOTHER APPOINTMENT
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'column',
  },
  ageInput: {
    height: 50,
    width: 80,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  schemesList: {
    gap: 12,
  },
  schemeCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 16,
  },
  schemeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wizardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginVertical: 6,
    height: 70,
  },
  backBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  confirmContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  successIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginVertical: 12,
  },
  voiceReminderBtn: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  reminderAlert: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  resetBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
});
