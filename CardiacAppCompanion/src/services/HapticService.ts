import * as Haptics from 'expo-haptics';

class HapticService {
  triggerImpact() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  triggerSuccess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  triggerError() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  triggerWarning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

export default new HapticService();
