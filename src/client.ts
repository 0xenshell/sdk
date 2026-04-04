import { Contract, JsonRpcProvider, parseEther, keccak256, toUtf8Bytes } from "ethers";
import { getFirewallContract } from "./contract.js";
import { NETWORK_CONFIG } from "./networks.js";
import { computeEnsNode, createSubdomain } from "./ens.js";
import { encryptForOracle } from "./crypto.js";
import { RelayClient } from "./relay.js";
import { ActionDecision } from "./types.js";
import type {
  ENShellConfig,
  Agent,
  RegisterAgentOptions,
  ActionResult,
  QueuedAction,
  ProtectOptions,
  ProtectResult,
  ResolutionResult,
  AnalysisResult,
} from "./types.js";

export class ENShell {
  private contract: Contract;
  private readContract: Contract;
  private config: ENShellConfig;

  constructor(config: ENShellConfig) {
    this.config = config;

    const networkConfig = NETWORK_CONFIG[config.network];
    const address = config.contractAddress ?? networkConfig.firewallAddress;

    if (!address) {
      throw new Error(
        `No contract address configured for network ${config.network}`,
      );
    }

    this.contract = getFirewallContract(address, config.signer);

    // Separate read-only provider for view calls (avoids WalletConnect eth_call issues)
    const rpcUrl = config.rpcUrl ?? networkConfig.rpcUrl;
    const readProvider = new JsonRpcProvider(rpcUrl);
    this.readContract = getFirewallContract(address, readProvider);
  }

  // -- Agent Management --

  /**
   * Register an agent. The contract creates the ENS subdomain automatically.
   */
  async registerAgent(
    agentId: string,
    options: RegisterAgentOptions,
  ): Promise<{ txHash: string }> {
    let txHash: string;
    try {
      const tx = await this.contract.registerAgentSimple(
        agentId,
        options.agentAddress,
        parseEther(options.spendLimit),
      );
      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch (err: any) {
      if (err.message?.includes("Agent already registered")) {
        throw new Error(`Agent "${agentId}" is already registered`);
      }
      throw err;
    }

    if (options.allowedTargets && options.allowedTargets.length > 0) {
      const targetTx = await this.contract.setAllowedTargets(
        agentId,
        options.allowedTargets,
        true,
      );
      await targetTx.wait();
    }

    // Post agent info to relay for dashboard display
    const networkConfig = NETWORK_CONFIG[this.config.network];
    if (networkConfig.relayUrl) {
      try {
        const relay = new RelayClient(networkConfig.relayUrl);
        await relay.registerAgent(agentId, {
          ensName: `${agentId}.${networkConfig.ensParentDomain}`,
          address: options.agentAddress,
          spendLimit: options.spendLimit,
          active: true,
        });
      } catch {
        // Relay is optional - don't fail registration if relay is down
      }
    }

    return { txHash };
  }

  async getAgent(agentId: string): Promise<Agent> {
    const raw = await this.readContract.getAgent(agentId);
    return {
      ensNode: raw.ensNode,
      agentAddress: raw.agentAddress,
      owner: raw.owner,
      spendLimit: raw.spendLimit,
      threatScore: raw.threatScore,
      strikes: raw.strikes,
      active: raw.active,
      worldIdVerified: raw.worldIdVerified,
      registeredAt: raw.registeredAt,
    };
  }

  async getAgentCount(): Promise<bigint> {
    return this.readContract.getAgentCount();
  }

  async deactivateAgent(agentId: string): Promise<{ txHash: string }> {
    const agent = await this.getAgent(agentId);
    if (!agent.active) {
      throw new Error(`Agent "${agentId}" is already deactivated`);
    }

    const tx = await this.contract.deactivateAgent(agentId);
    const receipt = await tx.wait();

    const networkConfig = NETWORK_CONFIG[this.config.network];
    if (networkConfig.relayUrl) {
      try {
        const relay = new RelayClient(networkConfig.relayUrl);
        await relay.updateAgent(agentId, { active: false });
      } catch { /* relay is optional */ }
    }

    return { txHash: receipt.hash };
  }

  async reactivateAgent(agentId: string): Promise<{ txHash: string }> {
    const agent = await this.getAgent(agentId);
    if (agent.active) {
      throw new Error(`Agent "${agentId}" is already active`);
    }

    const tx = await this.contract.reactivateAgent(agentId);
    const receipt = await tx.wait();

    const networkConfig = NETWORK_CONFIG[this.config.network];
    if (networkConfig.relayUrl) {
      try {
        const relay = new RelayClient(networkConfig.relayUrl);
        await relay.updateAgent(agentId, { active: true });
      } catch { /* relay is optional */ }
    }

    return { txHash: receipt.hash };
  }

  // -- Target Permissions --

  async setAllowedTarget(
    agentId: string,
    target: string,
    allowed: boolean,
  ): Promise<{ txHash: string }> {
    const tx = await this.contract.setAllowedTarget(agentId, target, allowed);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async isTargetAllowed(agentId: string, target: string): Promise<boolean> {
    return this.readContract.isTargetAllowed(agentId, target);
  }

  // -- Action Submission --

  async submitAction(
    agentId: string,
    target: string,
    value: string,
    data: string,
    instructionHash: string,
  ): Promise<ActionResult> {
    const tx = await this.contract.submitAction(
      agentId,
      target,
      parseEther(value),
      data,
      instructionHash,
    );
    const receipt = await tx.wait();

    const iface = this.contract.interface;

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "ActionSubmitted") {
          return { actionId: parsed.args[0], txHash: receipt.hash };
        }
      } catch {
        // Skip logs from other contracts
      }
    }

