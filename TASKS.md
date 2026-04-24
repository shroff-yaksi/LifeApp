# LifeOS — Feature & Fix Backlog

> Priority: 🔴 Critical fix · 🟠 High impact · 🟡 Nice to have · 🔵 Big feature
> Status: [ ] todo · [x] done · [-] skipped

---

## 🗓 CALENDAR & SCHEDULE SYSTEM

### Bugs / Core Fixes
- [ ] 🔴 Schedule edits currently save to the DAY-TYPE template (all weekdays forever) — add a "just today" vs "always" choice when editing a task
- [ ] 🔴 Missed-task backlog is view-only — add "Carry to tomorrow" and "Dismiss" actions on each backlog item
- [ ] 🔴 Catchup view only loads on Sundays — it should be available any day (show past 7 days of incomplete tasks)
- [ ] 🔴 Time input is raw HH:MM text field — replace with a native time picker wheel

### New Features
- [ ] 🟠 7-day templates — expand from 3 types (weekday/saturday/sunday) to individual Mon–Sun templates so Thursday can differ from Tuesday
- [ ] 🟠 Per-date schedule override — for any specific date, override the template without changing the recurring one (e.g. "today only: remove gym, add travel")
- [ ] 🟠 Day type tags — manually tag today: Rest Day · Travel Day · Sick Day · Holiday · Study Day — and auto-select a matching template
- [ ] 🟠 "Skip today only" on individual tasks — skip one scheduled task for today without touching the template
- [ ] 🟠 "What's tomorrow" preview section at the bottom of Dashboard
- [ ] 🟠 Schedule editor shortcut on Dashboard — long-press "Today's Schedule" card header to edit today's tasks without switching tabs
- [ ] 🔵 Week view — horizontal 7-day strip showing task density per day, tap to jump to that day
- [ ] 🔵 Month calendar view — tap any date to see/edit its tasks and completion status
- [ ] 🔵 Template library — prebuilt templates: Morning Person, Night Owl, Work From Home, Office Day, Travel Day
- [ ] 🟡 Holiday / public holiday awareness — auto-tag national holidays and suggest a rest-day template
- [ ] 🟡 "Planning mode" — view and edit next 7 days of schedule before the week starts

---

## 📋 TASKS & PRODUCTIVITY

- [ ] 🟠 Task priority levels — High / Medium / Low with colour coding and sort order
- [ ] 🟠 Swipe gestures on tasks — swipe right to complete, swipe left to delete (react-native-gesture-handler is installed)
- [ ] 🟠 Task notes / description — expand a task to add extra detail or a link
- [ ] 🟠 Drag to reorder manual tasks — long-press drag handle
- [ ] 🟡 Sub-tasks / checklist inside a task — break a task into steps
- [ ] 🟡 Task time estimate vs actual — set estimated duration, track real time with a built-in stopwatch
- [ ] 🟡 Focus mode — tap a task to enter full-screen focus: only that task visible, Pomodoro timer auto-starts
- [ ] 🟡 Recurring manual tasks — "every Monday" tasks that don't need to be in the fixed schedule
- [ ] 🔵 Eisenhower matrix view — 2×2 grid: Urgent+Important, Not Urgent+Important, etc.
- [ ] 🔵 Task search — search by name across all days

---

## 🏠 DASHBOARD

- [ ] 🟠 Weekly goal progress rings — show gym X/5 days, study X/Y hrs, water X/Y glasses inline on Dashboard (goals are already stored in Settings)
- [ ] 🟠 Quick mood log — one-tap 😞😐😄 mood entry directly from Dashboard (writes to journal)
- [ ] 🟠 "Next up" card — shows the next 1–2 tasks starting within the next 60 minutes with a countdown
- [ ] 🟠 Navigation shortcuts to hidden tabs — Finance, Journal, Analytics are invisible to users; add icon buttons on Dashboard
- [ ] 🟡 Daily motivational quote — rotating quote in the greeting banner
- [ ] 🟡 Energy level tracker — quick 1–5 energy check-in each morning
- [ ] 🟡 Mini week strip — 7-day row showing ✓ / ○ / today for habit completion at a glance
- [ ] 🔵 Customisable Dashboard — let user reorder or hide sections (water, cigs, Pomodoro, habits, schedule)

