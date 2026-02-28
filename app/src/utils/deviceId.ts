import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '@synclist/deviceId';
const DISPLAY_NAME_KEY = '@synclist/displayName';

// Generates a random friendly name for first-time users
function randomDisplayName(): string {
  const adjectives = ['Swift', 'Calm', 'Bold', 'Quiet', 'Bright', 'Keen', 'Warm', 'Cool'];
  const nouns = ['Otter', 'Crane', 'Finch', 'Lynx', 'Raven', 'Fox', 'Hawk', 'Bear'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = uuidv4();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function getOrCreateDisplayName(): Promise<string> {
  const existing = await AsyncStorage.getItem(DISPLAY_NAME_KEY);
  if (existing) return existing;

  const name = randomDisplayName();
  await AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
  return name;
}

export async function setDisplayName(name: string): Promise<void> {
  await AsyncStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}
