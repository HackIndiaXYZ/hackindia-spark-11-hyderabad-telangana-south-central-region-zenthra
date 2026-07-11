import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export let isHapticAssuranceEnabled = true;

export function setHapticAssuranceEnabled(enabled: boolean) {
  isHapticAssuranceEnabled = enabled;
}

// Accidental double tap tremor dampening jitter filter state
let lastTap = 0;
export function withTremorFilter(handler: (...args: any[]) => void) {
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastTap < 250) {
      console.log("[TremorFilter] Ignored accidental double-tap / jitter");
      return;
    }
    lastTap = now;
    handler(...args);
  };
}

// Web Audio API Synthesizer for high-quality audio confirmation on Web
function playWebSound(type: 'tick' | 'chime' | 'alert') {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'chime') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    console.warn("Web Audio play failed:", e);
  }
}

// Bimodal confirm action
export async function confirmAction() {
  if (!isHapticAssuranceEnabled) return;
  if (Platform.OS === 'web') {
    playWebSound('tick');
  } else {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      // Fallback voice tick tone on mobile if audio file isn't loaded
      Speech.speak("Tick", { rate: 2.0, volume: 0.1 });
    } catch (e) {}
  }
}

// Bimodal success action
export async function successAction() {
  if (!isHapticAssuranceEnabled) return;
  if (Platform.OS === 'web') {
    playWebSound('chime');
  } else {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Success", { rate: 1.0 });
    } catch (e) {}
  }
}

// Continuous alert patterns
let emergencyInterval: any = null;
export function startEmergencyHaptics() {
  if (!isHapticAssuranceEnabled) return;
  if (emergencyInterval) return;

  const trigger = async () => {
    if (Platform.OS === 'web') {
      playWebSound('alert');
    } else {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }
  };

  trigger();
  emergencyInterval = setInterval(trigger, 300);
}

export function stopEmergencyHaptics() {
  if (emergencyInterval) {
    clearInterval(emergencyInterval);
    emergencyInterval = null;
  }
}

// Tab switched haptic tick
export async function tabSwitch() {
  if (!isHapticAssuranceEnabled) return;
  if (Platform.OS === 'web') {
    playWebSound('tick');
  } else {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  }
}
