# LifeApp — Product Requirements Document
### UI Screen Specifications for Design

---

## Design System

### Color Palette (Dark Theme)

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#09090b` | App background |
| `card` | `#111114` | Card backgrounds |
| `surface` | `rgba(255,255,255,0.03)` | Subtle surfaces, inputs |
| `border` | `rgba(255,255,255,0.06)` | Card/input borders |
| `text` | `#fafafa` | Primary text |
| `textSecondary` | `#a1a1aa` | Labels, subtext |
| `textMuted` | `#52525b` | Placeholder, hints |
| `accent` | `#6366f1` | Indigo — primary CTA, active states |
| `accentLight` | `#818cf8` | Lighter indigo for text on dark |
| `accentBg` | `rgba(99,102,241,0.08)` | Accent background tint |
| `green` | `#22c55e` | Success, gym, positive |
| `red` | `#ef4444` | Warning, cigarettes, danger |
| `orange` | `#f59e0b` | Study, amber |
| `purple` | `#a78bfa` | Sleep, mood |
| `yellow` | `#facc15` | Skills |
| `cyan` | `#22d3ee` | Water, info |
| `pink` | `#f472b6` | Personal |

### Category Colors (Schedule)

| Category | Color |
|---|---|
| fitness | `#10b981` (emerald) |
| work | `#3b82f6` (blue) |
| learning | `#f97316` (orange) |
| personal | `#ec4899` (pink) |
| meal | `#06b6d4` (cyan) |
| sleep | `#8b5cf6` (violet) |
| skill | `#eab308` (yellow) |
| date | `#ec4899` (pink) |

### Typography
- Font: System default (SF Pro on iOS, Roboto on Android)
- Heading: 20–22px, weight 800
- Subheading: 16px, weight 700
- Body: 14–15px, weight 400–600
- Caption: 11–12px, weight 400–600

### Spacing & Shape
- Screen horizontal padding: 16px
- Card border radius: 16px
- Button border radius: 10–12px
- Input border radius: 10–12px
- Gap between cards: 12px

### Shared Components

**Card** — Dark card with title row, optional right badge/actions
- Background: `#111114`, border: 1px `rgba(255,255,255,0.06)`, radius 16px, padding 16px
- Title: 14px, weight 700, `#fafafa`
- Badge: small rounded pill, accent color

**ProgressBar** — Full-width horizontal bar
- Track: `rgba(255,255,255,0.06)`, height 6px (default), radius 4px
- Fill: colored per context, animates left→right

**Button variants**
- Primary: `#6366f1` bg, white text
- Outline: transparent bg, `#6366f1` border + text
- Ghost: no border, accent text
- Danger: `#ef4444` bg, white text
- Size sm: smaller padding for inline use

**Bottom Tab Bar**
- 9 tabs: Dashboard · Schedule · Fitness · Learning · Skills · Journal · Finance · Analytics · Settings
- Icons: emoji (🏠 📅 💪 📚 🎸 📓 💰 📊 ⚙️)
- Height: 80px, background `#09090b`, active color `#818cf8`, inactive `#52525b`

---

## Screen 1 — Dashboard (Home)

**Purpose:** Single-glance view of the day. Always-on schedule + key trackers.

### Layout (top → bottom, scrollable)

#### 1. Greeting Bar
- Full-width card
- Left: greeting text ("Good morning / Good afternoon / Good evening"), 20px weight 800
- Right: streak badge ("X day streak") — indigo pill, `#818cf8` text
- No subtext, no progress bar here

#### 2. Today's Schedule Card
- Title: "Today's Schedule" | Right badge: completion % (e.g. "72%")
- Each task row:
  - Left: colored dot (category color, 10×10 circle)
  - Center: task name (14px bold) + time range below (11px muted, "9:00 AM – 10:00 AM")
  - Right: "NOW" badge (accent bg, white text, 10px bold) if currently active, OR green "✓" if done
  - Active row: soft indigo tint background
  - Done row: 45% opacity, task name struck through
  - Tap row = toggle done
- Bottom: progress bar (accent color) showing % completed
- Empty state: "No tasks — set up your schedule in the Schedule tab"

#### 3. Daily Habits Card
- Title: "Daily Habits" | Right badge: "X%" completion
- Each habit is a row:
  - Left: checkbox (22×22, rounded 6px, border `rgba(255,255,255,0.06)`) — checked = indigo fill with white ✓
  - Right: habit name (14px)
  - Done = name struck through, muted color
- Default habits: Gym, Walking, Swimming, Reading, Healthy Diet, Skincare, Journalling

#### 4. Quick Tracking Card
- Title: "Quick Tracking"
- Three rows separated by thin borders:

**Row 1 — Water 💧**
- Label: "💧 Water"
- Controls (right-aligned): `−` button | "X / 8" counter | `+` button
- Buttons: surface bg, border, 14px bold

