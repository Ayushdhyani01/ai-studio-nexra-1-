# NEXRA — Threat Detection and Risk Analysis

NEXRA learns normal usage from past-week activity and flags anomalies with clear risk scores and explanations.

How it works:

1. **Past-week data** — login and usage events for 10 users over 7 days live in a CSV file.
2. **Training** — the local model learns each user's normal hours, devices, and locations, day by day.
3. **Detection** — recent activity is scored 0–100 against the learned baseline.
4. **Correlation** — related suspicious events for one user become a single incident.
5. **Explanation** — every score lists why, plus an assessment and recommended actions.

No API key. No backend. No data leaves the browser. All detection runs locally.

## Do you need an API key?

No. The previous Gemini/`.env` setup is not used. This version uses only a local baseline model (`src/ml/model.ts`). You can ignore `.env.example`.

## Project structure

```
data/past_week_activity.csv        # Same CSV judges open (copy for easy access)
src/data/past_week_activity.csv    # CSV bundled into the app
src/data/users.ts                  # Known users + portal locations (Austin / Mumbai / Delhi)
src/ml/csv.ts                      # CSV parser + groupByDay
src/ml/model.ts                    # trainBaselines, scoreEvent, correlate, getRiskLevel (+15 new-country rule)
src/ml/bus.ts                      # Cross-tab bus (portal tab -> dashboard tab, no server)
src/ml/sound.ts                    # WebAudio siren, no audio files
src/portal/PortalPage.tsx          # Fake employee sign-in page (?view=portal)
src/App.tsx                        # UI: Activity Data, Training, Threats, Users
src/main.tsx                       # Entry
src/index.css                      # Simple solid light theme
index.html                         # Title
```

Old experiment folders (`src/components/*`, `src/detection/*`, `src/context/*`) are unused leftovers and are not imported by the app.

## The data

### Past week (training input)

- File: `data/past_week_activity.csv` (also bundled at `src/data/past_week_activity.csv`)
- 174 rows, 7 days (2026-09-16 to 2026-09-22), 10 users
- Columns: `timestamp,user_id,user_email,event_type,device,location,ip_address,details`
- Mostly normal: `Login` / `File Access` during 09:00–17:00 from each user's usual device and location

### Recent activity (detection input)

`src/data/liveEvents.ts` — 11 events:

- 6 normal daytime events (score ~5, LOW)
- 5-event attack sequence for `alex@company.com` (02:14–02:21):
  1. `Login` at 02:14 (off-hours) → ~30 MEDIUM
  2. `New Device` Kali Linux VM → ~50 MEDIUM
  3. `Failed Login` 8 attempts from Bucharest → 100 CRITICAL
  4. `Sensitive File Download` vault archive → 100 CRITICAL
  5. `Privilege Change` to SuperAdmin → 100 CRITICAL
- Correlated into one incident: **Potential Account Compromise**, CRITICAL

## How pattern recognition works (the simple ML inside)

Unsupervised behavioral profiling — the classical UEBA approach, no neural networks:

1. **Learn (training):** per user, login hours are fitted to a Gaussian (mean μ, std dev σ — see the `μ ± σ` column in Learned profiles); devices, locations, and countries become frequency tables.
2. **Detect (live):** each login is scored by deviation — unseen location +25, new country +15, unseen device +20, off-hours +25 (with its z-score shown, e.g. 02:00 for Alex is z=4.4 against μ 12.5), failed bursts +30, capped at 100.
3. **Correlate:** related anomalies for one user merge into a single incident; one login at/above the 60 line already earns an incident card.

| Signal | Points |
|---|---|
| Unusual time (outside usual ±2h, or 22:00–06:00) | +25 |
| Unseen device | +20 |
| Unseen location | +25 |
| First-ever login from a new country | +15 |
| Failed logins (burst ≥5) | +30 (else +20) |
| Sensitive file | +30 |
| Privilege change | +40 |
| Untrusted network | +20 |

Base 5, capped 0–100. Levels: 0–25 LOW, 26–50 MEDIUM, 51–75 HIGH, 76–100 CRITICAL.
Live siren threshold: fixed **60** (inside HIGH, so single strong anomalies page an analyst).

## Live two-tab demo (portal → Threats page, same laptop, no network)

