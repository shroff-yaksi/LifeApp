# LifeApp (LifeOS)

> A privacy-first personal life tracker. Habits, schedule, fitness, learning, skills, journal, finance, analytics, alarms — all on-device. No accounts. No cloud. Your data stays on your phone.

Open the app and see today: a single-glance Dashboard, zero-friction tap-first logging, and a full JSON export that is your backup. Everything is stored locally in AsyncStorage — no backend, no login, no subscription. Built first as a daily-use tool for one person; the source is generic enough to fork.

**Audience = Yaksi.** This is a personal tool, not a product — no App Store / Play Store listing, no support promise. iOS-first (daily driver); Android sideloads via GitHub Releases; web is best-effort.

**Stack:** Expo ~54 · React Native 0.81 · React 19 · Expo Router (file-based tabs) · AsyncStorage · react-native-chart-kit · expo-notifications · expo-updates (EAS Update OTA).

**Status:** v1.1.0 shipped (~70% built). Next: v1.2 — daily-friction fixes + silent iCloud auto-backup.

**Docs:** The full build/ship/OTA flow is in [RELEASE.md](./RELEASE.md); machine-readable contracts in [contracts/](./contracts). Full plan & spec: kept in the portfolio `planning/` workspace (not in this public repo).

## License

MIT — use it, fork it, make it yours.
