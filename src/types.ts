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
  ensNode: string;
  allowedTargets?: string[];
}

// -- Actions --

export enum ActionStatus {
  APPROVED = 0,
  ESCALATED = 1,
  BLOCKED = 2,
}

export interface ActionResult {
  actionId: bigint;
  status: ActionStatus;
}

export interface QueuedAction {
  agentId: string;
  target: string;
  value: bigint;
  data: string;
  instruction: string;
  threatScore: bigint;
  queuedAt: bigint;
  resolved: boolean;
}

export interface ProtectOptions {
  tx: {
    to: string;
    value?: string;
    data?: string;
  };
  prompt: string;
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
