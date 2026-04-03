export enum Network {
  MAINNET = "mainnet",
  SEPOLIA = "sepolia",
}

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  firewallAddress: string;
}

export const NETWORK_CONFIG: Record<Network, NetworkConfig> = {
  [Network.MAINNET]: {
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    firewallAddress: "",
  },
  [Network.SEPOLIA]: {
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    firewallAddress: "",
  },
};
