import { describe, it, expect } from "vitest";
import { encryptForOracle, decryptAsOracle, getPublicKeyFromPrivate } from "../src/crypto.js";
import { PrivateKey } from "eciesjs";

describe("crypto", () => {
  const sk = new PrivateKey();
  const privateKeyHex = Buffer.from(sk.secret).toString("hex");
  const publicKeyHex = sk.publicKey.toHex();

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
    expect(a).not.toBe(b); // ECIES uses random ephemeral keys
  });

  it("derives correct public key from private key", () => {
    const derived = getPublicKeyFromPrivate(privateKeyHex);
    expect(derived).toBe(publicKeyHex);
  });

  it("fails to decrypt with wrong private key", () => {
    const message = "Secret instruction";
    const encrypted = encryptForOracle(message, publicKeyHex);

    const wrongSk = new PrivateKey();
    const wrongKeyHex = Buffer.from(wrongSk.secret).toString("hex");

    expect(() => decryptAsOracle(encrypted, wrongKeyHex)).toThrow();
  });
});
