import { useEffect, useState } from "react";
import { BrowserProvider, formatUnits } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import { TiltCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  litlContract, litlandProvider, plotContract, levelImage, tryRead, GRID_SIZE,
} from "@/lib/litland";
import { LITVM_CHAIN_ID } from "@/lib/litvm";
import { Loader2 } from "lucide-react";

export default function MyPlot() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [level, setLevel] = useState(1);
  const [finishAt, setFinishAt] = useState<number>(0);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [litlBal, setLitlBal] = useState("0");
  const [allianceId, setAllianceId] = useState<string>("");
  const [allianceName, setAllianceName] = useState("");
  const [newAllianceName, setNewAllianceName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    if (!address) return;
    // LITL balance
    try {
      const c = litlContract(litlandProvider);
      const [bal, dec] = await Promise.all([c.balanceOf(address), c.decimals().catch(() => 18n)]);
      setLitlBal(formatUnits(bal, Number(dec)));
    } catch { /* ignore */ }
    // Plot info for chosen coords
    const p = plotContract(litlandProvider);
    const lvl = await tryRead<bigint | number>([
      () => p.plotLevel(coords.x, coords.y),
      () => p.levelOf(coords.x, coords.y),
    ]);
    setLevel(lvl == null ? 1 : Math.max(1, Number(lvl)));
    const fin = await tryRead<bigint>([() => p.upgradeFinishAt(coords.x, coords.y)]);
    setFinishAt(fin ? Number(fin) : 0);
    // Alliance
    const a = await tryRead<bigint>([() => p.allianceOf(address)]);
    if (a != null) {
      const id = a.toString();
      setAllianceId(id);
      if (id !== "0") {
        const name = await tryRead<string>([() => p.allianceName(a)]);
        setAllianceName(name || "");
      } else {
        setAllianceName("");
      }
    }
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, [address, coords.x, coords.y]);

  async function getSigner() {
    if (chain?.id !== LITVM_CHAIN_ID) {
      try { await switchChain({ chainId: LITVM_CHAIN_ID }); } catch { /* ignore */ }
    }
    const eth = (window as any).ethereum;
    const provider = new BrowserProvider(eth);
    return provider.getSigner();
  }

  async function call(label: string, fn: (c: any) => Promise<any>) {
    if (!address) { toast.error("Connect your wallet"); return; }
    setBusy(true);
    try {
      const signer = await getSigner();
      const c = plotContract(signer);
      const tx = await fn(c);
      toast.message(`${label} submitted`, { description: tx.hash });
      await tx.wait();
      toast.success(`${label} confirmed`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || `${label} failed`);
    } finally {
      setBusy(false);
    }
  }

  const upgrading = finishAt > 0 && finishAt > now;
  const ready = finishAt > 0 && finishAt <= now;
  const remaining = upgrading ? finishAt - now : 0;
  const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-aurora">My Plot</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your LitLand plot, upgrade levels, and join alliances.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TiltCard>
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-md space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input type="number" min={0} max={GRID_SIZE - 1} value={coords.x}
                  onChange={(e) => setCoords({ ...coords, x: Math.max(0, Math.min(GRID_SIZE - 1, Number(e.target.value) || 0)) })} />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input type="number" min={0} max={GRID_SIZE - 1} value={coords.y}
                  onChange={(e) => setCoords({ ...coords, y: Math.max(0, Math.min(GRID_SIZE - 1, Number(e.target.value) || 0)) })} />
              </div>
            </div>
            <img src={levelImage(level)} alt={`Level ${level}`} className="w-full rounded-lg border border-border/40" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Level</span>
              <span className="font-mono text-primary">L{level}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">LITL Balance</span>
              <span className="font-mono">{Number(litlBal).toFixed(4)}</span>
            </div>
            {upgrading && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Upgrading</div>
                <div className="font-mono text-xl text-primary">{hh}:{mm}:{ss}</div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button disabled={busy || upgrading} onClick={() => call("Start upgrade", (c) => c.startUpgrade(coords.x, coords.y))}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start"}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => call("Instant upgrade", (c) => c.instantUpgrade(coords.x, coords.y))}>
                Instant
              </Button>
              <Button disabled={busy || !ready} onClick={() => call("Claim upgrade", (c) => c.claimUpgrade(coords.x, coords.y))}>
                Claim
              </Button>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-md space-y-3">
            <h2 className="font-display text-lg font-semibold">Alliance</h2>
            {allianceId && allianceId !== "0" ? (
              <div className="space-y-2 text-sm">
                <div>Member of <span className="font-mono text-primary">#{allianceId}</span> {allianceName && <>· {allianceName}</>}</div>
                <Button variant="destructive" disabled={busy} onClick={() => call("Leave alliance", (c) => c.leaveAlliance())}>Leave Alliance</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Create Alliance</Label>
                  <div className="flex gap-2">
                    <Input value={newAllianceName} onChange={(e) => setNewAllianceName(e.target.value)} placeholder="Name" />
                    <Button disabled={busy || !newAllianceName} onClick={() => call("Create alliance", (c) => c.createAlliance(newAllianceName))}>Create</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Join Alliance</Label>
                  <div className="flex gap-2">
                    <Input value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="ID" />
                    <Button disabled={busy || !joinId} onClick={() => call("Join alliance", (c) => c.joinAlliance(BigInt(joinId)))}>Join</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
