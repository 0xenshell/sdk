import { describe, it, expect } from "vitest";
import { ActionStatus } from "../src/types.js";

describe("types", () => {
  it("ActionStatus has correct enum values", () => {
    expect(ActionStatus.APPROVED).toBe(0);
    expect(ActionStatus.ESCALATED).toBe(1);
    expect(ActionStatus.BLOCKED).toBe(2);
  });
});
