import * as Speech from 'expo-speech';

class VoiceService {
  speakAlert(message: string) {
    Speech.speak(message, {
      pitch: 1.0,
      rate: 0.9,
    });
  }

  speak(message: string) {
    Speech.speak(message);
  }

  stop() {
    Speech.stop();
  }
}

export default new VoiceService();
