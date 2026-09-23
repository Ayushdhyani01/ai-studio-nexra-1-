import type { ActivityRow } from "./csv";

/**
 * Local cross-tab bus. The employee portal tab publishes raw login events,
 * the dashboard tab subscribes — no server, no network.
 * BroadcastChannel (same browser) with a localStorage fallback.
 */
export interface BusMessage {
  kind: "login" | "burst";
  row: ActivityRow;
  sentAt: number;
}

const CHANNEL = "nexra-bus";
const FALLBACK_KEY = "nexra-bus-fallback";

function getChannel(): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel !== "undefined") return new BroadcastChannel(CHANNEL);
  } catch {
    /* ignore */
  }
  return null;
}

export function publishLogin(row: ActivityRow, kind: BusMessage["kind"] = "login"): void {
  const msg: BusMessage = { kind, row, sentAt: Date.now() };
  const ch = getChannel();
  if (ch) {
    ch.postMessage(msg);
    ch.close();
  }
  // Fallback / cross-window: storage events fire in OTHER tabs.
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(msg));
  } catch {
    /* ignore */
  }
}

export function subscribeToLogins(onMessage: (msg: BusMessage) => void): () => void {
  const ch = getChannel();
  const onChannel = (e: MessageEvent) => {
    if (e.data && typeof e.data.row !== "undefined") onMessage(e.data as BusMessage);
  };
  ch?.addEventListener("message", onChannel);

  const onStorage = (e: StorageEvent) => {
    if (e.key !== FALLBACK_KEY || !e.newValue) return;
    try {
      onMessage(JSON.parse(e.newValue) as BusMessage);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    ch?.removeEventListener("message", onChannel);
    ch?.close();
    window.removeEventListener("storage", onStorage);
  };
}

/** "YYYY-MM-DD HH:MM:SS" in local time. */
export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