---

## 📊 ANALYTICS & INSIGHTS

- [ ] 🟠 Goal vs actual chart — weekly bars for each goal (gym target vs actual, study target vs actual)
- [ ] 🟠 Habit correlation engine — "On days you sleep 7+ hrs, habit completion is 40% higher" — computed from existing data
- [ ] 🟠 Streak calendar — full-year GitHub-style heatmap showing daily completion percentage
- [ ] 🟡 Weekly review screen — auto-prompt Sunday evening: review the week, set next week's focus
- [ ] 🟡 Monthly report screen — summary of the month with goal hit/miss, personal bests, notable entries
- [ ] 🟡 Personal bests tracking — longest streak, most study hours in a day, most gym days in a week
- [ ] 🟡 Share progress card — generate a shareable image card with week summary
- [ ] 🔵 Prediction nudges — "Based on your Tuesdays, you usually skip the gym — want to reschedule?"
- [ ] 🔵 Export to PDF — monthly/weekly report as a PDF

---

## 💪 FITNESS

- [ ] 🟠 Sleep quality rating — add 1–5 quality stars to sleep log (not just hours)
- [ ] 🟠 Workout log — beyond just hours; log exercise type, sets, reps, weight per session
- [ ] 🟠 Body measurements — waist, chest, arms alongside weight
- [ ] 🟡 Water reminder notifications — push notification every X hours if water goal not on track
- [ ] 🟡 Meal nutrition — add calorie/macro tracking to meals (breakfast/lunch/dinner already exist)
- [ ] 🟡 Diet deviation insights — show which deviation types are most frequent in Analytics
- [ ] 🔵 Apple Health integration — auto-import steps, sleep, workouts, weight from HealthKit (react-native-health)
- [ ] 🔵 Running / walking route logging — distance and map trace via GPS

---

## 📚 LEARNING

- [ ] 🟠 Session notes — add a free-text notes field when logging study time
- [ ] 🟠 Resource links per course — attach YouTube / article URLs to a course; open with one tap
- [ ] 🟡 Reading / book tracker — separate section for books: title, pages read, target finish date
- [ ] 🟡 Course completion milestones — mark a course as done and log the finish date
- [ ] 🟡 Study session insights — best time of day for study (analysed from session timestamps)
- [ ] 🔵 Flashcard / spaced repetition — per-course flashcard deck with daily review reminders
- [ ] 🔵 Share extension — share an article from Safari directly to the Learning tab as a resource

---

## 🎸 SKILLS

- [ ] 🟠 Practice notes — add session notes when logging skill practice
- [ ] 🟠 Skill level progression chart — graph the 1–10 self-assessments over time per skill
- [ ] 🟠 Practice streak per skill — individual streak counter per skill (not just overall)
- [ ] 🟡 Metronome — built-in BPM metronome for music skills (Guitar, etc.)
- [ ] 🟡 Resource links per skill — attach tutorial videos or references
- [ ] 🔵 Session recording — start a voice/video recording when beginning a practice session

---

## 💰 FINANCE

- [ ] 🟠 Income tracking — add income entries (salary, freelance, etc.) alongside expenses; show net cashflow
- [ ] 🟠 Recurring expenses — mark an expense as recurring (monthly rent, subscription) so it auto-appears each month
- [ ] 🟠 Bill reminders — add bills with due dates and get a notification 2 days before
- [ ] 🟠 Month-over-month comparison — "You spent ₹X more on food this month vs last month"
- [ ] 🟡 Savings goals — set a target amount + target date, track progress (e.g. "MacBook fund: 40%")
- [ ] 🟡 Receipt photo — attach a photo to an expense entry
- [ ] 🟡 Multi-currency support — log expenses in different currencies with conversion
- [ ] 🔵 Investment portfolio tracker — add stocks/MF with current value, track returns

---

## 📓 JOURNAL

- [ ] 🟠 Gratitude section — 3 lines for "grateful for today" alongside the free-text notes
- [ ] 🟠 Mood trend graph — show mood 1–5 over the last 30 days directly in the Journal tab
- [ ] 🟠 Journal streak counter — consecutive days with an entry
- [ ] 🟠 Search journal entries — keyword search across all past entries
- [ ] 🟡 Tags for entries — e.g. #travel #milestone #lowday — filterable
- [ ] 🟡 Weekly journal prompts — auto-suggest a reflection question each day
- [ ] 🟡 Photo attachment — add 1–3 photos to a journal entry
- [ ] 🔵 Voice note — record a short voice memo and attach it to the day's entry

