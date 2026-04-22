import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { litvmChain, RPC_URL } from "./litvm";

export const wagmiConfig = getDefaultConfig({
  appName: "LitVM Explorer",
  projectId: "litvm-explorer-public",
  chains: [litvmChain, sepolia],
  transports: {
    [litvmChain.id]: http(RPC_URL),
    [sepolia.id]: http(),
  },
  ssr: false,
});
