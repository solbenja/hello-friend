export type NotifType =
  | "swap" | "lp" | "deploy" | "points" | "checkin"
  | "nft" | "gf" | "quest" | "faucet"
  | "game" | "convert" | "milestone";

export type Notification = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
};

const key = (w: string) => `litdex_notifications_${w.toLowerCase()}`;

export function getNotifs(wallet: string): Notification[] {
  if (!wallet) return [];
  try {
    const raw = localStorage.getItem(key(wallet));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addNotif(
  wallet: string,
  notif: Omit<Notification, "id" | "timestamp" | "read">
) {
  if (!wallet) return [];
  const all = getNotifs(wallet);
  const newNotif: Notification = {
    ...notif,
    id: (crypto as any).randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    read: false,
  };
  const updated = [newNotif, ...all].slice(0, 50);
  try { localStorage.setItem(key(wallet), JSON.stringify(updated)); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent("litdex:notif", { detail: { wallet } })); } catch { /* ignore */ }
  return updated;
}

export function markAllRead(wallet: string) {
  const all = getNotifs(wallet).map(n => ({ ...n, read: true }));
  try { localStorage.setItem(key(wallet), JSON.stringify(all)); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent("litdex:notif", { detail: { wallet } })); } catch { /* ignore */ }
  return all;
}

export function clearAll(wallet: string) {
  try { localStorage.removeItem(key(wallet)); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent("litdex:notif", { detail: { wallet } })); } catch { /* ignore */ }
  return [];
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
