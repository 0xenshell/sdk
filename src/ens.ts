import { Contract, namehash, type Signer } from "ethers";
import { NETWORK_CONFIG, type Network } from "./networks.js";

const NAME_WRAPPER_ABI = [
  "function setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) returns (bytes32)",
  "function ownerOf(uint256 id) view returns (address)",
] as const;

const RESOLVER_ABI = [
  "function setText(bytes32 node, string key, string value)",
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
 * Creates `{agentId}.{parentDomain}` via the ENS NameWrapper,
 * then sets the default avatar text record on the subdomain.
 *
 * Requires the parent name to be wrapped in the NameWrapper.
 * The subdomain is owned by the signer and uses the network's ENS resolver.
 * Throws a clear error if the subdomain already exists.
 */
export async function createSubdomain(
  agentId: string,
  network: Network,
  signer: Signer,
): Promise<void> {
  const config = NETWORK_CONFIG[network];
  const parentNode = namehash(config.ensParentDomain);
  const signerAddress = await signer.getAddress();

  const nameWrapper = new Contract(
    config.nameWrapperAddress,
    NAME_WRAPPER_ABI,
    signer,
  );

  // Check if subdomain already exists in NameWrapper
  const subdomainNode = computeEnsNode(agentId, network);
  try {
    const existingOwner = await nameWrapper.ownerOf(subdomainNode);
    if (existingOwner !== "0x0000000000000000000000000000000000000000") {
      const domain = `${agentId}.${config.ensParentDomain}`;
      throw new Error(`ENS subdomain '${domain}' already exists (owner: ${existingOwner})`);
    }
  } catch (err: any) {
    // ownerOf reverts for non-existent tokens, which means the subdomain doesn't exist - that's fine
    if (err.message?.includes("already exists")) throw err;
  }

  const maxExpiry = BigInt("18446744073709551615"); // max uint64

  try {
    const tx = await nameWrapper.setSubnodeRecord(
      parentNode,
      agentId,
      signerAddress,
      config.ensResolverAddress,
      0,      // ttl
      0,      // fuses (no restrictions)
      maxExpiry,
    );
    await tx.wait();
  } catch (err: any) {
    const domain = `${agentId}.${config.ensParentDomain}`;
    throw new Error(
      `Failed to create ENS subdomain '${domain}': ${err.reason || err.message}`,
    );
  }

  // Set default avatar on the subdomain
  if (config.ensDefaultAvatar) {
    const resolver = new Contract(
      config.ensResolverAddress,
      RESOLVER_ABI,
      signer,
    );
    const avatarTx = await resolver.setText(subdomainNode, "avatar", config.ensDefaultAvatar);
    await avatarTx.wait();
  }
}
