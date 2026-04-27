import { defineChain } from "viem";

export const RPC_URL = "https://liteforge.rpc.caldera.xyz/http";
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

// ── Router & token addresses (own deployed AMM) ──────────────────────────────
export const NATIVE_SENTINEL = "NATIVE";

// LiteSwap V2 (our own AMM)
export const LITESWAP_FACTORY = "0xb923f1481384386D447C51051907F8CadAFF5f3E";
export const LITESWAP_ROUTER  = "0xFa1f665C6ee5167f78454d85bc56D263D5da4576";

// OmniFun router (existing community AMM)
export const OMNIFUN_ROUTER   = "0xe351c47c3b96844F46e9808a7D5bBa8101BfFB57";

// Back-compat aliases (existing code paths)
export const DEFAULT_FACTORY = LITESWAP_FACTORY;
export const DEFAULT_ROUTER  = LITESWAP_ROUTER;

export const WZKLTC_ADDR     = "0x60A84eBC3483fEFB251B76Aea5B8458026Ef4bea";

export type RouterKey = "liteswap" | "omnifun";
export const ROUTERS: Record<RouterKey, { address: string; label: string; factory?: string }> = {
  liteswap: { address: LITESWAP_ROUTER, label: "LiteSwap V2", factory: LITESWAP_FACTORY },
  omnifun:  { address: OMNIFUN_ROUTER,  label: "OmniFun" },
};

// Token → preferred router routing rules
const LITESWAP_TOKENS = new Set<string>([
  "0xFC43ABE529CDC61B7F0aa2e677451AFd83d2B304".toLowerCase(), // USDC (existing)
  "0x314522DD1B3f74Dd1DdE03E5B5a628C28134b25d".toLowerCase(), // zkPEPE
  "0xaf9F497007342Dd025Ff696964A736Ec9584c3dd".toLowerCase(), // zkETH
  // New LiteSwap tokens
  "0xBAaba603e6298fbb76325a6B0d47Cd57154ca641".toLowerCase(), // LDEX
  "0xF425553A84e579BE353a6180F7d53d8101bfb3E4".toLowerCase(), // LDTOAD
  "0x60DD65bAd8a73Dfd8DF029C4e3b372d575B03BC2".toLowerCase(), // USDC (test)
  "0xa38c318a0B755154b25f28cAD7b2312747B073C6".toLowerCase(), // USDT
  "0x68Bf11e64cfD939fE1761012862FBFE47048118e".toLowerCase(), // WETH
  "0xcFe6BE457D366329CCdeE7fBC48aBf1d6FFeB9C0".toLowerCase(), // WBTC
  "0xd8C4e6dBe48472d6C563eB1cc330207d020D4c8f".toLowerCase(), // YURI
  "0x05149f41AFE7ca712D6A42390e8047E0f2887284".toLowerCase(), // CHAWLEE
]);
const OMNIFUN_TOKENS = new Set<string>([
  "0xFC73cdB75F37B0da829c4e54511f410D525B76b2".toLowerCase(), // Lester
  "0x6858790e164a8761a711BAD1178220C5AebcF7eC".toLowerCase(), // PEPE
]);

export function pickRouter(tokenInAddr?: string, tokenOutAddr?: string): RouterKey {
  const a = (tokenInAddr || "").toLowerCase();
  const b = (tokenOutAddr || "").toLowerCase();
  if (LITESWAP_TOKENS.has(a) || LITESWAP_TOKENS.has(b)) return "liteswap";
  if (OMNIFUN_TOKENS.has(a) || OMNIFUN_TOKENS.has(b)) return "omnifun";
  return "liteswap";
}

// Router uses the *ZKLTC naming* (not WETH/ETH)
export const ROUTER_ABI = [
  "function WZKLTC() view returns (address)",
  "function factory() view returns (address)",
  "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",

  // Swaps
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
  "function swapExactZKLTCForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)",
  "function swapExactTokensForZKLTC(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",

  // Liquidity
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityZKLTC(address token, uint amountTokenDesired, uint amountTokenMin, uint amountZKLTCMin, address to, uint deadline) payable returns (uint amountToken, uint amountZKLTC, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)",
  "function removeLiquidityZKLTC(address token, uint liquidity, uint amountTokenMin, uint amountZKLTCMin, address to, uint deadline) returns (uint amountToken, uint amountZKLTC)",
] as const;

export const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function allPairsLength() view returns (uint)",
] as const;

