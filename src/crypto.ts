import { encrypt, decrypt, PrivateKey } from "eciesjs";

/**
 * Encrypt a plaintext string with a secp256k1 public key using ECIES.
 * Used to encrypt instruction payloads for the CRE oracle.
 *
 * @param plaintext - The instruction text to encrypt
 * @param publicKeyHex - The recipient's secp256k1 public key (hex, compressed or uncompressed)
 * @returns Hex-encoded encrypted payload
 */
export function encryptForOracle(plaintext: string, publicKeyHex: string): string {
  const data = Buffer.from(plaintext, "utf-8");
  const encrypted = encrypt(publicKeyHex, data);
  return "0x" + Buffer.from(encrypted).toString("hex");
}

/**
 * Decrypt an ECIES-encrypted payload with a secp256k1 private key.
 * Used by the CRE oracle to decrypt instruction payloads inside the TEE.
 *
 * @param encryptedHex - Hex-encoded encrypted payload (with 0x prefix)
 * @param privateKeyHex - The recipient's secp256k1 private key (hex)
 * @returns Decrypted plaintext string
 */
export function decryptAsOracle(encryptedHex: string, privateKeyHex: string): string {
  const data = Buffer.from(encryptedHex.replace("0x", ""), "hex");
  const sk = new PrivateKey(Buffer.from(privateKeyHex.replace("0x", ""), "hex"));
  const decrypted = decrypt(sk.secret, data);
  return Buffer.from(decrypted).toString("utf-8");
}

/**
 * Derive the compressed public key from a private key.
 * Useful for getting the oracle's public key from its private key.
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const sk = new PrivateKey(Buffer.from(privateKeyHex.replace("0x", ""), "hex"));
  return sk.publicKey.toHex();
}
