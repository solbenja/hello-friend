import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check, Flame, Loader2, X } from "lucide-react";
import { formatUnits } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { TiltCard } from "@/components/TiltCard";
import { errMsg, shortAddr } from "@/lib/litvm";
import { checkinToday, readCheckinInfo, readCurrentDay } from "@/lib/points";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Next 00:00 IST (UTC+5:30) in epoch ms */
function nextIstMidnightMs() {
  const now = new Date();
  // IST = UTC+5:30
  const istNow = new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60 * 1000);
  const ist = new Date(istNow);
  ist.setUTCHours(0, 0, 0, 0);
  ist.setUTCDate(ist.getUTCDate() + 1);
  // back to UTC
  return ist.getTime() - (5.5 * 60 - now.getTimezoneOffset()) * 60 * 1000;
}

export default function Checkin() {
  const { address, isConnected } = useAccount();
  const [streak, setStreak] = useState<bigint>(0n);
  const [lastDay, setLastDay] = useState<bigint>(0n);
  const [total, setTotal] = useState<bigint>(0n);
  const [nextLDEX, setNextLDEX] = useState<bigint>(0n);
  const [currentDay, setCurrentDay] = useState<bigint>(0n);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const cd = await readCurrentDay();
      setCurrentDay(cd);
    } catch { /* ignore */ }
    if (!address) return;
    try {
      const info = await readCheckinInfo(address);
      setStreak(info.streak); setLastDay(info.lastDay);
      setTotal(info.totalCheckins); setNextLDEX(info.nextLDEX);
    } catch (e) { console.warn(e); }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  const checkedInToday = lastDay > 0n && lastDay === currentDay;
  const countdown = useMemo(() => fmtCountdown(nextIstMidnightMs() - now), [now]);

  // Build Mon..Sun week. Today's column is highlighted.
  // todayIdx: 0=Mon..6=Sun (JS getDay: 0=Sun..6=Sat → map)
  const jsDay = new Date().getDay();
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
  const streakNum = Number(streak);

  // For each weekday slot (0..6), determine state:
  //  - "future"   : after today
  //  - "today"    : today's column (checked or not)
  //  - "done"     : past day covered by current streak
  //  - "missed"   : past day not covered by streak
  type DayState = "future" | "today-pending" | "today-done" | "done" | "missed";
  const week: DayState[] = Array.from({ length: 7 }, (_, i) => {
    if (i > todayIdx) return "future";
    if (i === todayIdx) return checkedInToday ? "today-done" : "today-pending";
    // past day in this week — count days back from today
    const daysBack = todayIdx - i;
    // streak includes today if checked. Days covered going back = streakNum - (checkedInToday ? 1 : 0)
    const pastCovered = streakNum - (checkedInToday ? 1 : 0);
    return daysBack <= pastCovered ? "done" : "missed";
  });

  // Sunday bonus is unknown without contract getter; show informational
  const weekNo = Math.min(4, Math.floor(streakNum / 7) + 1);

  const onCheckin = async () => {
    setBusy(true);
    try {
      const isSunday = new Date().getDay() === 0;
      const ldexAmt = (() => { try { return formatUnits(nextLDEX, 18); } catch { return "0"; } })();
      const hash = await checkinToday();
      toast.success(`✅ Checked in! You earned ${(+ldexAmt).toLocaleString(undefined, { maximumFractionDigits: 4 })} LDEX`, {
        description: shortAddr(hash),
      });
      if (isSunday) toast.success("🎉 Sunday Bonus! +zkLTC reward unlocked");
      refresh();
    } catch (e) {
      toast.error("Check-in failed", { description: errMsg(e).slice(0, 140) });
    } finally { setBusy(false); }
  };

  const nextLdexFmt = useMemo(() => {
    try { return formatUnits(nextLDEX, 18); } catch { return "0"; }
  }, [nextLDEX]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/5 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-teal-400">
            <CalendarCheck className="h-3 w-3" /> Daily Check-in
          </div>
          <h1 className="mt-3 font-display text-5xl">
            <span className="text-gradient-aurora">Keep Your Streak Alive</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Earn LDEX every day. Sundays drop a zkLTC bonus.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-xs">
          <div className="text-[10px] uppercase tracking-wider text-white/30">Total Check-ins</div>
          <div className="mt-0.5 font-display text-2xl text-white">{total.toString()}</div>
        </div>
      </header>

      <TiltCard tiltLimit={4} scale={1.01} className="rounded-2xl">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1117] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10">
                <Flame className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Current Streak</div>
                <div className="font-display text-5xl text-orange-400">{streakNum} <span className="text-base text-white/40">days</span></div>
                <div className="mt-1 text-[11px] text-white/40">Week {weekNo} / 4 · Miss a day and your streak resets</div>
              </div>
            </div>

            <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-wider text-teal-400">Next reward</div>
              <div className="font-display text-2xl text-teal-300">{(+nextLdexFmt).toLocaleString(undefined, { maximumFractionDigits: 4 })} LDEX</div>
              <div className="text-[10px] text-white/40">+ Sunday zkLTC bonus</div>
            </div>
          </div>

          {/* 7-day calendar (Mon → Sun) */}
          <div className="mt-6 grid grid-cols-7 gap-2">
            {week.map((state, i) => {
              const isToday = state === "today-pending" || state === "today-done";
              const borderCls =
                isToday
                  ? "border-teal-500/70 bg-teal-500/10 ring-2 ring-teal-500/30"
                  : state === "done"
                  ? "border-teal-500/40 bg-teal-500/5"
                  : state === "missed"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-white/[0.07] bg-white/[0.02]";
              return (
                <div
                  key={i}
                  className={`flex h-20 flex-col items-center justify-center gap-1 rounded-xl border ${borderCls}`}
                >
                  <div className={`text-[10px] uppercase tracking-wider ${isToday ? "text-teal-300" : "text-white/40"}`}>
                    {DAY_NAMES[i]}
                  </div>
                  {state === "today-done" && <Check className="h-5 w-5 text-teal-400" />}
                  {state === "today-pending" && <div className="h-4 w-4 rounded-full border-2 border-teal-400/70" />}
                  {state === "done" && <Check className="h-5 w-5 text-teal-400" />}
                  {state === "missed" && <X className="h-5 w-5 text-red-400/70" />}
                  {state === "future" && <div className="h-4 w-4 rounded-full bg-white/5" />}
                  {isToday && <div className="text-[9px] font-semibold uppercase tracking-wider text-teal-300">Today</div>}
                </div>
              );
            })}
          </div>

          {/* Inline action */}
          <div className="mt-6">
            {!isConnected ? (
              <button disabled className="h-14 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/40">
                Connect wallet to check in
              </button>
            ) : checkedInToday ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/5 p-5 text-center">
                <Check className="h-8 w-8 text-teal-400" />
                <div className="font-display text-lg text-white">Come back tomorrow!</div>
                <div className="font-mono text-xs text-white/50">Next reset in {countdown} (IST)</div>
              </div>
            ) : (
              <button
                onClick={onCheckin}
                disabled={busy}
                className="h-14 w-full rounded-xl border border-teal-500/60 bg-teal-500/20 text-sm font-bold uppercase tracking-[0.2em] text-teal-300 transition-colors hover:bg-teal-500/30 disabled:opacity-60"
              >
                {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking in…</span> : "Check In Today"}
              </button>
            )}
          </div>
        </div>
      </TiltCard>

      {/* Floating Check-In button (bottom-right) */}
      {isConnected && (
        <button
          onClick={checkedInToday ? undefined : onCheckin}
          disabled={busy || checkedInToday}
          aria-label="Check in today"
          className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold shadow-2xl shadow-black/50 transition-all ${
            checkedInToday
              ? "cursor-not-allowed bg-white/10 text-white/40"
              : "bg-[#4FD1C5] text-[#0d1117] hover:scale-105 hover:bg-[#5fdccf]"
          }`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CalendarCheck className="h-5 w-5" />
          )}
          <span>{checkedInToday ? "✓ Checked In" : "Check In Today"}</span>
        </button>
      )}
    </div>
  );
}
