import { Contract, parseEther } from "ethers";
import { getFirewallContract } from "./contract.js";
import { NETWORK_CONFIG } from "./networks.js";
import { computeEnsNode, createSubdomain } from "./ens.js";
import type {
  ENShellConfig,
  Agent,
  RegisterAgentOptions,
  ActionResult,
  QueuedAction,
} from "./types.js";
import { ActionStatus } from "./types.js";

export class ENShell {
  private contract: Contract;
  private config: ENShellConfig;

  constructor(config: ENShellConfig) {
    this.config = config;

    const address =
      config.contractAddress ??
      NETWORK_CONFIG[config.network].firewallAddress;

    if (!address) {
      throw new Error(
        `No contract address configured for network ${config.network}`,
      );
    }

    this.contract = getFirewallContract(address, config.signer);
  }

  // -- Agent Management --

  async registerAgent(
    agentId: string,
    options: RegisterAgentOptions,
  ): Promise<void> {
    // 1. Create ENS subdomain (e.g. trader.enshell.eth)
    await createSubdomain(agentId, this.config.network, this.config.signer);

    // 2. Register agent on the firewall contract
    const ensNode = computeEnsNode(agentId, this.config.network);

    try {
      const tx = await this.contract.registerAgentSimple(
        agentId,
        ensNode,
        options.agentAddress,
        parseEther(options.spendLimit),
      );
      await tx.wait();
    } catch (err: any) {
      if (err.message?.includes("Agent already registered")) {
        throw new Error(`Agent "${agentId}" is already registered`);
      }
      throw err;
    }

    // 3. Set allowed targets if provided
    if (options.allowedTargets && options.allowedTargets.length > 0) {
      const targetTx = await this.contract.setAllowedTargets(
        agentId,
        options.allowedTargets,
        true,
      );
      await targetTx.wait();
    }
  }

  async getAgent(agentId: string): Promise<Agent> {
    const raw = await this.contract.getAgent(agentId);
    return {
      ensNode: raw.ensNode,
      agentAddress: raw.agentAddress,
      spendLimit: raw.spendLimit,
      threatScore: raw.threatScore,
      strikes: raw.strikes,
      active: raw.active,
      worldIdVerified: raw.worldIdVerified,
      registeredAt: raw.registeredAt,
    };
  }

  async getAgentCount(): Promise<bigint> {
    return this.contract.getAgentCount();
  }

  async deactivateAgent(agentId: string): Promise<void> {
    const tx = await this.contract.deactivateAgent(agentId);
    await tx.wait();
  }

  async reactivateAgent(agentId: string): Promise<void> {
    const tx = await this.contract.reactivateAgent(agentId);
    await tx.wait();
  }

  // -- Target Permissions --

  async setAllowedTarget(
    agentId: string,
    target: string,
    allowed: boolean,
  ): Promise<void> {
    const tx = await this.contract.setAllowedTarget(agentId, target, allowed);
    await tx.wait();
  }

  async isTargetAllowed(agentId: string, target: string): Promise<boolean> {
    return this.contract.isTargetAllowed(agentId, target);
  }

  // -- Action Submission --

  async submitAction(
    agentId: string,
    target: string,
    value: string,
    data: string,
    instruction: string,
  ): Promise<ActionResult> {
    const tx = await this.contract.submitAction(
      agentId,
      target,
      parseEther(value),
      data,
      instruction,
    );
    const receipt = await tx.wait();

    const iface = this.contract.interface;

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "ActionApproved") {
          return { actionId: parsed.args[0], status: ActionStatus.APPROVED };
        }
        if (parsed?.name === "ActionEscalated") {
          return { actionId: parsed.args[0], status: ActionStatus.ESCALATED };
        }
        if (parsed?.name === "ActionBlocked") {
          return { actionId: parsed.args[0], status: ActionStatus.BLOCKED };
        }
      } catch {
        // Skip logs from other contracts
      }
    }

    throw new Error("Could not determine action result from transaction logs");
  }

  // -- Ledger Approval --

  async approveAction(actionId: bigint): Promise<void> {
    const tx = await this.contract.approveAction(actionId);
    await tx.wait();
  }

  async rejectAction(actionId: bigint): Promise<void> {
    const tx = await this.contract.rejectAction(actionId);
    await tx.wait();
  }

  async getQueuedAction(actionId: bigint): Promise<QueuedAction> {
    const raw = await this.contract.getQueuedAction(actionId);
    return {
      agentId: raw.agentId,
      target: raw.target,
      value: raw.value,
      data: raw.data,
      instruction: raw.instruction,
      threatScore: raw.threatScore,
      queuedAt: raw.queuedAt,
      resolved: raw.resolved,
    };
  }
}
