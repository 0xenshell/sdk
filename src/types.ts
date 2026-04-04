import type { Signer } from "ethers";
import type { Network } from "./networks.js";

// -- Agent --

export interface Agent {
  ensNode: string;
  agentAddress: string;
  spendLimit: bigint;
  threatScore: bigint;
  strikes: bigint;
  active: boolean;
  worldIdVerified: boolean;
  registeredAt: bigint;
}

export interface RegisterAgentOptions {
  agentAddress: string;
  spendLimit: string;
  allowedTargets?: string[];
}

// -- Actions --

export enum ActionDecision {
  PENDING = 0,
  APPROVED = 1,
  ESCALATED = 2,
  BLOCKED = 3,
}

export interface ActionResult {
  actionId: bigint;
}

export interface QueuedAction {
  agentId: string;
  target: string;
  value: bigint;
  data: string;
  instructionHash: string;
  queuedAt: bigint;
  resolved: boolean;
  decision: number;
}

export interface ProtectOptions {
  instruction: string;
  tx: {
    to: string;
    value?: string;
    data?: string;
  };
}

// -- Client config --

export interface ENShellConfig {
  network: Network;
  signer: Signer;
  contractAddress?: string;
  onApproved?: (action: ActionResult) => Promise<void>;
  onEscalated?: (action: ActionResult) => Promise<void>;
  onBlocked?: (action: ActionResult) => Promise<void>;
}