export const PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
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

export type Token = { address: string; symbol: string; image?: string };

export const POPULAR_TOKENS: Token[] = [
  // Existing tokens (kept as-is)
  { address: "0xFC43ABE529CDC61B7F0aa2e677451AFd83d2B304", symbol: "USDC", image: "/logos/usdc.jpg" },
  { address: "0x314522DD1B3f74Dd1DdE03E5B5a628C28134b25d", symbol: "zkPEPE", image: "/logos/zkpepe.jpg" },
  { address: "0xaf9F497007342Dd025Ff696964A736Ec9584c3dd", symbol: "zkETH", image: "/logos/zketh.jpg" },
  { address: "0xFC73cdB75F37B0da829c4e54511f410D525B76b2", symbol: "Lester", image: "/logos/lester.jpg" },
  { address: "0x6858790e164a8761a711BAD1178220C5AebcF7eC", symbol: "PEPE", image: "/logos/pepe.jpg" },
  // New LiteSwap tokens
  { address: "0xBAaba603e6298fbb76325a6B0d47Cd57154ca641", symbol: "LDEX", image: "/logos/litdex.png" },
  { address: "0xF425553A84e579BE353a6180F7d53d8101bfb3E4", symbol: "LDTOAD", image: "/logos/litoad.jpg" },
  { address: "0x60DD65bAd8a73Dfd8DF029C4e3b372d575B03BC2", symbol: "USDC.t", image: "/logos/usdc.jpg" },
  { address: "0xa38c318a0B755154b25f28cAD7b2312747B073C6", symbol: "USDT", image: "/logos/usdt.jpg" },
  { address: "0x68Bf11e64cfD939fE1761012862FBFE47048118e", symbol: "WETH", image: "/logos/weth.jpg" },
  { address: "0xcFe6BE457D366329CCdeE7fBC48aBf1d6FFeB9C0", symbol: "WBTC", image: "/logos/wbtc.jpg" },
  { address: "0xd8C4e6dBe48472d6C563eB1cc330207d020D4c8f", symbol: "YURI", image: "/logos/yuri.jpg" },
  { address: "0x05149f41AFE7ca712D6A42390e8047E0f2887284", symbol: "CHAWLEE", image: "/logos/chawlee.jpg" },
];

// Native + ERC-20 list for the swap selector
export const SWAP_TOKENS: Token[] = [
  { address: NATIVE_SENTINEL, symbol: "zkLTC", image: "/logos/zkltc.jpg" },
  ...POPULAR_TOKENS,
];

export const DAPPS = [
  { name: "Ayni Labs", icon: "🏦", desc: "Cross-chain stablecoin lending", url: "https://www.aynilabs.xyz/", category: "DeFi" },
  { name: "OnmiFun", icon: "🚀", desc: "Bonding curve token launchpad", url: "https://app.onmi.fun/?chain=LITVM", category: "Launchpad" },
  { name: "LendVault", icon: "🏛", desc: "Borrow/lend against collectibles", url: "https://www.lendvault.io/", category: "RWA" },
  { name: "MidasHand", icon: "🔮", desc: "Permissionless prediction market", url: "https://www.midashand.xyz/", category: "Prediction" },
  { name: "AutoIncentive", icon: "🤖", desc: "x402 USDC microtransaction infra", url: "https://autoincentive.online/", category: "AI" },
  { name: "LitCash", icon: "🔒", desc: "Non-custodial privacy solution", url: "https://litvm.cash/", category: "Privacy" },
  { name: "Dappit", icon: "⚡", desc: "AI-powered dapp deployment", url: "https://dappit.io/", category: "Dev" },
  { name: "LiteForge", icon: "🔍", desc: "Block explorer for LitVM", url: EXPLORER_URL, category: "Infra" },
  { name: "Lester Labs", icon: "🧪", desc: "Token minter, launchpad, governance", url: "https://www.lester-labs.com/", category: "Infra" },
  { name: "LiteSwap", icon: "🔁", desc: "Native AMM on LitVM", url: "https://liteswap.app/?tab=home", category: "DeFi" },
  { name: "ZNS", icon: "🆔", desc: "On-chain naming service", url: "https://zns.bio/", category: "Identity" },
  { name: "Penny4Thots", icon: "💭", desc: "Social thoughts marketplace", url: "https://penny4thots.my/", category: "Social" },
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

export const SWAP_DEADLINE_SEC = 1200; // 20 min, per spec
