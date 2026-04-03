import { Contract, parseEther } from "ethers";
import { getFirewallContract } from "./contract.js";
import { NETWORK_CONFIG } from "./networks.js";
import type {
  ENShellConfig,
  Agent,
  RegisterAgentOptions,
} from "./types.js";

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
    const tx = await this.contract.registerAgentSimple(
      agentId,
      options.ensNode,
      options.agentAddress,
      parseEther(options.spendLimit),
    );
    await tx.wait();

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
}
