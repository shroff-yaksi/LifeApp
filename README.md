# LifeOS — Personal Life Tracking App

A fully local, privacy-first iOS app to track everything that matters in your daily life — habits, fitness, learning, skills, journal, finances, and more. No accounts. No cloud. Your data stays on your device.

Built with React Native + Expo. Open source and designed to be personalized.

---

## What it does

| Tab | What you track |
|-----|----------------|
| 🏠 Dashboard | Today's schedule, habits, water, cigarettes, pomodoros, weekly goals |
| 📅 Schedule | Recurring weekly schedule templates (Weekday / Saturday / Sunday) |
| 💪 Fitness | Weight, sleep, meals, diet deviations, activity hours |
| 📚 Learning | Study hours by domain with a weekly rotation system |
| 🎸 Skills | Practice hours and self-assessed skill levels |
| 📓 Journal | Daily notes + mood tracking with past entry navigation |
| 💰 Finance | Daily expenses, monthly budgets, net worth tracking |
| 📊 Analytics | Monthly charts, habit heatmap, automated insights |
| ⚙️ Settings | Reminders, weekly goals, custom habits, data export |
| 🍅 Focus Timer | Pomodoro timer accessible from any screen |

Everything is stored locally using AsyncStorage — no backend, no login, no subscription.

---

## Make it yours

This app was built around one person's life. To personalize it for yourself, here are the key things to change:

### Habits
Edit the default habits in `src/constants/theme.ts`:
```ts
export const DEFAULT_HABITS = [
  'Gym', 'Walking', 'Swimming', 'Reading', 'Healthy Diet', 'Skincare', 'Journalling',
];
```
Replace with whatever daily habits matter to you.

### Learning domains & rotation
The weekly study rotation is in `src/constants/theme.ts`:
```ts
export const LEARNING_ROTATION: Record<number, string[]> = {
  1: ['Stock Market', 'Forex'],       // Monday
  2: ['Quant Finance', 'AI'],         // Tuesday
  3: ['Research Work', 'Stock Market'], // Wednesday
  4: ['Forex', 'Quant Finance'],      // Thursday
  5: ['AI', 'Research Work'],         // Friday
};
```
Change the domains and days to match your own study plan.

### Skills
Edit the skill list in `src/constants/theme.ts`:
```ts
export const SKILL_LIST = ['Guitar', 'Kathak', 'Cooking', 'Sports'];
```
Add or replace with the skills you're building.

### Weekly goals
Default targets for gym sessions, study hours, sleep, water, etc. are in `src/constants/theme.ts` under `DEFAULT_GOALS`. You can also change them at runtime in the Settings tab.

### Schedule
Build your own daily schedule in the Schedule tab — it supports separate templates for Weekdays, Saturdays, and Sundays, with categories like fitness, work, learning, personal, meals, sleep, and skill practice.

### Colors & theme
The full design system lives in `src/constants/theme.ts`. Colors, category mappings, and default reminder times are all in one place.

---

## Running locally

### Prerequisites
- Node.js 18+
- Xcode 15+ (for iOS)
- CocoaPods

### Setup
```bash
git clone https://github.com/shroff-yaksi/LifeApp.git
cd LifeApp
npm install
```

### Run on iOS Simulator
```bash
npx expo run:ios
```

### Run on your iPhone
```bash
npx expo run:ios --device "<your-device-udid>" --configuration Release
```

> **Note:** On first run, go to **Settings → General → VPN & Device Management** on your iPhone and trust the developer certificate.

---

## Data & privacy

All data is stored on-device using AsyncStorage. Nothing is ever sent anywhere. You can export a full JSON backup from the Settings tab, or clear all data if needed.

---

## Tech stack

- [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- [Expo Router](https://expo.github.io/router) for navigation
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for local data
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) for charts
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) for local reminders

---

## License

MIT - use it, fork it, make it yours.
