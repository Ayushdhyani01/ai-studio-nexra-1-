import { useEffect, useState } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { KNOWN_USERS, PORTAL_LOCATIONS, UNKNOWN_DEVICE } from "../data/users";
import { nowStamp, publishLogin } from "../ml/bus";
import type { ActivityRow } from "../ml/csv";

/**
 * Fake employee sign-in page. Open with ?view=portal in a second tab.
 * Deliberately plain corporate styling — judges should read it as
 * "the employee's system", not part of NEXRA.
 */
export default function PortalPage() {
  const [email, setEmail] = useState("alex@company.com");
  const [password, setPassword] = useState("");
  const [locLabel, setLocLabel] = useState(PORTAL_LOCATIONS[0].label);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Company Single Sign-On";
  }, []);

  const user = KNOWN_USERS.find((u) => u.userEmail === email) ?? KNOWN_USERS[0];
  const loc = PORTAL_LOCATIONS.find((l) => l.label === locLabel) ?? PORTAL_LOCATIONS[0];
  const device = loc.baseline ? user.device : UNKNOWN_DEVICE;

  function buildRow(eventType: string, details: string): ActivityRow {
    return {
      timestamp: nowStamp(),
      userId: user.userId,
      userEmail: user.userEmail,
      eventType,
      device,
      location: loc.location,
      ipAddress: loc.ipAddress,
      details,
    };
  }

  function signIn() {
    publishLogin(buildRow("Login", loc.baseline ? "Sign-in via SSO with MFA" : "Sign-in from unrecognized network"), "login");
    setSent(`${email} signed in from ${loc.location}`);
  }

  function burst() {
    publishLogin(
      buildRow("Failed Login", "8 failed authentication attempts"),
      "burst"
    );
    setSent(`Password-guessing burst sent for ${email} from ${loc.location}`);
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-300 rounded-lg shadow p-6">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-white rounded p-1.5">
            <Building2 size={18} />
          </span>
          <div>
            <h1 className="text-base font-bold leading-tight">Company Single Sign-On</h1>
            <p className="text-xs text-slate-500">Employee sign-in</p>
          </div>
        </div>

        <label className="block text-xs font-semibold mt-5 mb-1" htmlFor="portal-email">Work email</label>
        <select
          id="portal-email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSent(null);
          }}
          className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white"
        >
          {KNOWN_USERS.map((u) => (
            <option key={u.userId} value={u.userEmail}>{u.userEmail}</option>
          ))}
        </select>

        <label className="block text-xs font-semibold mt-3 mb-1" htmlFor="portal-pass">Password</label>
        <input
          id="portal-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white"
        />

        <label className="block text-xs font-semibold mt-3 mb-1" htmlFor="portal-loc">Sign-in location (demo network)</label>
        <select
          id="portal-loc"
          value={locLabel}
          onChange={(e) => {
            setLocLabel(e.target.value);
            setSent(null);
          }}
          className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white"
        >
          {PORTAL_LOCATIONS.map((l) => (
            <option key={l.label} value={l.label}>{l.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">Device: {device}</p>

        <button onClick={signIn} className="mt-4 w-full bg-slate-800 text-white text-sm font-semibold py-2 rounded">
          Sign in
        </button>
        <button onClick={burst} className="mt-2 w-full border border-slate-400 text-slate-700 text-sm font-semibold py-2 rounded bg-white">
          Simulate password-guessing burst
        </button>

        {sent && (
          <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            {sent}
          </p>
        )}
      </div>
    </div>
  );
}
