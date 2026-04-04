/**
 * Client for the ENShell Relay service.
 * Stores and retrieves encrypted instruction payloads.
 */

export class RelayClient {
  private baseUrl: string;

  constructor(relayUrl: string) {
    this.baseUrl = relayUrl.replace(/\/$/, "");
  }

  /**
   * Store an encrypted payload on the relay.
   * @param instructionHash - bytes32 hex string (0x + 64 chars)
   * @param encryptedPayload - hex-encoded encrypted data
   */
  async put(instructionHash: string, encryptedPayload: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/relay/${instructionHash}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encryptedPayload }),
    });

    if (res.status === 409) {
      // Already exists - idempotent, not an error
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Relay PUT failed (${res.status}): ${(body as any).error || "Unknown error"}`);
    }
  }

  /**
   * Retrieve an encrypted payload from the relay.
   * @param instructionHash - bytes32 hex string
   * @returns The encrypted payload, or null if not found/expired
   */
  async get(instructionHash: string): Promise<string | null> {
    const res = await fetch(`${this.baseUrl}/relay/${instructionHash}`);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Relay GET failed (${res.status})`);
    }

    const body = await res.json() as { encryptedPayload: string };
    return body.encryptedPayload;
  }

  /**
   * Register an agent on the relay for dashboard display.
   */
  async registerAgent(agentId: string, data: {
    ensName: string;
    address: string;
    spendLimit: string;
    active: boolean;
  }): Promise<void> {
    const res = await fetch(`${this.baseUrl}/agents/${agentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok && res.status !== 409) {
      // Ignore errors - relay is optional for agent registration
    }
  }

  /**
   * Health check on the relay service.
   */
  async health(): Promise<{ status: string; entries: number }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) {
      throw new Error(`Relay health check failed (${res.status})`);
    }
    return res.json() as Promise<{ status: string; entries: number }>;
  }
}
