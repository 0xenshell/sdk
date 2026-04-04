import { describe, it, expect } from "vitest";
import { ActionDecision } from "../src/types.js";

describe("types", () => {
  it("ActionDecision has correct enum values", () => {
    expect(ActionDecision.PENDING).toBe(0);
    expect(ActionDecision.APPROVED).toBe(1);
    expect(ActionDecision.ESCALATED).toBe(2);
    expect(ActionDecision.BLOCKED).toBe(3);
  });
});
