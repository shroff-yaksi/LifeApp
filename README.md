# LifeOS — Personal Life Tracking App

A fully local, privacy-first mobile app to track everything that matters in your daily life — habits, fitness, learning, skills, journal, finances, and more. No accounts. No cloud. Your data stays on your device.

Built with React Native + Expo. Open source and designed to be personalized.

---

## What it does

| Tab | What you track |
|-----|----------------|
| ⚡ Dashboard | Greeting, habit + schedule progress, today's tasks, quick tracking (water/cigs/pomodoro), missed tasks |
| ✅ Tasks | Daily habits checklist, fixed weekly schedule, manual ad-hoc tasks |
| 💪 Fitness | Activity logs (gym/walk/swim), body stats (weight/sleep), meals, diet deviations, cigarettes, weekly charts |
| 📚 Learning | Study hours by course, daily rotation, study progress, recent logs, weekly chart, customizable rotation |
| 🎸 Skills | Practice hours, skill self-assessment, practice log, weekly chart |
| 📓 Journal | Daily notes + mood tracking with past entry navigation |
| ⚙️ Settings | Reminders, weekly goals, custom habits, schedule templates, data export |

Everything is stored locally using AsyncStorage — no backend, no login, no subscription.

---

## Features

- **Pull-to-refresh** on all screens
- **Date navigation** (arrow buttons) across Fitness, Learning, and Skills tabs
- **Manage modal** on Fitness, Learning, and Skills — tap ⚙️ at the bottom to log data, manage courses/skills, and edit your learning rotation
- **Customizable learning rotation** — edit which subjects go on which day/block directly in the app (Learning → ⚙️ Manage)
- **Tasks tab** — combines daily habits, your fixed schedule, and freeform manual tasks in one place
- **Simplified dashboard** — focused on today: progress bars, schedule overview, and quick tracking
- **Color-coded tabs** — Dashboard (indigo), Tasks (blue), Fitness (green), Learning (orange), Skills (pink), Journal (pink), Finance (teal)
- **Pomodoro timer** accessible from all tab headers
- **Local notifications** for journal reminders
- **Full JSON data export** from Settings

---

## Make it yours

### Habits
Edit the default habits in `src/constants/theme.ts`:
```ts
export const DEFAULT_HABITS = [
  'Gym', 'Walking', 'Swimming', 'Reading', 'Healthy Diet', 'Skincare', 'Journalling',
];
```

### Learning rotation (default)
The default weekly rotation is in `src/constants/theme.ts` — but you can now edit it live inside the app (Learning tab → ⚙️ Manage → Weekly Rotation section):
```ts
export const LEARNING_ROTATION: Record<number, string[]> = {
  1: ['Stock Market', 'Forex'],           // Monday
  2: ['Quant Finance', 'AI'],             // Tuesday
  3: ['Research Work', 'Stock Market'],   // Wednesday
  4: ['Forex', 'Quant Finance'],          // Thursday
  5: ['AI', 'Research Work'],             // Friday
};
```

### Skills
Edit the default skill list in `src/constants/theme.ts` (or manage live in Skills → ⚙️ Manage):
```ts
export const SKILL_LIST = ['Guitar', 'Kathak', 'Cooking', 'Sports'];
```

### Schedule
Build your weekly schedule in the Tasks tab. Supports separate templates for Weekdays, Saturdays, and Sundays with categories: fitness, work, learning, personal, meals, sleep, skill-practice.

### Colors & theme
The full design system lives in `src/constants/theme.ts`. Tab colors, category colors, and default values are all in one place.

---

## Running locally

### Prerequisites
- Node.js 18+
- npm or yarn
- **iOS:** Xcode 15+, CocoaPods, Apple Developer account (free tier works)
- **Android:** Android Studio, Java 17+
- **Web:** Nothing extra needed

### Setup
```bash
git clone https://github.com/shroff-yaksi/LifeApp.git
cd LifeApp
npm install
```

---

## iOS

### Simulator (quickest)
```bash
npx expo run:ios
```
This builds and launches the app in the iOS Simulator. No device needed.

