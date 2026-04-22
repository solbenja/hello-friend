import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { litvmChain, RPC_URL } from "./litvm";

export const wagmiConfig = getDefaultConfig({
  appName: "LitVM Explorer",
  projectId: "litvm-explorer-public",
  chains: [litvmChain],
  transports: { [litvmChain.id]: http(RPC_URL) },
  ssr: false,
});
