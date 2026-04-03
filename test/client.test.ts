import { describe, it, expect } from "vitest";
import { Wallet, JsonRpcProvider } from "ethers";
import { ENShell } from "../src/client.js";
import { Network } from "../src/networks.js";

describe("ENShell client", () => {
  it("throws when no contract address is configured", () => {
    const provider = new JsonRpcProvider("http://localhost:8545");
    const signer = new Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider,
    );

    expect(
      () =>
        new ENShell({
          network: Network.SEPOLIA,
          signer,
        }),
    ).toThrow("No contract address configured");
  });

  it("creates client with explicit contract address", () => {
    const provider = new JsonRpcProvider("http://localhost:8545");
    const signer = new Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider,
    );

    const client = new ENShell({
      network: Network.SEPOLIA,
      signer,
      contractAddress: "0x1111111111111111111111111111111111111111",
    });

    expect(client).toBeDefined();
  });
});
