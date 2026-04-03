import { namehash } from "ethers";
import { NETWORK_CONFIG, type Network } from "./networks.js";

/**
 * Compute the ENS node (namehash) for an agent ID.
 * Produces the namehash of `{agentId}.{parentDomain}`.
 *
 * Example: computeEnsNode("trader", Network.SEPOLIA) => namehash("trader.enshell.eth")
 */
export function computeEnsNode(agentId: string, network: Network): string {
  const parentDomain = NETWORK_CONFIG[network].ensParentDomain;
  return namehash(`${agentId}.${parentDomain}`);
}
