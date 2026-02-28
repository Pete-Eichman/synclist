import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@synclist/offlineQueue';

// Appends one action to the end of the persisted queue.
export async function enqueue(action: object): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: object[] = raw ? (JSON.parse(raw) as object[]) : [];
  queue.push(action);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Clears the queue and calls send() for each action in order.
export async function flush(send: (action: object) => void): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;
  const queue = JSON.parse(raw) as object[];
  await AsyncStorage.removeItem(QUEUE_KEY);
  for (const action of queue) {
    send(action);
  }
}
