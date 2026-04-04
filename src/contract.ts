import { Contract, type Signer, type Provider } from "ethers";

/**
 * Human-readable ABI for AgentFirewall.
 * Only includes functions currently deployed on-chain.
 * Updated as new features are added to the contract.
 */
export const AGENT_FIREWALL_ABI = [
  // Agent registration
  "function registerAgentSimple(string agentId, bytes32 ensNode, address agentAddress, uint256 spendLimit) external",
  "function getAgent(string agentId) external view returns (tuple(bytes32 ensNode, address agentAddress, uint256 spendLimit, uint256 threatScore, uint256 strikes, bool active, bool worldIdVerified, uint256 registeredAt))",
  "function getAgentCount() external view returns (uint256)",

  // Agent lifecycle
  "function deactivateAgent(string agentId) external",
  "function reactivateAgent(string agentId) external",

  // Allowed targets
  "function setAllowedTarget(string agentId, address target, bool allowed) external",
  "function setAllowedTargets(string agentId, address[] targets, bool allowed) external",
  "function isTargetAllowed(string agentId, address target) external view returns (bool)",

  // Action submission (always queues, CRE resolves)
  "function submitAction(string agentId, address target, uint256 value, bytes data, bytes32 instructionHash) external returns (uint256 actionId)",
  "function getQueuedAction(uint256 actionId) external view returns (tuple(string agentId, address target, uint256 value, bytes data, bytes32 instructionHash, uint256 queuedAt, bool resolved, uint8 decision))",

  // CRE oracle resolution
  "function resolveAction(uint256 actionId, uint8 decision) external",

  // Ledger approval (for escalated actions only)
  "function approveAction(uint256 actionId) external",
  "function rejectAction(uint256 actionId) external",

  // Threat scores
  "function updateThreatScore(string agentId, uint256 rawScore) external",

  // Trust mesh
  "function checkTrust(string checkerAgentId, string targetAgentId) external returns (bool)",
  "function isTrusted(string agentId) external view returns (bool)",

  // Admin
  "function setMaxStrikes(uint256 _max) external",
  "function setBlockThreshold(uint256 _threshold) external",
  "function setEscalateThreshold(uint256 _threshold) external",
  "function setCreOracle(address _creOracle) external",
  "function setENSResolver(address _ensResolver) external",

  // Events
  "event AgentRegistered(string indexed agentId, bytes32 ensNode, address agentAddress, uint256 spendLimit, bool worldIdVerified)",
  "event AgentDeactivated(string indexed agentId, string reason)",
  "event AllowedTargetUpdated(string indexed agentId, address target, bool allowed)",
  "event ActionSubmitted(uint256 indexed actionId, string indexed agentId, address target, uint256 value, bytes32 instructionHash)",
  "event ActionApproved(uint256 indexed actionId, string indexed agentId)",
  "event ActionBlocked(uint256 indexed actionId, string indexed agentId, string reason)",
  "event ActionEscalated(uint256 indexed actionId, string indexed agentId, uint256 threatScore)",
  "event ThreatScoreUpdated(string indexed agentId, uint256 previousScore, uint256 newScore, uint256 rawDetectionScore, uint256 strikes)",
  "event TrustChecked(string indexed checkerAgentId, string indexed targetAgentId, uint256 threatScore, uint256 strikes, bool trusted)",
] as const;

export function getFirewallContract(
  address: string,
  signerOrProvider: Signer | Provider,
): Contract {
  return new Contract(address, AGENT_FIREWALL_ABI, signerOrProvider);
}
