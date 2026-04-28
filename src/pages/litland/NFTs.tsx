import { useEffect, useState } from "react";
import { BrowserProvider, formatEther, parseEther } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import { TiltCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { litlandProvider, marketContract, nftContract, tryRead } from "@/lib/litland";
import { LITVM_CHAIN_ID, shortAddr } from "@/lib/litvm";

type Owned = { tokenId: string; uri?: string };
type NFTListing = { id: number; tokenId: string; seller: string; price: bigint; active: boolean };

export default function NFTs() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [owned, setOwned] = useState<Owned[]>([]);
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [busy, setBusy] = useState(false);
  const [mintKind, setMintKind] = useState("0");
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");

  async function ensure() {
    if (chain?.id !== LITVM_CHAIN_ID) {
      try { await switchChain({ chainId: LITVM_CHAIN_ID }); } catch { /* ignore */ }
    }
    const eth = (window as any).ethereum;
    return new BrowserProvider(eth).getSigner();
  }

  async function refresh() {
    // Owned NFTs
    if (address) {
      const c = nftContract(litlandProvider);
      const balRaw = await tryRead<bigint>([() => c.balanceOf(address)]);
      const bal = balRaw ? Number(balRaw) : 0;
      const out: Owned[] = [];
      for (let i = 0; i < bal; i++) {
        const id = await tryRead<bigint>([() => c.tokenOfOwnerByIndex(address, i)]);
        if (id == null) break;
        const uri = await tryRead<string>([() => c.tokenURI(id)]);
        out.push({ tokenId: id.toString(), uri: uri || undefined });
      }
      setOwned(out);
    }
    // Marketplace NFT listings
    const m = marketContract(litlandProvider);
    const count = await tryRead<bigint>([() => m.nftListingsCount()]);
    const n = count ? Number(count) : 0;
    const list: NFTListing[] = [];
    for (let i = 0; i < n; i++) {
      const r: any = await tryRead<any>([() => m.getNFTListing(i)]);
      if (!r) continue;
      list.push({
        id: i,
        tokenId: String(r[0] ?? r.tokenId),
        seller: String(r[1] ?? r.seller),
        price: BigInt(r[2] ?? r.price),
        active: Boolean(r[3] ?? r.active),
      });
    }
    setListings(list.filter((l) => l.active));
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, [address]);

  async function mint() {
    setBusy(true);
    try {
      const signer = await ensure();
      const c = nftContract(signer);
      let tx;
      try { tx = await c.mintWithLITL(BigInt(mintKind || "0")); }
      catch { tx = await c.mint(BigInt(mintKind || "0")); }
      toast.message("Mint submitted", { description: tx.hash });
      await tx.wait();
      toast.success("NFT minted");
      await refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Mint failed");
    } finally {
      setBusy(false);
    }
  }

  async function listNFT() {
    if (!listTokenId || !listPrice) return;
    setBusy(true);
    try {
      const signer = await ensure();
      const nft = nftContract(signer);
      const m = marketContract(signer);
      // approve first
      try {
        const tx0 = await nft.approve(await m.getAddress(), BigInt(listTokenId));
        await tx0.wait();
      } catch { /* maybe already approved */ }
      const tx = await m.listNFT(BigInt(listTokenId), parseEther(listPrice));
      toast.message("Listing submitted", { description: tx.hash });
      await tx.wait();
      toast.success("NFT listed");
      setListTokenId(""); setListPrice("");
      await refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "List failed");
    } finally {
      setBusy(false);
    }
  }

  async function buyNFT(l: NFTListing) {
    setBusy(true);
    try {
      const signer = await ensure();
      const m = marketContract(signer);
      let tx;
      try { tx = await m.buyNFT(l.id, { value: l.price }); }
      catch { tx = await m.buyNFT(l.id); }
      toast.message("Buy submitted", { description: tx.hash });
      await tx.wait();
      toast.success("NFT purchased");
      await refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Buy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-aurora">LitLand · NFTs</h1>
        <p className="text-sm text-muted-foreground mt-1">Mint NFTs with LITL, list them on the market, or buy from other players.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TiltCard>
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-md space-y-3">
            <h2 className="font-display text-lg font-semibold">Mint</h2>
            <div>
              <Label className="text-xs">Kind / Type ID</Label>
              <Input value={mintKind} onChange={(e) => setMintKind(e.target.value)} />
            </div>
            <Button className="w-full" onClick={mint} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mint NFT"}
            </Button>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-md space-y-3">
            <h2 className="font-display text-lg font-semibold">List for Sale</h2>
            <div>
              <Label className="text-xs">Token ID</Label>
              <Input value={listTokenId} onChange={(e) => setListTokenId(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Price (zkLTC)</Label>
              <Input value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="0.10" />
            </div>
            <Button className="w-full" onClick={listNFT} disabled={busy || !listTokenId || !listPrice}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & List"}
            </Button>
          </div>
        </TiltCard>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">My NFTs</h2>
        {owned.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-center text-muted-foreground text-sm">No NFTs yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {owned.map((n) => (
              <div key={n.tokenId} className="rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-md">
                <div className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center font-display text-2xl">#{n.tokenId}</div>
                {n.uri && <div className="mt-2 truncate text-[10px] text-muted-foreground">{n.uri}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Marketplace</h2>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-center text-muted-foreground text-sm">No NFTs listed.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <TiltCard key={l.id}>
                <div className="rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-md space-y-2">
                  <div className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center font-display text-2xl">#{l.tokenId}</div>
                  <div className="text-xs text-muted-foreground">Seller {shortAddr(l.seller)}</div>
                  <div className="font-display">{formatEther(l.price)} <span className="text-xs text-muted-foreground">zkLTC</span></div>
                  <Button className="w-full" onClick={() => buyNFT(l)} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                  </Button>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
