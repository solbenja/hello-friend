// Local per-wallet, per-IST-day points tracker (separate from on-chain points)
// Used purely for UI preview / earned indicators across Swap, Pool, Deploy, Forge.

export const LOCAL_DAILY_CAP = 100;

export type LocalPointsKind = "swap" | "lp" | "deploy";

export const POINTS_PER_KIND: Record<LocalPointsKind, number> = {
  swap: 1,
  lp: 2,
  deploy: 3,
};

/** Current IST date as YYYY-MM-DD (UTC+5:30). */
export function istDateKey(d: Date = new Date()): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dailyKey(addr: string, day = istDateKey()) {
  return `litdex_points_${addr.toLowerCase()}_${day}`;
}
function totalKey(addr: string) {
  return `litdex_points_total_${addr.toLowerCase()}`;
}

const EVT = "litdex:local-points-update";

function readNum(k: string): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(k);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}
function writeNum(k: string, n: number) {
  try {
    window.localStorage.setItem(k, String(n));
  } catch {
    /* ignore */
  }
}

/** Today's points for the wallet (auto-resets at IST midnight via key change). */
export function getTodayPoints(addr?: string | null): number {
  if (!addr) return 0;
  return readNum(dailyKey(addr));
}

/** Lifetime total across all days. */
export function getTotalPoints(addr?: string | null): number {
  if (!addr) return 0;
  return readNum(totalKey(addr));
}

/**
 * Award points for an action. Caps daily at LOCAL_DAILY_CAP.
 * Returns the actual points awarded (0 if cap already hit).
 */
export function awardPoints(addr: string | undefined | null, kind: LocalPointsKind): number {
  if (!addr) return 0;
  const want = POINTS_PER_KIND[kind];
  const dKey = dailyKey(addr);
  const today = readNum(dKey);
  if (today >= LOCAL_DAILY_CAP) return 0;
  const grant = Math.min(want, LOCAL_DAILY_CAP - today);
  writeNum(dKey, today + grant);
  writeNum(totalKey(addr), readNum(totalKey(addr)) + grant);
  try {
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* ignore */
  }
  return grant;
}

/** React-friendly subscription hook. */
import { useEffect, useState, useCallback } from "react";

export function useLocalPoints(addr?: string | null) {
  const read = useCallback(
    () => ({ today: getTodayPoints(addr), total: getTotalPoints(addr) }),
    [addr]
  );
  const [state, setState] = useState(read);

  useEffect(() => {
    setState(read());
    const handler = () => setState(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    // Tick once a minute to catch IST midnight rollovers without a manual refresh.
    const t = setInterval(handler, 60_000);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
      clearInterval(t);
    };
  }, [read]);

  return {
    today: state.today,
    total: state.total,
    remaining: Math.max(0, LOCAL_DAILY_CAP - state.today),
    capReached: state.today >= LOCAL_DAILY_CAP,
    cap: LOCAL_DAILY_CAP,
  };
}
