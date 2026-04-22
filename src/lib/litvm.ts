import { defineChain } from "viem";

export const RPC_URL = "https://api.republicstats.xyz/litvm/rpc";
export const EXPLORER_URL = "https://liteforge.explorer.caldera.xyz";
export const LITVM_CHAIN_ID = 4441;

export const litvmChain = defineChain({
  id: LITVM_CHAIN_ID,
  name: "LitVM LiteForge",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "LiteForge", url: EXPLORER_URL },
  },
  testnet: true,
});

// ── Router & token addresses (from working HTML) ─────────────────────────────
export const NATIVE_SENTINEL = "NATIVE";
export const DEFAULT_ROUTER = "0xe351c47c3b96844F46e9808a7D5bBa8101BfFB57";
export const WZKLTC_ADDR = "0x60A84eBC3483fEFB251B76Aea5B8458026Ef4bea";

export const ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function factory() view returns (address)",
  "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
] as const;

export const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
] as const;

export const WZKLTC_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 wad)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address guy, uint256 wad) returns (bool)",
  "function allowance(address src, address guy) view returns (uint256)",
] as const;

export type Token = { address: string; symbol: string };

export const POPULAR_TOKENS: Token[] = [
  { address: "0xFC73cdB75F37B0da829c4e54511f410D525B76b2", symbol: "Lester" },
  { address: "0x6858790e164a8761a711BAD1178220C5AebcF7eC", symbol: "PEPE" },
  { address: "0xe1b51EfB42cC9748C8ecf1129705F5d27901261a", symbol: "USDC" },
  { address: "0x7EDB84A49Eb4077352bd6f780130E4871DaFc5bC", symbol: "LITOAD" },
  { address: "0xF143eCFE3DFEEB4ae188cA4f1c7c7ab0b5F592eb", symbol: "LITVM" },
  { address: "0x61346d5CBF2e66fc5C9d900c25e58816cC3b4307", symbol: "YURI" },
  { address: "0xFF8355941ADC15418cA6Ad48c0A03016C40Bb79a", symbol: "CHAWLEE" },
  { address: "0x4af16CFB61FE9a2C6D1452d85B25e7Ca49748f16", symbol: "USDT" },
  { address: "0xdaF8BDC2b197C2f0fAb9d7359bdF482F8332b21f", symbol: "WETH" },
  { address: "0x3bCE48A3b30414176e796Af997Bb1Ed5E1dC5B22", symbol: "WBTC" },
];

// Native + ERC-20 list for the swap selector
export const SWAP_TOKENS: Token[] = [
  { address: NATIVE_SENTINEL, symbol: "zkLTC" },
  ...POPULAR_TOKENS,
];

export const DAPPS = [
  { name: "Ayni", icon: "🏦", desc: "Cross-chain stablecoin lending", url: "https://www.aynilabs.xyz/dashboard/", category: "DeFi" },
  { name: "OmniFun", icon: "🚀", desc: "Bonding curve token launchpad", url: "https://omnifun.io", category: "Launchpad" },
  { name: "LendVault", icon: "🏛", desc: "Borrow/lend against collectibles", url: "https://lendvault.io", category: "RWA" },
  { name: "MidasPredict", icon: "🔮", desc: "Permissionless prediction market", url: "https://midaspredict.com", category: "Prediction" },
  { name: "AutoIncentive", icon: "🤖", desc: "x402 USDC microtransaction infra", url: "https://autoincentive.io", category: "AI" },
  { name: "LitCash", icon: "🔒", desc: "Non-custodial privacy solution", url: "https://litcash.io", category: "Privacy" },
  { name: "Dappit", icon: "⚡", desc: "AI-powered dapp deployment", url: "https://dappit.io", category: "Dev" },
  { name: "LiteForge", icon: "🔍", desc: "Block explorer for LitVM", url: EXPLORER_URL, category: "Infra" },
  { name: "Lester Labs", icon: "🧪", desc: "Token minter, launchpad, governance", url: "https://lesterlabs.io", category: "Infra" },
  { name: "dzkLTC Swap", icon: "🎰", desc: "Swap zkLTC to dzkLTC + Spin game", url: "https://darkzone.vercel.app", category: "DeFi" },
];

export function isNativeAddr(a?: string) {
  return !a || a === NATIVE_SENTINEL || a === "0x0000000000000000000000000000000000000000";
}

export function shortAddr(a?: string) {
  if (!a) return "—";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

export function errMsg(e: unknown): string {
  const anyE = e as { shortMessage?: string; reason?: string; message?: string };
  return anyE?.shortMessage ?? anyE?.reason ?? anyE?.message ?? String(e).slice(0, 200);
}