Threats starts with data, not blank: a **past-week baseline** section (174 training events, 10 users, 7 days, 0 anomalies badge, events-per-day chart) proves the model learned clean "normal". The moment the first portal login lands, the baseline sections collapse and the live view (siren, banner, incident cards, live charts) takes over. Nothing scores HIGH/CRITICAL before a real login.

1. `npm run dev`, open `http://localhost:3000` (dashboard) + `http://localhost:3000?view=portal` (plain employee sign-in) in the **same browser**.
2. Dashboard → **Training** → train once.
3. Dashboard → **Threats** → click the sound button once to enable the siren.
4. Portal tab (as `alex@company.com`): sign in from **Austin** → ~5 LOW, page stays quiet. Switch to **Mumbai** → **65 HIGH**: siren + red banner + incident card with risk factors and 4 recommended actions. **Password-guessing burst** → ~95+ CRITICAL, incident escalates.
5. Respond on the dashboard (log out / quarantine / verify / resolve) — the banner cools red → green exactly like before.

Full command runbook with trigger table: see **PRESENTATION.md**.

## How to run

Prerequisites: Node.js 18+ (22 LTS works), npm 9+.

```powershell
Set-Location ai-studio-nexra-1-
npm install
npm run dev
```

Open http://localhost:3000.

Other commands:

```powershell
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint       # type-check (tsc --noEmit)
```

Verified: `npm install`, `npm run lint`, `npm run build` pass on Node v22.17.0 + npm 10.9.2.

### If `npm install` fails with ERESOLVE (vite / esbuild)

`vite@8.3.0` needs `esbuild@^0.27.0 || ^0.28.0`. This repo pins `esbuild: ^0.28.0`. On an old checkout run:

```powershell
npm install --legacy-peer-deps
```

## Usage

### 1. Show the CSV

Open `data/past_week_activity.csv` in Excel/Sheets or the **Activity Data** tab. Search by user, event, location, or device. Point out: one week, normal working hours, one device and location per user.

### 2. Train the model

Go to **Training** → click **Train model on past week**. Days light up one by one (≈0.6s each) with a log like `2026-09-16: learned 24 events (24 total)`. End state: 174 events across 10 users, plus a **Learned profiles** table (usual hours, device, location per user).

### 3. Analyze recent activity

Click **Analyze recent activity** (enabled after training). You land on **Threats**:

- Stat hero: Events analyzed, Anomalies, Critical events, Users at risk — big solid-color cards.
- Charts: **Risk escalation** bar chart (spike at 02:14–02:21) + **Risk distribution** pie + top-user risk bars.
- Incident hero: red banner with huge **CRITICAL** + **100/100** text, `LIVE THREAT` status pill, user, and event count. **The banner cools down live as you respond**: logout −45, quarantine −25, verify −10, resolve locks to 8 LOW. Color shifts red → orange → amber → green, with `was 100 → now X`, `THREAT REDUCED n%`, and a mitigation progress bar. The Users tab mirrors the same live drop.
- **Why this score?** red factor cards, assessment box, and a visual **attack timeline**.
- **Recommended actions — click to respond** (all buttons work and update state live):
  - `Log out everywhere` → revokes sessions, marks incident Contained, logs timestamp
  - `Quarantine account` → blocks sensitive systems, marks Contained, logs timestamp
  - `Mark verified` → records second-channel identity check
  - `Mark resolved` → closes the incident
  - Every click appends to the **Response log** and updates the **Users** tab state (Quarantined / Logged out / Verified).

### 4. Users tab

Learned profile plus current top risk per user. Alex shows CRITICAL after analysis; everyone else LOW.

## Presentation script (3 minutes)

1. "Here is one week of login and usage data." (open CSV, 30s)
2. "NEXRA learns normal behavior per user." (train, watch days progress, 60s)
3. "Now recent activity comes in." (analyze, 20s)
4. "One account deviates: off-hours, unseen device, unseen location, brute force, vault download, privilege escalation." (incident details, 40s)
5. "Risk 100 CRITICAL, one incident from 5 events, with reasons and next steps. Normal users stay LOW." (30s)

## Customizing for your own demo

- Edit training data: `src/data/past_week_activity.csv`, then copy it to `data/past_week_activity.csv` so both stay in sync.
- Edit recent activity: `src/data/liveEvents.ts`.
- Tune weights/thresholds: `src/ml/model.ts` (`scoreEvent`, `correlate`, `getRiskLevel`).
