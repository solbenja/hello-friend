import { useEffect, useMemo, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { Trophy, Flame, Users, Gift, Copy, Check, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RPC_URL, EXPLORER_URL, shortAddr, errMsg } from "@/lib/litvm";
import {
  POINTS_SYSTEM_ADDRESS,
  POINTS_ABI,
  POINTS_DAILY_CAP,
  OWNER_BYPASS_WALLET,
  msUntilIstMidnight,
  formatHMS,
} from "@/lib/pointsSystem";

const readProvider = new JsonRpcProvider(RPC_URL);

type PointsState = {
  total: number;
  daily: number;
  pendingReferral: number;
  referrals: string[];
};

const ZERO: PointsState = { total: 0, daily: 0, pendingReferral: 0, referrals: [] };

export default function Rewards() {
  const { address: walletAddr, isConnected } = useAccount();
  const [data, setData] = useState<PointsState>(ZERO);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState(msUntilIstMidnight());
  const [copied, setCopied] = useState(false);

  const isOwner = !!walletAddr && walletAddr.toLowerCase() === OWNER_BYPASS_WALLET;

  const refLink = useMemo(() => {
    if (!walletAddr) return "";
    const base =
      typeof window !== "undefined" ? `${window.location.origin}/swap` : "https://litdex.test-hub.xyz/swap";
    return `${base}?ref=${walletAddr}`;
  }, [walletAddr]);

  const fetchPoints = useCallback(async () => {
    if (!walletAddr) {
      setData(ZERO);
      return;
    }
    setLoading(true);
    try {
      const c = new Contract(POINTS_SYSTEM_ADDRESS, POINTS_ABI, readProvider);
      const [pts, pending, refs] = await Promise.all([
        c.getPoints(walletAddr),
        c.getPendingReferralPoints(walletAddr),
        c.getReferrals(walletAddr),
      ]);
      setData({
        total: Number(pts[0]),
        daily: Number(pts[1]),
        pendingReferral: Number(pending),
        referrals: (refs as string[]) ?? [],
      });
    } catch (e) {
      console.error("getPoints failed", e);
    } finally {
      setLoading(false);
    }
  }, [walletAddr]);

  useEffect(() => {
    fetchPoints();
    const id = setInterval(fetchPoints, 10_000);
    return () => clearInterval(id);
  }, [fetchPoints]);

  useEffect(() => {
    const id = setInterval(() => {
      const ms = msUntilIstMidnight();
      setCountdown(ms);
      if (ms < 1000) fetchPoints();
    }, 1000);
    return () => clearInterval(id);
  }, [fetchPoints]);

  const claim = async () => {
    if (!walletAddr) return;
    setClaiming(true);
    try {
      const provider = new BrowserProvider((window as { ethereum?: unknown }).ethereum as never);
      const signer = await provider.getSigner();
      const c = new Contract(POINTS_SYSTEM_ADDRESS, POINTS_ABI, signer);
      const tx = await c.claimReferralPoints();
      toast({ title: "Claiming referral points…", description: shortAddr(tx.hash) });
      await tx.wait();
      toast({ title: "✨ Referral points claimed" });
      fetchPoints();
    } catch (e) {
      toast({ title: "Claim failed", description: errMsg(e), variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  const copyRef = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const dailyPct = Math.min(100, (data.daily / POINTS_DAILY_CAP) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl">
            <span className="text-gradient-aurora">Rewards</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn points on-chain — swap, provide liquidity, deploy, and refer friends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Owner
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPoints}
            disabled={loading || !isConnected}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!isConnected && (
        <Card className="border-primary/20 bg-primary/5 p-6 text-sm text-muted-foreground">
          Connect your wallet to view and earn points.
        </Card>
      )}

      <Card className="relative overflow-hidden border-border/40 bg-card/40 p-6 backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Total Points
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="font-display text-6xl font-bold text-gradient-aurora md:text-7xl">
                {data.total.toLocaleString()}
              </div>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              On-chain · {shortAddr(POINTS_SYSTEM_ADDRESS)}
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-background/40 p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Daily cap</span>
              <span className="font-mono text-primary">
                {data.daily} / {POINTS_DAILY_CAP}
              </span>
            </div>
            <Progress value={dailyPct} className="mt-2 h-2" />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Resets in (IST)
              </span>
              <span className="font-mono text-base text-foreground">{formatHMS(countdown)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Daily"
          value={`${data.daily}/${POINTS_DAILY_CAP}`}
          hint="Resets at 00:00 IST"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Lifetime"
          value={data.total.toLocaleString()}
          hint="All-time points"
        />
        <StatCard
          icon={<Gift className="h-4 w-4" />}
          label="Pending Referral"
          value={data.pendingReferral.toLocaleString()}
          hint="Claimable bonus"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Referrals"
          value={String(data.referrals.length)}
          hint="Wallets you referred"
        />
      </div>

      <Card className="border-border/40 bg-card/40 p-6 backdrop-blur-xl">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          How to earn
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <EarnRow label="Swap" pts="+1" />
          <EarnRow label="Add Liquidity" pts="+2" />
          <EarnRow label="Deploy Contract" pts="+3" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Daily cap of {POINTS_DAILY_CAP} per wallet. Counter resets every 00:00 IST on-chain.
        </p>
      </Card>

      <Card className="border-border/40 bg-card/40 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Referral Link
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Earn +5 pts after each referred wallet completes 5 transactions.
            </div>
          </div>
          <Button
            onClick={claim}
            disabled={!isConnected || claiming || data.pendingReferral === 0}
            className="gap-2"
          >
            <Gift className="h-4 w-4" />
            {claiming ? "Claiming…" : `Claim ${data.pendingReferral} pts`}
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/40 bg-background/40 p-3">
          <code className="flex-1 truncate font-mono text-xs text-foreground/80">
            {refLink || "Connect wallet to generate your link"}
          </code>
          <Button
            size="sm"
            variant="outline"
            disabled={!refLink}
            onClick={copyRef}
            className="gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {data.referrals.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Your Referrals ({data.referrals.length})
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.referrals.map((r) => (
                <a
                  key={r}
                  href={`${EXPLORER_URL}/address/${r}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border/40 bg-background/40 px-3 py-2 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  {shortAddr(r)}
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>

      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Source of truth · PointsSystemV2 on LitVM
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/40 bg-card/40 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </Card>
  );
}

function EarnRow({ label, pts }: { label: string; pts: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-primary">{pts}</span>
    </div>
  );
}
