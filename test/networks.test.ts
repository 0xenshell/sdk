import { describe, it, expect } from "vitest";
import { Network, NETWORK_CONFIG } from "../src/networks.js";

describe("networks", () => {
  it("exports all expected networks", () => {
    expect(Network.MAINNET).toBe("mainnet");
    expect(Network.SEPOLIA).toBe("sepolia");
  });

  it("has config for every network", () => {
    for (const network of Object.values(Network)) {
      const config = NETWORK_CONFIG[network];
      expect(config).toBeDefined();
      expect(config.chainId).toBeTypeOf("number");
      expect(config.rpcUrl).toBeTypeOf("string");
      expect(config.rpcUrl.length).toBeGreaterThan(0);
      expect(config.ensParentDomain).toBeTypeOf("string");
      expect(config.ensParentDomain.length).toBeGreaterThan(0);
      expect(config.nameWrapperAddress).toBeTypeOf("string");
      expect(config.ensResolverAddress).toBeTypeOf("string");
    }
  });

  it("has correct chain IDs", () => {
    expect(NETWORK_CONFIG[Network.MAINNET].chainId).toBe(1);
    expect(NETWORK_CONFIG[Network.SEPOLIA].chainId).toBe(11155111);
  });

  it("has Sepolia firewall address configured", () => {
    expect(NETWORK_CONFIG[Network.SEPOLIA].firewallAddress).toBe(
      "0x01014560544c786c0409796a504F71bCfbd20D56",
    );
  });
});
