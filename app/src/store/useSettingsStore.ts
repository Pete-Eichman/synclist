import { create } from 'zustand';

interface SettingsStore {
  displayName: string;
  deviceId: string;
  setDisplayName: (name: string) => void;
  setDeviceId: (id: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  displayName: '',
  deviceId: '',
  setDisplayName: (displayName) => set({ displayName }),
  setDeviceId: (deviceId) => set({ deviceId }),
}));
