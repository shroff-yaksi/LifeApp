import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getData<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export async function setData(key: string, val: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage write failed:', key, e);
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function getAllKeys(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  } catch {
    return [];
  }
}

export async function exportAllData(): Promise<Record<string, any>> {
  const keys = await getAllKeys();
  const data: Record<string, any> = {};
  for (const key of keys) {
    data[key] = await getData(key, null);
  }
  return data;
}

export async function importAllData(data: Record<string, any>): Promise<void> {
  const entries = Object.entries(data).map(([key, val]) => [key, JSON.stringify(val)] as [string, string]);
  await AsyncStorage.multiSet(entries);
}
