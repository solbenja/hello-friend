import { Zap } from "lucide-react";
import { usePoints, KIND_META, POINTS_DAILY_CAP, type PointsKind } from "@/hooks/usePoints";

/**
 * Inline teal hint shown on action cards (Swap/Pool/Deploy/Forge).
 * Auto-hides when daily cap reached or wallet disconnected.
 */
export function PointsPreview({ kind, verb }: { kind: PointsKind; verb: string }) {
  const { daily } = usePoints();
  if (daily >= POINTS_DAILY_CAP) return null;
  const meta = KIND_META[kind];
  return (
    <div className="flex items-center justify-center gap-1.5 text-[11px] text-primary/80">
      <Zap className="h-3 w-3" />
      <span>
        {verb} earns +{meta.pts} point{meta.pts > 1 ? "s" : ""} ({daily}/{POINTS_DAILY_CAP} today)
      </span>
    </div>
  );
}

/**
 * Earned-points line shown inside the success modal. Reads the *current*
 * daily value (post-record) so the X/100 number reflects the new state.
 */
export function PointsEarned({ kind }: { kind: PointsKind }) {
  const { daily } = usePoints();
  const meta = KIND_META[kind];
  if (daily >= POINTS_DAILY_CAP && daily - meta.pts >= POINTS_DAILY_CAP) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
      <Zap className="h-3.5 w-3.5" />
      +{meta.pts} Point{meta.pts > 1 ? "s" : ""} Earned! ({daily}/{POINTS_DAILY_CAP} today)
    </div>
  );
}
