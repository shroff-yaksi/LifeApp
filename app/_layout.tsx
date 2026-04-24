import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  useEffect(() => {
    // When user taps an alarm notification → open music deep link
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'alarm' && data?.musicUri) {
        Linking.openURL(data.musicUri).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.bg} translucent={false} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="timer" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