    throw new Error("Could not determine action ID from transaction logs");
  }

  // -- Ledger Approval (for escalated actions) --

  async approveAction(actionId: bigint): Promise<{ txHash: string }> {
    const tx = await this.contract.approveAction(actionId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async rejectAction(actionId: bigint): Promise<{ txHash: string }> {
    const tx = await this.contract.rejectAction(actionId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async getQueuedAction(actionId: bigint): Promise<QueuedAction> {
    const raw = await this.readContract.getQueuedAction(actionId);
    return {
      agentId: raw.agentId,
      target: raw.target,
      value: raw.value,
      data: raw.data,
      instructionHash: raw.instructionHash,
      queuedAt: raw.queuedAt,
      resolved: raw.resolved,
      decision: Number(raw.decision),
    };
  }

  // -- Trust Mesh --

  async isTrusted(agentId: string): Promise<boolean> {
    return this.readContract.isTrusted(agentId);
  }

  // -- Protect (core firewall method) --

  /**
   * Submit an action through the ENShell firewall.
   *
   * 1. Hashes the instruction
   * 2. Encrypts the instruction with the CRE oracle's public key
   * 3. Ships the encrypted payload to the relay
   * 4. Submits the action to the contract (queued for CRE analysis)
   * 5. Returns a ProtectResult with a waitForResolution() helper
   */
  async protect(
    agentId: string,
    options: ProtectOptions,
  ): Promise<ProtectResult> {
    const { instruction, tx } = options;
    const target = tx.to;
    const value = tx.value ?? "0";
    const data = tx.data ?? "0x";

    // 1. Hash the instruction
    const instructionHash = keccak256(toUtf8Bytes(instruction));

    // 2. Encrypt and ship to relay
    const networkConfig = NETWORK_CONFIG[this.config.network];
    if (networkConfig.oraclePublicKey && networkConfig.relayUrl) {
      const encrypted = encryptForOracle(instruction, networkConfig.oraclePublicKey);
      const relay = new RelayClient(networkConfig.relayUrl);
      await relay.put(instructionHash, encrypted);
    }

    // 3. Submit to contract
    const result = await this.submitAction(agentId, target, value, data, instructionHash);

    // 4. Return result with resolution helper
    return {
      actionId: result.actionId,
      txHash: result.txHash,
      instructionHash,
      tx: { to: target, value, data },
      waitForResolution: () => this.waitForResolution(result.actionId),
    };
  }

  /**
   * Poll the contract until a queued action is resolved by the CRE oracle.
   * Returns the decision + analysis data for escalated/blocked actions.
   * For ESCALATED actions, returns immediately (caller handles approval).
   */
  async waitForResolution(
    actionId: bigint,
    pollIntervalMs = 5000,
    timeoutMs = 300_000,
  ): Promise<ResolutionResult> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const action = await this.getQueuedAction(actionId);

      if (action.decision !== ActionDecision.PENDING) {
        const decision = action.decision as ActionDecision;
        let analysis: AnalysisResult | undefined;

        // Fetch analysis from relay for escalated or blocked actions
        if (decision === ActionDecision.ESCALATED || decision === ActionDecision.BLOCKED) {
          analysis = await this.fetchAnalysis(actionId);
        }

        // For ESCALATED: return immediately — caller handles approval prompt
        // For APPROVED/BLOCKED: action is already resolved
        return { decision, analysis };
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(`Action #${actionId} resolution timed out after ${timeoutMs / 1000}s`);
  }

  /** Fetch CRE analysis from the relay for a given action. */
  private async fetchAnalysis(actionId: bigint): Promise<AnalysisResult | undefined> {
    const networkConfig = NETWORK_CONFIG[this.config.network];
    if (!networkConfig.relayUrl) return undefined;

    try {
      const relay = new RelayClient(networkConfig.relayUrl);
      const res = await fetch(`${networkConfig.relayUrl}/analysis/${actionId}`);
      if (!res.ok) return undefined;
      return await res.json() as AnalysisResult;
    } catch {
      return undefined;
    }
  }
}
