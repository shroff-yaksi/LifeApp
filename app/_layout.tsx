import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="timer" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
