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

  // Action submission
  "function submitAction(string agentId, address target, uint256 value, bytes data, string instruction) external returns (uint256 actionId, uint8 status)",
  "function getQueuedAction(uint256 actionId) external view returns (tuple(string agentId, address target, uint256 value, bytes data, string instruction, uint256 threatScore, uint256 queuedAt, bool resolved))",

  // Ledger approval
  "function approveAction(uint256 actionId) external",
  "function rejectAction(uint256 actionId) external",

  // Threat scores
  "function updateThreatScore(string agentId, uint256 rawScore) external",

  // Admin
  "function setMaxStrikes(uint256 _max) external",

  // Events
  "event AgentRegistered(string indexed agentId, bytes32 ensNode, address agentAddress, uint256 spendLimit, bool worldIdVerified)",
  "event AgentDeactivated(string indexed agentId, string reason)",
  "event AllowedTargetUpdated(string indexed agentId, address target, bool allowed)",
  "event ActionSubmitted(uint256 indexed actionId, string indexed agentId, address target, uint256 value, string instruction)",
  "event ActionApproved(uint256 indexed actionId, string indexed agentId)",
  "event ActionBlocked(uint256 indexed actionId, string indexed agentId, string reason)",
  "event ActionEscalated(uint256 indexed actionId, string indexed agentId, uint256 threatScore)",
  "event ThreatScoreUpdated(string indexed agentId, uint256 previousScore, uint256 newScore, uint256 rawDetectionScore, uint256 strikes)",
] as const;

export function getFirewallContract(
  address: string,
  signerOrProvider: Signer | Provider,
): Contract {
  return new Contract(address, AGENT_FIREWALL_ABI, signerOrProvider);
}
