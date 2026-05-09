import { toast } from "sonner";

export type SuccessRow = { label: string; value: string; href?: string };
export type SuccessPayload = {
  title: string;
  subtitle?: string;
  rows: SuccessRow[];
};

export function showSuccess(payload: SuccessPayload) {
  try {
    window.dispatchEvent(new CustomEvent("litdex:success", { detail: payload }));
  } catch { /* ignore */ }
}

export function showError(message: string) {
  try {
    toast.error(message, {
      duration: 4000,
      style: {
        background: "#0F1115",
        border: "1px solid rgba(255,255,255,0.05)",
        color: "#fff",
        borderRadius: "16px",
      },
    });
  } catch { /* ignore */ }
}

export function showInfo(message: string) {
  try {
    toast(message, {
      duration: 3000,
      style: { background: "#161B22", color: "#fff" },
    });
  } catch { /* ignore */ }
}

export function refreshPoints() {
  try {
    window.dispatchEvent(new CustomEvent("litdex:points-refresh"));
  } catch { /* ignore */ }
}

export function shortHex(addr: string, l = 4, r = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, 2 + l)}...${addr.slice(-r)}`;
}
