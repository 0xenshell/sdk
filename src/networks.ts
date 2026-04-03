export enum Network {
  MAINNET = "mainnet",
  SEPOLIA = "sepolia",
}

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  firewallAddress: string;
  ensParentDomain: string;
}

export const NETWORK_CONFIG: Record<Network, NetworkConfig> = {
  [Network.MAINNET]: {
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    firewallAddress: "",
    ensParentDomain: "enshell.eth",
  },
  [Network.SEPOLIA]: {
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    firewallAddress: "0xf3Bd9464B04a4f44337443144F9241C379d357bb",
    ensParentDomain: "enshell.eth",
  },
};
