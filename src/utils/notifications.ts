import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getData } from './storage';
import { DEFAULT_REMINDER_SETTINGS } from '../constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAllReminders(): Promise<boolean> {
  const granted = await requestPermissions();
  if (!granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const s = await getData('reminderSettings', DEFAULT_REMINDER_SETTINGS);

  // Water reminders — schedule one per interval slot throughout the day
  if (Number(s.waterIntervalMins) > 0) {
    const [startH, startM] = (s.waterStart as string).split(':').map(Number);
    const [endH, endM] = (s.waterEnd as string).split(':').map(Number);
    let cur = startH * 60 + startM + Number(s.waterIntervalMins);
    const end = endH * 60 + endM;
    while (cur <= end) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Drink Water', body: 'Stay hydrated! Time for a glass of water.', sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: Math.floor(cur / 60),
          minute: cur % 60,
        },
      });
      cur += Number(s.waterIntervalMins);
    }
  }

  // Sleep wind-down
  const [slH, slM] = (s.sleepReminder as string).split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: { title: '😴 Wind Down', body: "Start winding down for a good night's sleep.", sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: slH,
      minute: slM,
    },
  });

  // Skincare
  const [skH, skM] = (s.skincareTime as string).split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: { title: '✨ Skincare', body: 'Morning skincare routine — look good, feel good!', sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: skH,
      minute: skM,
    },
  });

  // Journal reminder
  const [jH, jM] = (s.journalTime as string).split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: { title: '📓 Journal Time', body: "Take 5 minutes to reflect on your day. How did it go?", sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: jH,
      minute: jM,
    },
  });

  return true;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(): Promise<void> {
  await requestPermissions();
  await Notifications.scheduleNotificationAsync({
    content: { title: '🔔 Notifications Active', body: 'Your LifeOS reminders are working!', sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}
