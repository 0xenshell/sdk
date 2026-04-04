export enum Network {
  MAINNET = "mainnet",
  SEPOLIA = "sepolia",
}

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  firewallAddress: string;
  relayUrl: string;
  oraclePublicKey: string;
  ensParentDomain: string;
  nameWrapperAddress: string;
  ensResolverAddress: string;
  ensDefaultAvatar: string;
}

export const NETWORK_CONFIG: Record<Network, NetworkConfig> = {
  [Network.MAINNET]: {
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    firewallAddress: "",
    relayUrl: "",
    oraclePublicKey: "",
    ensParentDomain: "enshell.eth",
    nameWrapperAddress: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
    ensResolverAddress: "0xF29100983E058B709F3D539b0c765937B804AC15",
    ensDefaultAvatar: "https://euc.li/enshell.eth",
  },
  [Network.SEPOLIA]: {
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    firewallAddress: "0x01014560544c786c0409796a504F71bCfbd20D56",
    relayUrl: "https://relay.enshell.xyz",
    oraclePublicKey: "02cea1f34f52c8e8a2d7d5bf4a768677e600be906fb5c68985fe635ac1331409ca",
    ensParentDomain: "enshell.eth",
    nameWrapperAddress: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
    ensResolverAddress: "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5",
    ensDefaultAvatar: "https://euc.li/sepolia/enshell.eth",
  },
};