---

## 🔔 NOTIFICATIONS & ALARMS

- [ ] 🟠 Streak milestone notifications — celebrate 7, 30, 100-day streaks with a push notification
- [ ] 🟠 End-of-day summary notification — 9 PM: "You completed X/Y tasks and X/Y habits today"
- [ ] 🟠 Smart notification timing — skip gym reminder if user's sleep log shows they're still in bed
- [ ] 🟠 Better alarm music picker — browse device playlists instead of manually pasting Spotify URIs
- [ ] 🟡 Lock screen widget — water glasses, habit %, streak count
- [ ] 🟡 App icon badge — show pending habit count on app icon
- [ ] 🟡 Dynamic Island integration — show Pomodoro timer progress in Dynamic Island during active session
- [ ] 🟡 Bill due date reminders — fire 2 days before a bill is due (requires Finance bill feature above)
- [ ] 🔵 Smart alarm — wake within a 30-minute window at the lightest sleep phase

---

## ☁️ DATA & BACKUP

- [ ] 🔴 iCloud backup — auto-save all AsyncStorage data to iCloud Drive on app background; restore on reinstall
- [ ] 🟠 Better import UI — file picker instead of the current share-sheet workaround in Settings
- [ ] 🟠 Auto-backup on app close — export JSON to iCloud every time the app goes to background
- [ ] 🟡 Data migration system — versioned schema so future changes don't break existing data
- [ ] 🟡 Selective restore — restore only specific sections (habits only, finance only, etc.)
- [ ] 🔵 Multi-device sync — same data on iPhone + iPad

---

## 🎨 UI / UX

- [ ] 🟠 Light mode — currently hard-coded dark; add a toggle in Settings
- [ ] 🟠 Face ID / passcode lock — optional app lock on open
- [ ] 🟠 Onboarding flow — first-launch wizard to set up name, habits, goals, first schedule
- [ ] 🟠 Empty states — meaningful illustrations + action prompts on all empty screens (currently just plain text)
- [ ] 🟡 Haptic feedback — add tactile feedback to more interactions (habit toggle, task complete, etc.)
- [ ] 🟡 Tab customisation — let user reorder or hide tabs they don't use
- [ ] 🟡 App icon variants — let user choose icon colour/style from Settings
- [ ] 🔵 iPad / landscape layout — current layout is portrait-phone only
- [ ] 🔵 Home Screen widgets — WidgetKit: water counter, habit progress, today's schedule strip

---

## ⚙️ PERFORMANCE & CODE HEALTH

- [ ] 🟠 Loading skeletons — replace blank screens during data load with skeleton placeholders
- [ ] 🟠 Optimise startup reads — batch all AsyncStorage keys into one `multiGet` call on launch instead of sequential awaits
- [ ] 🟡 Error boundaries — catch and display friendly error if a screen crashes instead of white screen
- [ ] 🟡 Offline state detection — show a banner if the device has no internet (relevant for future sync features)
- [ ] 🟡 Memory leak audit — useFocusEffect callbacks should clean up timers and subscriptions

---

## 🗂 QUICK REFERENCE — Top 10 to do first

| # | Task | Why |
|---|---|---|
| 1 | 7-day schedule templates | Tuesday ≠ Thursday for most people |
| 2 | "Skip today only" on tasks | Biggest daily friction point |
| 3 | Per-date schedule override | Needed for travel days, sick days |
| 4 | Carry-to-tomorrow on backlog items | Currently backlog is useless read-only list |
| 5 | Time picker (replace HH:MM text input) | Current input is error-prone and slow |
| 6 | Weekly goal progress on Dashboard | Goals are set but never visible mid-week |
| 7 | Surface Finance/Journal/Analytics | These tabs are invisible to the user |
| 8 | iCloud backup | Data loss risk with zero backup |
| 9 | Quick mood log on Dashboard | 1-tap vs navigating to Journal |
| 10 | Habit correlation insights | Turns raw data into actual value |
