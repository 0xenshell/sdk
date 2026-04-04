import { getPublicKey, getSharedSecret, utils } from "@noble/secp256k1";
// @ts-ignore - noble v2 uses subpath exports with .js extension
import { gcm } from "@noble/ciphers/aes.js";
// @ts-ignore - noble v2 uses subpath exports with .js extension
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Custom ECIES implementation using noble-crypto primitives.
 * Works in Node.js, browsers, and CRE WASM (QuickJS).
 *
 * Encryption flow:
 *   1. Generate ephemeral secp256k1 keypair
 *   2. ECDH with recipient's public key → shared secret
 *   3. SHA-256(shared secret) → AES-256-GCM key
 *   4. Encrypt plaintext with AES-256-GCM
 *   5. Output: ephemeral public key (33 bytes) + nonce (12 bytes) + ciphertext
 */

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace("0x", "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Encrypt a plaintext string with a secp256k1 public key.
 * The oracle's public key is hardcoded in network config (safe to ship publicly).
 * Only the oracle's private key (in Vault DON) can decrypt.
 */
export function encryptForOracle(plaintext: string, publicKeyHex: string): string {
  const ephemeralPrivate = utils.randomSecretKey();
  const ephemeralPublic = getPublicKey(ephemeralPrivate, true); // compressed, 33 bytes

  const sharedSecret = getSharedSecret(ephemeralPrivate, hexToBytes(publicKeyHex));
  const aesKey = sha256(sharedSecret);

  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);

  const cipher = gcm(aesKey, nonce);
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plaintext));

  // Pack: ephemeralPublic (33) + nonce (12) + ciphertext (variable)
  const packed = new Uint8Array(33 + 12 + ciphertext.length);
  packed.set(ephemeralPublic, 0);
  packed.set(nonce, 33);
  packed.set(ciphertext, 45);

  return "0x" + bytesToHex(packed);
}

/**
 * Decrypt an ECIES-encrypted payload with a secp256k1 private key.
 * Used by the CRE oracle inside the TEE.
 */
export function decryptAsOracle(encryptedHex: string, privateKeyHex: string): string {
  const packed = hexToBytes(encryptedHex);

  const ephemeralPublic = packed.slice(0, 33);
  const nonce = packed.slice(33, 45);
  const ciphertext = packed.slice(45);

  const sharedSecret = getSharedSecret(hexToBytes(privateKeyHex), ephemeralPublic);
  const aesKey = sha256(sharedSecret);

  const decipher = gcm(aesKey, nonce);
  const decrypted = decipher.decrypt(ciphertext);

  return new TextDecoder().decode(decrypted);
}

/**
 * Derive the compressed public key from a private key.
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const pub = getPublicKey(hexToBytes(privateKeyHex), true);
  return bytesToHex(pub);
}
