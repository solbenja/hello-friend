// PointsSystemV2 — deployed on LitVM (Chain 4441)
// Source of truth for all points (swap +1, LP +2, deploy +3, daily cap 100, IST reset)

export const POINTS_SYSTEM_ADDRESS = "0x9E8777D55d906EAF032DEa524Ad26297309B624D" as const;
export const POINTS_DAILY_CAP = 100;
export const OWNER_BYPASS_WALLET = "0x3BC6348E1E569E97Bd8247b093475A4aC22B9fD4".toLowerCase();

export const POINTS_ABI = [
  "function getPoints(address user) view returns (uint256 total, uint256 daily)",
  "function getReferrals(address user) view returns (address[])",
  "function getPendingReferralPoints(address user) view returns (uint256)",
  "function getCurrentDay() view returns (uint256)",
  "function recordSwap()",
  "function recordLP()",
  "function recordDeploy()",
  "function registerReferral(address referrer)",
  "function claimReferralPoints()",
  "event PointsEarned(address indexed user, uint256 points, string reason)",
] as const;

// Time until next 00:00 IST (UTC+5:30) — returns ms
export function msUntilIstMidnight(now: Date = new Date()): number {
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const nextMidnight = new Date(istNow);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  return nextMidnight.getTime() - istNow.getTime();
}

export function formatHMS(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
