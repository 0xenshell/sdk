import { describe, it, expect } from "vitest";
import { encryptForOracle, decryptAsOracle, getPublicKeyFromPrivate } from "../src/crypto.js";
import { utils, getPublicKey } from "@noble/secp256k1";

describe("crypto", () => {
  const privateKeyBytes = utils.randomSecretKey();
  const privateKeyHex = Array.from(privateKeyBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const publicKeyBytes = getPublicKey(privateKeyBytes, true);
  const publicKeyHex = Array.from(publicKeyBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

  it("encrypts and decrypts a message roundtrip", () => {
    const message = "Send 0.05 ETH to the treasury for weekly budget";
    const encrypted = encryptForOracle(message, publicKeyHex);

    expect(encrypted.startsWith("0x")).toBe(true);
    expect(encrypted.length).toBeGreaterThan(message.length);

    const decrypted = decryptAsOracle(encrypted, privateKeyHex);
    expect(decrypted).toBe(message);
  });

  it("produces different ciphertext for same plaintext", () => {
    const message = "Same message twice";
    const a = encryptForOracle(message, publicKeyHex);
    const b = encryptForOracle(message, publicKeyHex);
    expect(a).not.toBe(b);
  });

  it("derives correct public key from private key", () => {
    const derived = getPublicKeyFromPrivate(privateKeyHex);
    expect(derived).toBe(publicKeyHex);
  });

  it("fails to decrypt with wrong private key", () => {
    const message = "Secret instruction";
    const encrypted = encryptForOracle(message, publicKeyHex);

    const wrongKeyBytes = utils.randomSecretKey();
    const wrongKeyHex = Array.from(wrongKeyBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

    expect(() => decryptAsOracle(encrypted, wrongKeyHex)).toThrow();
  });
});
