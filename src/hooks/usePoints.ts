import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { toast } from "sonner";
import { RPC_URL } from "@/lib/litvm";
import { POINTS_SYSTEM_ADDRESS, POINTS_ABI, POINTS_DAILY_CAP } from "@/lib/pointsSystem";

const readProvider = new JsonRpcProvider(RPC_URL);

export type PointsKind = "swap" | "lp" | "deploy";

const KIND_META: Record<PointsKind, { fn: string; pts: number; label: string }> = {
  swap: { fn: "recordSwap", pts: 1, label: "Swap" },
  lp: { fn: "recordLP", pts: 2, label: "LP" },
  deploy: { fn: "recordDeploy", pts: 3, label: "Deploy" },
};

export interface PointsState {
  total: number;
  daily: number;
  loading: boolean;
}

const ZERO: PointsState = { total: 0, daily: 0, loading: false };

/**
 * Reads PointsSystemV2 contract for the connected wallet.
 * - Polls every 10s
 * - `recordSilent(kind)` fires the on-chain record tx without blocking the
 *   main success flow. It shows tiny sonner toasts and refetches on success.
 *   Failures (including user reject) are swallowed.
 */
export function usePoints() {
  const { address } = useAccount();
  const [state, setState] = useState<PointsState>(ZERO);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!address) {
      setState(ZERO);
      return;
    }
    try {
      const c = new Contract(POINTS_SYSTEM_ADDRESS, POINTS_ABI, readProvider);
      const pts = await c.getPoints(address);
      setState({ total: Number(pts[0]), daily: Number(pts[1]), loading: false });
    } catch {
      // soft-fail; keep last value
    }
  }, [address]);

  useEffect(() => {
    fetchPoints();
    const id = setInterval(fetchPoints, 10_000);
    return () => clearInterval(id);
  }, [fetchPoints]);

  const recordSilent = useCallback(
    async (kind: PointsKind) => {
      if (!address) return;
      // Cap-check using last known contract value
      if (state.daily >= POINTS_DAILY_CAP) return;

      const meta = KIND_META[kind];
      const eth = (window as { ethereum?: unknown }).ethereum;
      if (!eth) return;

      try {
        toast.message(`Recording +${meta.pts} point${meta.pts > 1 ? "s" : ""}…`);
        const provider = new BrowserProvider(eth as never);
        const signer = await provider.getSigner();
        const c = new Contract(POINTS_SYSTEM_ADDRESS, POINTS_ABI, signer);
        const tx = await c[meta.fn]();
        await tx.wait();
        toast.success(`⚡ +${meta.pts} point${meta.pts > 1 ? "s" : ""} earned!`);
        // immediate refetch + a follow-up to catch indexing
        fetchPoints();
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(fetchPoints, 3000);
      } catch {
        // Silent: do NOT disturb the main success flow
      }
    },
    [address, state.daily, fetchPoints],
  );

  return { ...state, refetch: fetchPoints, recordSilent };
}

export { KIND_META, POINTS_DAILY_CAP };
