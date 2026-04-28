import { useEffect, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import { TiltCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { levelImage, marketContract, litlandProvider, tryRead } from "@/lib/litland";
import { LITVM_CHAIN_ID, shortAddr } from "@/lib/litvm";

type Listing = { id: number; x: number; y: number; seller: string; price: bigint; level: number; active: boolean };

export default function Marketplace() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const c = marketContract(litlandProvider);
      const count = await tryRead<bigint>([() => c.listingsCount()]);
      const n = count ? Number(count) : 0;
      const out: Listing[] = [];
      for (let i = 0; i < n; i++) {
        const r: any = await tryRead<any>([() => c.getListing(i)]);
        if (!r) continue;
        out.push({
          id: i,
          x: Number(r[0] ?? r.x),
          y: Number(r[1] ?? r.y),
          seller: String(r[2] ?? r.seller),
          price: BigInt(r[3] ?? r.price),
          level: Number(r[4] ?? r.level) || 1,
          active: Boolean(r[5] ?? r.active),
        });
      }
      setItems(out.filter((l) => l.active));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function buy(l: Listing) {
    if (chain?.id !== LITVM_CHAIN_ID) {
      try { await switchChain({ chainId: LITVM_CHAIN_ID }); } catch { /* ignore */ }
    }
    setBusy(l.id);
    try {
      const eth = (window as any).ethereum;
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = marketContract(signer);
      let tx;
      try { tx = await c.buyPlot(l.id, { value: l.price }); }
      catch { tx = await c.buyPlot(l.id); }
      toast.message("Buy submitted", { description: tx.hash });
      await tx.wait();
      toast.success("Purchase complete");
      await load();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Buy failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-aurora">LitLand · Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">Buy and sell plots. Powered by the LitLandMarket contract.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading listings…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/40 p-8 text-center text-muted-foreground">No active listings yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <TiltCard key={l.id}>
              <div className="rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-md space-y-2">
                <img src={levelImage(l.level)} alt={`Level ${l.level}`} className="w-full rounded-lg border border-border/40" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">({l.x}, {l.y})</span>
                  <span className="text-primary text-xs">L{l.level}</span>
                </div>
                <div className="text-xs text-muted-foreground">Seller {shortAddr(l.seller)}</div>
                <div className="font-display text-lg">{formatEther(l.price)} <span className="text-xs text-muted-foreground">zkLTC</span></div>
                <Button className="w-full" disabled={busy === l.id} onClick={() => buy(l)}>
                  {busy === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                </Button>
              </div>
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
}