### Physical iPhone — Development build (needs Metro running)
```bash
# 1. Install dependencies and run
npx expo run:ios --device

# 2. If your device isn't auto-detected, provide your UDID:
npx expo run:ios --device "<your-device-udid>"
```
Your UDID can be found in Xcode → Window → Devices and Simulators, or via:
```bash
xcrun devicectl list devices
```

> **First time on device:** Go to **Settings → General → VPN & Device Management** on your iPhone and trust your developer certificate.

### Physical iPhone — Standalone Release build (recommended, no Metro needed)

This bakes the JS bundle into the app so it works offline without a computer:

```bash
# Build
xcodebuild \
  -workspace ios/LifeOS.xcworkspace \
  -scheme LifeOS \
  -configuration Release \
  -destination 'id=<your-device-udid>' \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  build

# Install
xcrun devicectl device install app \
  --device <your-device-udid> \
  /Users/<you>/Library/Developer/Xcode/DerivedData/LifeOS-*/Build/Products/Release-iphoneos/LifeOS.app

# Launch
xcrun devicectl device process launch \
  --device <your-device-udid> \
  com.yaksishroff.lifeos
```

Replace `<your-device-udid>` with your actual device UUID from `xcrun devicectl list devices`.

### CocoaPods issues
If the build fails with missing headers:
```bash
cd ios
pod install
cd ..
```
If `pod install` itself fails, try:
```bash
cd ios
pod deintegrate
pod install
```

---

## Android

### Prerequisites
- Android Studio installed
- An Android emulator set up, or a physical Android device with USB debugging enabled

### Emulator
```bash
npx expo run:android
```

### Physical Android device
1. Enable **Developer Options** on your phone (tap Build Number 7 times in Settings → About Phone)
2. Enable **USB Debugging**
3. Connect via USB and run:
```bash
npx expo run:android --device
```

### Release APK (standalone, no Metro needed)
```bash
cd android
./gradlew assembleRelease
```
The APK will be at `android/app/build/outputs/apk/release/app-release.apk`. Transfer it to your device and install.

> **Note:** Android is not the primary target for this app and has not been tested. Some UI may need adjustment.

---

## Web

### Run in browser
```bash
npx expo start --web
```
Then open `http://localhost:8081` in your browser.

> **Note:** Web support is best-effort. AsyncStorage works in the browser (backed by localStorage), but some native components (charts, notifications) may behave differently or require polyfills.

---

## Data & Privacy

All data is stored entirely on-device using AsyncStorage:
- **iOS:** stored in the app's private sandbox (`NSUserDefaults` / files)
- **Android:** stored in the app's private data directory
- **Web:** stored in browser `localStorage`

Nothing is ever sent to any server. You can export a full JSON backup from **Settings → Export Data**, or wipe everything with **Clear All Data**.

---

## Project structure

```
app/
  (tabs)/
    index.tsx       ← Dashboard
    tasks.tsx       ← Tasks (habits + schedule + manual)
    fitness.tsx     ← Fitness tracking
    learning.tsx    ← Learning & rotation
    skills.tsx      ← Skills practice
    journal.tsx     ← Journal & mood
    finance.tsx     ← Finance tracking
    settings.tsx    ← Settings & data
src/
  constants/
    theme.ts        ← Colors, defaults, habits, rotation, skills
  utils/
    helpers.ts      ← Date helpers (timezone-safe)
    storage.ts      ← AsyncStorage wrappers
  components/
    Card.tsx        ← Reusable card container
    Button.tsx      ← Styled button
    ModalSheet.tsx  ← Bottom sheet modal
    FormField.tsx   ← Form input wrapper
    ProgressBar.tsx ← Progress bar
```

---

## Tech stack

- [Expo](https://expo.dev) ~54 + [React Native](https://reactnative.dev) 0.81
- [Expo Router](https://expo.github.io/router) — file-based tab navigation
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — local data persistence
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) — line and bar charts
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — local reminders

---

## License

MIT — use it, fork it, make it yours.
