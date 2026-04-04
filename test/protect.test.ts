import { describe, it, expect } from "vitest";
import { keccak256, toUtf8Bytes } from "ethers";
import { ActionDecision } from "../src/types.js";

describe("protect helpers", () => {
  it("ActionDecision enum matches contract values", () => {
    expect(ActionDecision.PENDING).toBe(0);
    expect(ActionDecision.APPROVED).toBe(1);
    expect(ActionDecision.ESCALATED).toBe(2);
    expect(ActionDecision.BLOCKED).toBe(3);
  });

  it("instruction hash is deterministic", () => {
    const instruction = "Send 0.05 ETH to the treasury";
    const hash1 = keccak256(toUtf8Bytes(instruction));
    const hash2 = keccak256(toUtf8Bytes(instruction));
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith("0x")).toBe(true);
    expect(hash1.length).toBe(66); // 0x + 64 hex chars = bytes32
  });

  it("different instructions produce different hashes", () => {
    const hash1 = keccak256(toUtf8Bytes("Send 0.05 ETH"));
    const hash2 = keccak256(toUtf8Bytes("Send 0.10 ETH"));
    expect(hash1).not.toBe(hash2);
  });
});
