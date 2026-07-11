import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccessibility } from './SeniorAccessibilityProvider';

const MOCK_PHARMACIES = [
  { name: 'Apollo Pharmacy Secunderabad', baseDist: 320, latOffset: 0.002, lngOffset: -0.001, address: 'Metro Station Pillar 20, Secunderabad' },
  { name: 'MedPlus Drug Store', baseDist: 580, latOffset: -0.004, lngOffset: 0.003, address: 'General Bazar Road, Secunderabad' },
  { name: 'Care Pharmacy & Surgicals', baseDist: 1100, latOffset: 0.008, lngOffset: 0.006, address: 'St Johns Road, Near YMCA' }
];

export default function SeniorCompanionChat({ lastVoiceResult, onSendQuery }) {
  const { themeStyles, getResponsiveStyle, fontSize } = useAccessibility();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello Jane. I am here to help you today. You can ask me about nearby stores, your medicine times, or contact your family.' }
  ]);
  const [coords, setCoords] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [showPharmacyList, setShowPharmacyList] = useState(false);

  // Listen to outer voice commands processed by the main dashboard
  useEffect(() => {
    if (lastVoiceResult) {
      // Add senior message
      const seniorMsg = { id: Date.now(), sender: 'senior', text: lastVoiceResult.transcript };
      
      // Add AI reply message
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: lastVoiceResult.ai_response_text };
      
      setMessages(prev => [...prev, seniorMsg, aiMsg]);

      // If query was about pharmacies, trigger pharmacy location load
      if (lastVoiceResult.transcript.toLowerCase().includes('pharmacy') || lastVoiceResult.transcript.toLowerCase().includes('medical store') || lastVoiceResult.transcript.toLowerCase().includes('shop')) {
        loadPharmacies();
      }
    }
  }, [lastVoiceResult]);

  const loadPharmacies = () => {
    setShowPharmacyList(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          // simulate calculating distances based on current coordinates
          const updated = MOCK_PHARMACIES.map(p => ({
            ...p,
            distance: Math.round(p.baseDist + (Math.random() * 80 - 40))
          }));
          setPharmacies(updated);
        },
        (error) => {
          console.log("Geolocation error, using Secunderabad fallback", error);
          setCoords({ latitude: 17.4399, longitude: 78.4983 });
          setPharmacies(MOCK_PHARMACIES.map(p => ({ ...p, distance: p.baseDist })));
        }
      );
    } else {
      setCoords({ latitude: 17.4399, longitude: 78.4983 });
      setPharmacies(MOCK_PHARMACIES.map(p => ({ ...p, distance: p.baseDist })));
    }
  };

  const handleChipClick = (queryText) => {
    onSendQuery(queryText);
  };

  const handleNavigate = (pharmacy) => {
    const lat = coords ? coords.latitude + pharmacy.latOffset : 17.4399;
    const lng = coords ? coords.longitude + pharmacy.lngOffset : 78.4983;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(pharmacy.name)}`,
      android: `google.navigation:q=${lat},${lng}(${encodeURIComponent(pharmacy.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    });
    
    Linking.openURL(url).catch(err => {
      alert(`Could not open navigation map. Target Address: ${pharmacy.address}`);
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.chatArea} 
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View 
            key={m.id} 
            style={[
              styles.messageBubble, 
              m.sender === 'ai' 
                ? [styles.aiBubble, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]
                : [styles.seniorBubble, { backgroundColor: themeStyles.primary }]
            ]}
          >
            <View style={styles.bubbleHeader}>
              <MaterialIcons 
                name={m.sender === 'ai' ? 'face' : 'person'} 
                size={22} 
                color={m.sender === 'ai' ? themeStyles.accent : (themeStyles.highContrast ? '#000' : '#FFF')} 
              />
              <Text 
                style={[
                  getResponsiveStyle(12), 
                  { 
                    fontWeight: '900', 
                    color: m.sender === 'ai' ? themeStyles.accent : (themeStyles.highContrast ? '#000' : '#FFF'),
                    marginLeft: 6 
                  }
                ]}
              >
                {m.sender === 'ai' ? 'COMPANION' : 'JANE'}
              </Text>
            </View>
            <Text 
              style={[
                getResponsiveStyle(16), 
                { 
                  color: m.sender === 'ai' ? themeStyles.text : (themeStyles.highContrast ? '#000' : '#FFF'),
                  fontWeight: '600',
                  marginTop: 6
                }
              ]}
            >
              {m.text}
            </Text>
          </View>
        ))}

        {/* Geolocation Pharmacies */}
        {showPharmacyList && (
          <View style={[styles.pharmacySection, { borderColor: themeStyles.border, backgroundColor: themeStyles.cardBackground }]}>
            <View style={styles.pharmacyHeader}>
              <MaterialIcons name="local-pharmacy" size={24} color="#ef4444" />
              <Text style={[getResponsiveStyle(16), { fontWeight: '900', color: themeStyles.text, marginLeft: 8 }]}>
                Nearby Medical Stores
              </Text>
            </View>
            <Text style={[getResponsiveStyle(12), { color: themeStyles.textMuted, marginBottom: 15 }]}>
              {coords ? `Showing stores closest to your current location.` : `No GPS access. Showing stores near Secunderabad.`}
            </Text>

            {pharmacies.map((p, idx) => (
              <View key={idx} style={[styles.pharmacyCard, { backgroundColor: themeStyles.background, borderColor: themeStyles.border }]}>
                <View style={styles.pharmacyInfo}>
                  <Text style={[getResponsiveStyle(15), { fontWeight: '800', color: themeStyles.text }]}>
                    {p.name}
                  </Text>
                  <Text style={[getResponsiveStyle(13), { color: themeStyles.accent, fontWeight: '700', marginTop: 2 }]}>
                    📍 Distance: {p.distance} meters
                  </Text>
                  <Text style={[getResponsiveStyle(11), { color: themeStyles.textMuted, marginTop: 4 }]} numberOfLines={1}>
                    {p.address}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.navigateBtn, { backgroundColor: themeStyles.primary }]}
                  onPress={() => handleNavigate(p)}
                >
                  <MaterialIcons name="directions" size={24} color={themeStyles.highContrast ? "#000" : "#FFF"} />
                  <Text style={[getResponsiveStyle(12), { fontWeight: '900', color: themeStyles.highContrast ? "#000" : "#FFF", marginLeft: 4 }]}>
                    NAVIGATE
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quick Action Chips (Strict minimum size of 60x60 pixels overall container target / generous spacing) */}
      <View style={styles.chipsContainer}>
        <TouchableOpacity 
          style={[styles.chip, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]} 
          onPress={() => handleChipClick("Where are my nearby pharmacies?")}
        >
          <MaterialIcons name="local-pharmacy" size={24} color="#ef4444" style={styles.chipIcon} />
          <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.text }]}>
            Find Pharmacy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.chip, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]} 
          onPress={() => handleChipClick("Remind me about my medicine")}
        >
          <MaterialIcons name="alarm" size={24} color="#3b82f6" style={styles.chipIcon} />
          <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.text }]}>
            Medicine Times
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.chip, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]} 
          onPress={() => handleChipClick("Notify my family to call me")}
        >
          <MaterialIcons name="family-restroom" size={24} color="#10b981" style={styles.chipIcon} />
          <Text style={[getResponsiveStyle(14), { fontWeight: '900', color: themeStyles.text }]}>
            Message Family
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatScroll: {
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 24,
    marginVertical: 8,
    maxWidth: '85%',
    borderWidth: 1,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  seniorBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 65, // enforcing minimum 60px target
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  chipIcon: {
    marginBottom: 2,
  },
  pharmacySection: {
    marginTop: 15,
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pharmacyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
  },
  pharmacyInfo: {
    flex: 1,
    paddingRight: 10,
  },
  navigateBtn: {
    width: 100,
    height: 60, // enforcing minimum 60px target
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
});