**Row 2 — Cigarettes 🚬**
- Label: "🚬 Cigarettes"
- Below label (if any logged): small muted text "Xh Ym since last"
- Controls: `−` button | count (red if >0) | `+` button (red border + text)

**Row 3 — Pomodoros 🍅** (last, no bottom border)
- Label: "🍅 Pomodoros"
- Right: "X today" in accent color + "▶ Start" button (indigo border/text)

#### 5. Weekly Goals Card
- Title: "Weekly Goals"
- 2-column grid of 6 goal items:
  - Large number (22px, bold, category color)
  - Label below (11px, secondary)
  - Thin progress bar (4px height)
  - "target: X" or "limit: X" caption (10px, muted)
- Goals: Gym Sessions (green), Study Hours (orange), Cigarettes (red, inverted), Water (cyan), Avg Sleep (purple), Skill Hours (yellow)

---

## Screen 2 — Schedule (Template Editor)

**Purpose:** Build and manage recurring schedule templates. NOT today's live view (that's on Dashboard).

### Layout

#### Header
- Hint text below tabs: "Edit your recurring schedule templates. Today's schedule shows on the Dashboard." (12px muted)

#### Day Type Tabs
- 3 pill tabs side by side: **Weekday · Saturday · Sunday**
- Active: indigo tint bg, `#818cf8` text
- Inactive: surface bg, muted text
- Right of tabs: "+ Add" button (small, primary)

