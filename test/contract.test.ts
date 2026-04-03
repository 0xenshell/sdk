import { describe, it, expect } from "vitest";
import { JsonRpcProvider, Interface } from "ethers";
import { AGENT_FIREWALL_ABI, getFirewallContract } from "../src/contract.js";

describe("contract", () => {
  const dummyAddress = "0x1111111111111111111111111111111111111111";

  it("ABI parses without errors", () => {
    const iface = new Interface(AGENT_FIREWALL_ABI);
    expect(iface).toBeDefined();
  });

  it("ABI includes all expected functions", () => {
    const iface = new Interface(AGENT_FIREWALL_ABI);
    const functionNames = Object.keys(iface.fragments.reduce((acc, f) => {
      if (f.type === "function") {
        acc[(f as any).name] = true;
      }
      return acc;
    }, {} as Record<string, boolean>));

    expect(functionNames).toContain("registerAgentSimple");
    expect(functionNames).toContain("getAgent");
    expect(functionNames).toContain("getAgentCount");
    expect(functionNames).toContain("submitAction");
    expect(functionNames).toContain("approveAction");
    expect(functionNames).toContain("rejectAction");
    expect(functionNames).toContain("updateThreatScore");
  });

  it("ABI includes all expected events", () => {
    const iface = new Interface(AGENT_FIREWALL_ABI);
    const eventNames = Object.keys(iface.fragments.reduce((acc, f) => {
      if (f.type === "event") {
        acc[(f as any).name] = true;
      }
      return acc;
    }, {} as Record<string, boolean>));

    expect(eventNames).toContain("AgentRegistered");
    expect(eventNames).toContain("ActionApproved");
    expect(eventNames).toContain("ActionBlocked");
    expect(eventNames).toContain("ActionEscalated");
    expect(eventNames).toContain("ThreatScoreUpdated");
  });

  it("getFirewallContract returns a contract instance", () => {
    const provider = new JsonRpcProvider("http://localhost:8545");
    const contract = getFirewallContract(dummyAddress, provider);
    expect(contract).toBeDefined();
    expect(contract.target).toBe(dummyAddress);
  });
});
