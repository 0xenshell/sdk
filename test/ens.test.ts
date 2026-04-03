import { describe, it, expect } from "vitest";
import { namehash } from "ethers";
import { computeEnsNode } from "../src/ens.js";
import { Network } from "../src/networks.js";

describe("computeEnsNode", () => {
  it("computes correct namehash for agent subdomain", () => {
    const node = computeEnsNode("trader", Network.SEPOLIA);
    expect(node).toBe(namehash("trader.enshell.eth"));
  });

  it("produces different hashes for different agent IDs", () => {
    const a = computeEnsNode("trader", Network.SEPOLIA);
    const b = computeEnsNode("scanner", Network.SEPOLIA);
    expect(a).not.toBe(b);
  });

  it("is deterministic", () => {
    const a = computeEnsNode("trader", Network.SEPOLIA);
    const b = computeEnsNode("trader", Network.SEPOLIA);
    expect(a).toBe(b);
  });
});