#### Task List Card
Each task is a row:
- Time column (60px): start time bold (13px) + end time below (10px muted)
- Color bar (3×40px, rounded) = category color
- Task content (flex): name (15px bold) + category badge below (11px uppercase, category color)
- Right: ✕ delete button (muted, 16px)
- Active task (if today's type matches): indigo tint bg
- Done task: 50% opacity, name struck through
- Tap = toggle done (only if viewing today's day type)
- Long-press = opens edit modal

#### Empty state
"No tasks yet. Tap + Add to build your schedule."

#### Add/Edit Task Modal (bottom sheet)
Fields:
1. Task Name — text input
2. Start Time — text input, placeholder "09:00" (24h format)
3. End Time — text input, placeholder "10:00"
4. Category — grid of 8 colored pill buttons (fitness / work / learning / personal / meal / sleep / date / skill)

Actions: Cancel (outline) + Save (primary) buttons right-aligned

---

## Screen 3 — Fitness

**Purpose:** Log and track health metrics — weight, sleep, meals, diet deviations, cigarettes.

### Layout (scrollable)

#### 1. Weight Card
- Title: "Weight" | Right: "+ Log" button (small)
- Stats row: Current weight (large, green) · Target · Change (red/green with ▲▼ arrow)
- Line chart: last 14 weight entries, green color, 160px height

#### 2. Sleep Card
- Title: "Sleep" | Right: "+ Log" button
- Stats row: Last Night (large, purple) · Target · 7-Day Avg
- Line chart: last 14 sleep entries, purple color, 160px height

#### 3. Today's Meals Card
- Title: "Meals"
- 4 rows: Breakfast · Lunch · Snack · Dinner
- Each row: time label (muted) + meal description input (inline, borderless or minimal)
- Default times: 9:00 AM, 1:00 PM, 5:00 PM, 8:30 PM

#### 4. Diet Deviations Card
- Title: "Deviations" | Right: "+ Log" button
- 6 deviation type buttons in a grid (pill shape):
  - 🍺 Alcohol · 🍟 Extra Snack · ❌ Off-Diet · 🍔 Junk Food · 🥤 Sugary Drink · Other
- Below: list of today's logged deviations with time stamp + delete option

#### 5. Cigarettes Card
- Title: "Today's Cigarettes"
- Same counter UI as Dashboard: `−` | count (red) | `+`
- Shows time since last, list of today's log times below

---

## Screen 4 — Learning

**Purpose:** Track study hours across domains with a weekly rotation.

### Layout (scrollable)

#### 1. Today's Rotation Card
- Title: "Today's Rotation"
- Shows 1–2 study domains for today based on day of week:
  - Mon: Stock Market + Forex
  - Tue: Quant Finance + AI
  - Wed: Research Work + Stock Market
  - Thu: Forex + Quant Finance
  - Fri: AI + Research Work
  - Sat/Sun: Free study
- Domain name in large accent text
- "+ Log Session" button

#### 2. Log Session Modal
Fields: Domain (dropdown/picker) · Hours (number) · Topic/Notes (text)

#### 3. Study Progress Card
- Title: "This Week by Domain"
- Each domain: name + hours bar (orange) + total hours label
- Domains: Stock Market, Forex, Quant Finance, AI, Research Work

#### 4. Recent Logs Card
- Title: "Recent Sessions"
- Each entry: domain (orange badge) · hours · date · topic preview
- Long-press to delete

#### 5. Weekly Hours Chart
- Bar chart, orange bars, last 7 days
- X-axis: day labels, Y-axis: hours

#### 6. Courses Card
- Title: "Courses" | Right: "+ Add" button
- List of course names with delete option

---

## Screen 5 — Skills

**Purpose:** Track practice hours and self-assessed skill levels for Guitar, Kathak, Cooking, Sports.

### Layout (scrollable)

#### 1. Per-Skill Summary Cards (4 cards, one per skill)
Each card:
- Skill name (bold) + emoji
- Total hours logged (large, yellow)
- Weekly hours (smaller, secondary)
- "Rate Skill" button → opens rating modal (1–10 slider)
- "Log Practice" button → opens log modal

#### 2. Log Practice Modal
Fields: Skill (pre-filled) · Duration (minutes/hours) · Notes (optional)

#### 3. Rating Modal
Slider or button grid 1–10 with color gradient (red→green)

#### 4. Practice Logs Card
- Title: "Recent Practice"
- Each log: skill name badge (yellow) · duration · date · notes preview
- Long-press to delete

#### 5. Weekly Hours Bar Chart
- Yellow bars, one per skill, last 7 days total

---

## Screen 6 — Journal

**Purpose:** Daily free-form journalling with mood. Simple, low friction.

### Layout (scrollable)

#### 1. Main Entry Card (always at top)

**Date Navigation Row**
- Left: `‹` arrow (large, accent)
- Center: "Monday, Mar 24" (16px bold) + "Today" pill below (indigo, only on today's date)
- Right: `›` arrow (disabled/faded if on today)

**Mood Row**
- Label: "How are you feeling?" (13px secondary)
- 5 emoji buttons side by side (48×48 each, rounded 12px, border):
  - 😞 😕 😐 🙂 😄
  - Selected = colored border + tinted background matching mood (red→orange→yellow→green→cyan)

**Notes Input**
- Full-width textarea, min 200px height
- Placeholder: "Write anything on your mind..."
- Auto-saves on every keystroke
- Below input: "saved HH:MM" in 10px muted text (right-aligned)

#### 2. Past Entries Card
- Title: "Past Entries"
- Each entry row (tap to navigate to that date):
  - Left: date ("Mon, Mar 23", 13px secondary bold)
  - Right: mood emoji if exists
  - Below: 2-line text preview (muted, 13px)
  - Separated by thin border

---

## Screen 7 — Finance

**Purpose:** Track daily expenses, monthly budgets, and net worth.

### Layout (scrollable)

#### 1. Today's Spending Card
- Title: "Today" | Right: total spent (large, white or red if over)
- "+ Add Expense" button (primary, full width or top-right)

#### 2. Add Expense Modal
Fields: Amount (large number input) · Category (grid of 8 icons) · Note (optional text)
Categories: 🍽 Food · 🚗 Transport · 🎬 Entertainment · 🏥 Health · 🛍 Shopping · 📋 Bills · 📈 Investment · ⚙️ Other

#### 3. Expense List (today)
- Each item: category icon + name/note · amount (right) · time (muted small)
- Long-press to delete

#### 4. Monthly Budget Card
- Title: "March Budget"
- Each category: icon + name · spent / limit · progress bar (red if over)
- Editable limits

#### 5. Net Worth Card
- Title: "Net Worth"
- Assets section (green): list of assets with values, "+ Add" button
- Liabilities section (red): list of debts with values, "+ Add" button
- Bottom: Net Worth = Assets − Liabilities (large, green if positive)

---

## Screen 8 — Analytics

**Purpose:** Monthly retrospective with charts and automated insights.

### Layout (scrollable)

#### 1. Month Navigation
- `‹ February 2026 ›` — centered, with left/right arrow buttons

#### 2. Monthly Summary Stats Grid
- 7 stat boxes in a 3-column wrap grid:
  - Habits % (green) · Gym Days (green) · Study Hrs (orange) · Avg Sleep (purple) · Cigs (red) · Skill Hrs (yellow) · Journal Days (cyan)
- Each box: large number (18px bold, colored) + label (10px muted)

#### 3. Habit Heatmap Card
- Title: "Habit Completion"
- Calendar grid: 5–6 rows × 7 columns
- Each day cell: colored square, intensity = completion % (0%=dark, 100%=accent green)
- Day number label inside cell (10px)

#### 4. Charts Section
Three line charts stacked:
- "Daily Habits %" — green line, last 30 days
- "Sleep Trend" — purple line, last 30 nights
- "Weight Trend" — orange line, last 30 measurements
Each: 160px height, minimal axis labels

#### 5. Insights Card
- Title: "Insights"
- 3–4 auto-generated insight bullets:
  - Sleep vs habits correlation ("Better sleep → X% higher habit score")
  - Best performance day of week
  - Workout frequency vs goal
  - Study pace vs weekly target

---

## Screen 9 — Settings

**Purpose:** Configure reminders, weekly goals, habits, and manage data.

### Layout (scrollable)

#### 1. Reminders Card
- Title: "Daily Reminders"
- Master toggle: "Notifications" (on/off switch, right-aligned)
- 4 reminder rows (only visible when master is on):
  - 💧 Water Reminder · interval picker (every X mins) + start/end time
  - 📓 Journal Reminder · time picker
  - 😴 Sleep Wind-down · time picker
  - ✨ Skincare Reminder · time picker
- Each row: label left, time/toggle right

#### 2. Weekly Goals Card
- Title: "Weekly Goals"
- 6 editable rows (inline number inputs):
  - Gym Sessions (target)
  - Study Hours (target)
  - Cigarette Limit (max)
  - Water Glasses (target)
  - Avg Sleep Hours (target)
  - Skill Hours (target)

#### 3. Daily Habits Card
- Title: "My Habits"
- List of current habits with delete (✕) button on each
- "+ Add Habit" text input at bottom with Add button

#### 4. Data Card
- Title: "Data"
- "Export All Data" button (outline) — exports JSON file
- "Clear All Data" button (danger/red) — with confirmation alert

#### 5. About Section
- App name + version
- Small muted text

---

## Screen 10 — Focus Timer (Modal)

**Purpose:** Pomodoro timer. Opens as a bottom slide-up modal over any screen.

### Layout (center-aligned, non-scrollable)

#### Mode Selector
- 3 pill buttons: **Work (25m) · Short Break (5m) · Long Break (15m)**
- Active = accent bg

#### Circular Progress Ring
- Large SVG circle, 200px diameter
- Track: muted stroke
- Progress arc: accent color, animates clockwise
- Center: large countdown "MM:SS" (32px bold)
- Below time: session count "X sessions today" (small, muted)

#### Controls
- Two buttons centered:
  - Pause / Resume (primary, large)
  - Reset (ghost/outline)

#### Behavior
- Completes → haptic feedback + increments pomodoro count for today
- Auto-switches to break mode suggestion after work session

---

## Navigation Flow

```
Root
├── Bottom Tab Bar (persistent)
│   ├── 🏠 Dashboard        ← Today's schedule + habits + trackers
│   ├── 📅 Schedule         ← Edit Weekday/Sat/Sun templates
│   ├── 💪 Fitness          ← Weight, sleep, meals, diet, cigs
│   ├── 📚 Learning         ← Study sessions by domain
│   ├── 🎸 Skills           ← Guitar, Kathak, Cooking, Sports
│   ├── 📓 Journal          ← Daily notes + mood
│   ├── 💰 Finance          ← Expenses + budget + net worth
│   ├── 📊 Analytics        ← Monthly charts + insights
│   └── ⚙️ Settings         ← Reminders + goals + data
└── 🍅 Focus Timer          ← Modal (slides up from any tab)
```

---

## Key Interaction Patterns

| Pattern | Behavior |
|---|---|
| Pull to refresh | All screens — reloads data from storage |
| Tap row | Toggle done/complete |
| Long-press row | Opens edit modal |
| Auto-save | Journal saves on every keystroke, shows "saved HH:MM" |
| Tap ✕ | Immediate delete (no confirmation except "Clear All Data") |
| Category pills | Single-select, colored highlight on selection |
| Counter +/− | Immediate update, persisted to local storage |
| Date arrows in Journal | Navigate past entries, right arrow disabled on today |

---

## Data Storage Summary (for handoff context)

All data stored locally on-device (AsyncStorage). No backend.

| Key Pattern | What It Stores |
|---|---|
| `habitData_{YYYY-MM-DD}` | Habit completion map |
| `water_{YYYY-MM-DD}` | Water cups count |
| `cigLog_{YYYY-MM-DD}` | Array of `{time: ISO}` entries |
| `scheduleCompletion_{YYYY-MM-DD}` | Task done map |
| `schedule_weekday/saturday/sunday` | Task template arrays |
| `journal_{YYYY-MM-DD}` | `{notes, mood, updatedAt}` |
| `weightLog` | `[{date, weight}]` |
| `sleepLog` | `[{date, hours, bedtime, waketime}]` |
| `expenses_{YYYY-MM-DD}` | `[{amount, category, note, time}]` |
| `studyLogs` | `[{domain, hours, topic, date}]` |
| `skillLogs` | `[{skill, duration, notes, date}]` |
| `goals` | Weekly goal targets object |
| `habits` | Array of habit name strings |
| `pomodoro_{YYYY-MM-DD}` | Session count for day |

---

*Last updated: March 2026*
