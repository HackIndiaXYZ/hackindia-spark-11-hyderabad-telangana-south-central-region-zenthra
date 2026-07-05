// Mock AudioService - actual implementation would load assets
class AudioService {
  async loadSounds() {
    console.log("Audio sounds loaded (mock)");
  }

  async playCritical() {
    console.log("Playing critical alert sound");
  }

  async playCaution() {
    console.log("Playing caution sound");
  }

  stopAll() {
    console.log("Stopping all sounds");
  }

  async playNormal() {
    console.log("Playing normal background sound");
  }
}

export default new AudioService();
