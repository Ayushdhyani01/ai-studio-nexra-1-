# NEXRA — Demo Runbook (commands & clicks only)

Two people, one laptop, two browser tabs, zero network.

## 1. Start the server

```powershell
Set-Location E:\expSIH2\ai-studio-nexra-1-
npm install    # first time only
npm run dev
```

Leave this terminal running. Expected output ends with `Local: http://localhost:3000/`.

## 2. Open the two tabs (same browser)

| Tab | URL | Operator |
|---|---|---|
| Tab 1 — dashboard | `http://localhost:3000` | Presenter (projector) |
| Tab 2 — employee login | `http://localhost:3000?view=portal` | Teammate |

Same browser is required (tabs sync peer-to-peer; no server, no wifi needed).

## 3. Setup clicks (before judges arrive)

On Tab 1:
1. Click **Training** → **Train model on past week** → wait for `Training complete: 174 events across 10 users`.
2. Click **Threats** → click the **sound button** once (enables the siren; this click unlocks browser audio). Confirm laptop volume is up.
3. Confirm Threats shows the **past-week baseline** section (174 EVENTS · 0 ANOMALIES + per-day chart) and an **"All quiet"** notice — data on screen, zero threats.

On Tab 2:
1. Select `alex@company.com`, location `Austin, TX — office`. Do not click anything else yet.

## 4. Trigger sequence (during the demo)

| # | Who | Action | Expected result on Tab 1 (Threats) |
|---|---|---|---|
| 1 | Teammate | Tab 2 → **Sign in** (Austin) | New row, **~5 LOW**, page stays quiet |
| 2 | Teammate | Tab 2 → location **Mumbai, India** → **Sign in** | New row **65 HIGH**, chart crosses red 60 line, **siren + red banner + incident card** with risk factors and 4 recommended actions |
| 3 | Presenter | Tab 1 → **Acknowledge** | Siren stops |
| 4 | Teammate (optional) | Tab 2 → **Simulate password-guessing burst** | New row **~95 CRITICAL**, second alert, incident escalates |
| 5 | Presenter (optional) | Tab 1 → **Log out everywhere** | Banner cools (score drops, color shifts red → green) |

## 5. Replay / reset

- Tab 1 → Threats → **Reset** clears the feed, alerts, and counter. Repeat the trigger sequence from step 4 as many times as needed.
- Retraining (Training → **Retrain model**) also clears all live state.
- Logins sent before training are queued and auto-scored when training completes.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run dev` port busy | `npm run dev -- --port 3001`, then use `http://localhost:3001` in both tabs |
| No siren | Re-click **Arm live monitor + enable sound** (re-unlocks audio); check OS volume |
| Tab 2 event never appears on Tab 1 | Reopen `?view=portal` in the same browser as Tab 1; check both URLs share host + port |
| Wrong location injected | Tab 1 → **Reset**, redo the trigger |
| Need a fresh state mid-demo | Reload Tab 1 → retrain (~5s) → re-arm |

## 7. Reference

- Alert threshold: **60** (fixed). Risk bands: 0–25 LOW, 26–50 MEDIUM, 51–75 HIGH, 76–100 CRITICAL.
- Score check: Austin login ≈ 5, first Mumbai login = 65 (5 + 25 location + 20 device + 15 new country), Mumbai burst ≈ 95+.
- ML in one line: per-user Gaussian on login hours (Alex μ 12.5, σ 2.4 — 02:00 is z=4.4) + frequency tables for device/location/country; deviations convert to points.
- Key files: `src/App.tsx` (Training, Threats), `src/portal/PortalPage.tsx` (`?view=portal`), `src/ml/model.ts` (train/score), `src/ml/bus.ts` (tab sync), `src/ml/sound.ts` (siren), `data/past_week_activity.csv` (training data).
- Verify commands: `npm run lint`, `npm run build`.

## 8. If judges ask "how does it recognize patterns?"

Say: *"Unsupervised anomaly detection — the classical UEBA approach. For each employee it learns a Gaussian over login hours and frequency tables for devices, locations, and countries. A new login is scored by how far it deviates: Alex's 2am login is 4.4 standard deviations from his mean, from a device and country with zero past sightings. No signatures, no blocklists — which is why it catches things it's never seen before."* Point at the μ ± σ column in Learned profiles and the z-score in the why-reasons.
