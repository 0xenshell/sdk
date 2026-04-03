import { Contract, namehash, keccak256, toUtf8Bytes, type Signer } from "ethers";
import { NETWORK_CONFIG, type Network } from "./networks.js";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

const ENS_REGISTRY_ABI = [
  "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl)",
  "function owner(bytes32 node) view returns (address)",
] as const;

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

/**
 * Create an ENS subdomain for an agent under the parent domain.
 * Creates `{agentId}.{parentDomain}` via the ENS Registry.
 *
 * The subdomain is owned by the signer and uses the network's ENS resolver.
 * Throws a clear error if the subdomain creation fails.
 */
export async function createSubdomain(
  agentId: string,
  network: Network,
  signer: Signer,
): Promise<void> {
  const config = NETWORK_CONFIG[network];
  const parentNode = namehash(config.ensParentDomain);
  const labelHash = keccak256(toUtf8Bytes(agentId));
  const signerAddress = await signer.getAddress();

  const registry = new Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, signer);

  // Check if subdomain already has an owner
  const subdomainNode = computeEnsNode(agentId, network);
  const existingOwner = await registry.owner(subdomainNode);
  if (existingOwner !== "0x0000000000000000000000000000000000000000") {
    const domain = `${agentId}.${config.ensParentDomain}`;
    throw new Error(`ENS subdomain '${domain}' already exists (owner: ${existingOwner})`);
  }

  try {
    const tx = await registry.setSubnodeRecord(
      parentNode,
      labelHash,
      signerAddress,
      config.ensResolverAddress,
      0, // ttl
    );
    await tx.wait();
  } catch (err: any) {
    const domain = `${agentId}.${config.ensParentDomain}`;
    throw new Error(
      `Failed to create ENS subdomain '${domain}': ${err.reason || err.message}`,
    );
  }
}
