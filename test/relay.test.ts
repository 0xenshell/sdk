import { describe, it, expect, vi, beforeEach } from "vitest";
import { RelayClient } from "../src/relay.js";

describe("RelayClient", () => {
  const relayUrl = "https://relay.example.com";
  let client: RelayClient;

  beforeEach(() => {
    client = new RelayClient(relayUrl);
    vi.restoreAllMocks();
  });

  const validHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  describe("put", () => {
    it("sends PUT request with correct payload", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ hash: validHash, stored: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await client.put(validHash, "0xencrypted");

      expect(fetchSpy).toHaveBeenCalledWith(
        `${relayUrl}/relay/${validHash}`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ encryptedPayload: "0xencrypted" }),
        }),
      );
    });

    it("treats 409 as idempotent (no error)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "Already exists" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await expect(client.put(validHash, "0xencrypted")).resolves.toBeUndefined();
    });

    it("throws on server error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await expect(client.put(validHash, "0xencrypted")).rejects.toThrow("Relay PUT failed");
    });
  });

  describe("get", () => {
    it("retrieves encrypted payload", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ hash: validHash, encryptedPayload: "0xdata" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await client.get(validHash);
      expect(result).toBe("0xdata");
    });

    it("returns null for 404", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await client.get(validHash);
      expect(result).toBeNull();
    });
  });

  describe("health", () => {
    it("returns status and entry count", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ status: "ok", entries: 5 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await client.health();
      expect(result.status).toBe("ok");
      expect(result.entries).toBe(5);
    });
  });
});
