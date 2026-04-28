import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import { Link } from "react-router-dom";
import { TiltCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  GRID_SIZE, levelColor, levelImage, litlandProvider, plotContract, tryRead,
} from "@/lib/litland";
import { LITVM_CHAIN_ID } from "@/lib/litvm";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type PlotInfo = { owner: string; level: number };

export default function WorldMap() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [info, setInfo] = useState<PlotInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(6); // px per cell
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plots, setPlots] = useState<Map<string, PlotInfo>>(new Map());

  // Draw grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const px = zoom;
    canvas.width = GRID_SIZE * px;
    canvas.height = GRID_SIZE * px;
    // background
    ctx.fillStyle = "#0D1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // unclaimed cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const k = `${x},${y}`;
        const p = plots.get(k);
        ctx.fillStyle = p ? levelColor(p.level) : "#1f2937";
        ctx.fillRect(x * px, y * px, px - 1, px - 1);
      }
    }
    // selection highlight
    if (selected) {
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = 2;
      ctx.strokeRect(selected.x * px, selected.y * px, px - 1, px - 1);
    }
  }, [zoom, plots, selected]);

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
    const cy = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
    const x = Math.floor(cx / zoom);
    const y = Math.floor(cy / zoom);
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;
    setSelected({ x, y });
    void loadPlot(x, y);
  }

  async function loadPlot(x: number, y: number) {
    setInfo(null);
    const c = plotContract(litlandProvider);
    const owner = await tryRead<string>([
      () => c.plotOwner(x, y),
      () => c.ownerOf(BigInt(y) * BigInt(GRID_SIZE) + BigInt(x)),
    ]);
    const lvlRaw = await tryRead<bigint | number>([
      () => c.plotLevel(x, y),
      () => c.levelOf(x, y),
    ]);
    const level = lvlRaw == null ? 0 : Number(lvlRaw);
    const ownerStr = owner && owner !== "0x0000000000000000000000000000000000000000" ? owner : "";
    const next = { owner: ownerStr, level };
    setInfo(next);
    if (ownerStr) {
      setPlots((prev) => {
        const m = new Map(prev);
        m.set(`${x},${y}`, next);
        return m;
      });
    }
  }

  async function ensureChain() {
    if (chain?.id !== LITVM_CHAIN_ID) {
      try { await switchChain({ chainId: LITVM_CHAIN_ID }); } catch { /* ignore */ }
    }
  }

  async function claim() {
    if (!selected) return;
    if (!address) { toast.error("Connect your wallet"); return; }
    await ensureChain();
    setBusy(true);
    try {
      const eth = (window as any).ethereum;
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = plotContract(signer);
      let tx;
      try { tx = await c.claimPlot(selected.x, selected.y); }
      catch { tx = await c.claim(selected.x, selected.y); }
      toast.message("Claim submitted", { description: tx.hash });
      await tx.wait();
      toast.success(`Plot (${selected.x}, ${selected.y}) claimed!`);
      await loadPlot(selected.x, selected.y);
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  const isMine = useMemo(
    () => !!info?.owner && !!address && info.owner.toLowerCase() === address.toLowerCase(),
    [info, address],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-aurora">LitLand · World Map</h1>
          <p className="text-sm text-muted-foreground mt-1">100×100 grid · 10,000 plots · Claim. Upgrade. Conquer.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Zoom</span>
          <input type="range" min={3} max={12} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          <span className="font-mono">{zoom}px</span>
        </div>
      </div>

      <TiltCard>
        <div className="rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-md">
          <div className="overflow-auto rounded-lg" style={{ maxHeight: "70vh" }}>
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              className="cursor-crosshair"
              style={{ imageRendering: "pixelated", display: "block" }}
            />
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: "#1f2937" }} /> Unclaimed</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: levelColor(1) }} /> L1</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: levelColor(5) }} /> L5</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: levelColor(10) }} /> L10</span>
          </div>
        </div>
      </TiltCard>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Plot ({selected?.x}, {selected?.y})
            </DialogTitle>
          </DialogHeader>
          {!info ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : !info.owner ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">This plot is unclaimed. Claim it for free.</p>
              <Button onClick={claim} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim Plot (FREE)"}
              </Button>
            </div>
          ) : isMine ? (
            <div className="space-y-3">
              <img src={levelImage(info.level || 1)} alt="" className="w-full rounded-lg border border-border/40" />
              <div className="text-sm">Level <span className="font-mono">{info.level || 1}</span></div>
              <Link to="/litland/my-plot"><Button className="w-full">Go to My Plot</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              <img src={levelImage(info.level || 1)} alt="" className="w-full rounded-lg border border-border/40" />
              <div className="text-xs text-muted-foreground">Owner</div>
              <div className="font-mono text-xs break-all">{info.owner}</div>
              <div className="text-sm">Level <span className="font-mono">{info.level || 1}</span></div>
              <Button variant="secondary" className="w-full" onClick={() => setSelected(null)}>Visit (close)</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
