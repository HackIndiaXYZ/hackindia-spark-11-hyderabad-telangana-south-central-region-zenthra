import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolateColor
} from 'react-native-reanimated';

interface DigitalTwinHeartProps {
  bpm: number;
  riskScore: number;
  isDisconnected?: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DigitalTwinHeart: React.FC<DigitalTwinHeartProps> = ({ bpm, riskScore, isDisconnected }) => {
  const pulse = useSharedValue(1);
  const breathing = useSharedValue(1);
  
  useEffect(() => {
    // Pulse animation synchronized with BPM
    const duration = (60 / Math.max(bpm, 40)) * 1000;
    pulse.value = withRepeat(
      withTiming(1.08, { duration: duration / 2, easing: Easing.out(Easing.quad) }),
      -1,
      true
    );

    // Gentle breathing animation
    breathing.value = withRepeat(
      withTiming(1.03, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [bpm]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * breathing.value }],
  }));

  const getThemeColors = () => {
    if (isDisconnected) return ['#94a3b8', '#475569'];
    if (riskScore > 70) return ['#f87171', '#991b1b'];
    if (riskScore > 40) return ['#fbbf24', '#92400e'];
    return ['#ef4444', '#dc2626']; // Medical Red
  };

  const colors = getThemeColors();
  
  // High-fidelity physiological heart path
  const heartPath = "M50 30C50 25 45 15 30 15C10 15 10 42.5 10 42.5C10 60 30 80 50 95C70 80 90 60 90 42.5C90 42.5 90 15 70 15C55 15 50 25 50 30Z";

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <Svg height="250" width="250" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="grad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors[0]} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="45" fill="url(#grad)" />
        </Svg>
      </View>

      {/* Animated Heart */}
      <Animated.View style={[styles.heartWrapper, animatedStyle]}>
        <Svg height="180" width="180" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="heartGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </RadialGradient>
          </Defs>
          <Path
            d={heartPath}
            fill="url(#heartGrad)"
            stroke={colors[1]}
            strokeWidth="0.5"
          />
          {/* Internal Detail/Vessels */}
          <Path
            d="M50 35C45 40 45 50 50 60"
            fill="none"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Tech-Halo Ring */}
      <View style={styles.haloContainer}>
        <Svg height="250" width="250" viewBox="0 0 100 100">
          <Circle 
            cx="50" 
            cy="50" 
            r="48" 
            fill="none" 
            stroke={colors[0]} 
            strokeWidth="0.5" 
            strokeDasharray="2,4" 
            opacity="0.3"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
  },
  heartWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  haloContainer: {
    position: 'absolute',
  }
});

export default DigitalTwinHeart;
