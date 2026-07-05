import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const { width } = Dimensions.get('window');

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon, color }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardAlt }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.unit, { color: colors.subtext }]}>{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 24,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    marginRight: 4,
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
  },
});

export default MetricCard;
