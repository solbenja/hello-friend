// TokenFactory contract on Sepolia (Chain ID: 11155111)
export const TOKEN_FACTORY_ADDRESS = "0x60dd65bad8a73dfd8df029c4e3b372d575b03bc2";
export const TOKEN_FACTORY_CHAIN_ID = 11155111; // Sepolia
export const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

export const TOKEN_FACTORY_ABI = [
  "function deployFee() view returns (uint256)",
  "function deployToken(string name_, string symbol_, uint8 decimals_, uint256 totalSupply_, bool mintable_, bool burnable_, bool pausable_) payable returns (address)",
  "function getAllTokens() view returns (address[])",
  "function getTokensByCreator(address creator_) view returns (address[])",
  "function getTokenInfo(address tokenAddr_) view returns (tuple(address contractAddress, address creator, string name, string symbol, uint256 totalSupply, uint8 decimals, bool mintable, bool burnable, bool pausable, uint256 deployedAt))",
  "function getTotalDeployed() view returns (uint256)",
  "event TokenDeployed(address indexed contractAddress, address indexed creator, string name, string symbol, uint256 totalSupply, uint8 decimals, bool mintable, bool burnable, bool pausable)",
] as const;

export const CUSTOM_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
  "function isMintable() view returns (bool)",
  "function isBurnable() view returns (bool)",
  "function isPausable() view returns (bool)",
  "function paused() view returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function pause()",
  "function unpause()",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const;

export type TokenInfo = {
  contractAddress: string;
  creator: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  decimals: number;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  deployedAt: bigint;
};
