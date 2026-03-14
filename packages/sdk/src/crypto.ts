// ============================================================
// NullShift SDK -- Cryptographic Primitives
// ============================================================
// Wraps Barretenberg WASM for Pedersen and Poseidon hashing.
// These MUST match the hash functions used in Noir circuits.
// ============================================================

import type { Bytes32 } from '@nullshift/common';
import { MERKLE_TREE_DEPTH } from '@nullshift/common';

/** Barretenberg instance (lazy-loaded) */
let bb: BarretenbergLike | null = null;

/** Minimal interface for Barretenberg operations we need */
interface BarretenbergLike {
  pedersenHash(inputs: Uint8Array[]): Promise<Uint8Array>;
  poseidonHash(inputs: Uint8Array[]): Promise<Uint8Array>;
  destroy(): Promise<void>;
}

/** Convert a hex string to a 32-byte Uint8Array (big-endian, zero-padded) */
export function hexToBytes(hex: Bytes32): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const padded = clean.padStart(64, '0');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Convert a 32-byte Uint8Array to a 0x-prefixed hex string */
export function bytesToHex(bytes: Uint8Array): Bytes32 {
  let hex = '0x';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex as Bytes32;
}

/** Convert a bigint to a Field element (32-byte hex) */
export function bigintToField(n: bigint): Bytes32 {
  return ('0x' + n.toString(16).padStart(64, '0')) as Bytes32;
}

/** Generate a random field element (guaranteed < BN254 modulus) */
export function randomFieldElement(): Bytes32 {
  // Use 31 bytes of randomness to guarantee value < modulus
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(31));
  let hex = '0x00';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex as Bytes32;
}

/** Convert a Field element (hex) to bigint */
export function fieldToBigint(field: Bytes32): bigint {
  return BigInt(field);
}

/** Initialize the Barretenberg backend */
export async function initBarretenberg(): Promise<void> {
  if (bb) return;
  try {
    // Dynamic import to avoid bundling issues
    const bbModule = await import('@aztec/bb.js' as string);
    const { Barretenberg, Fr } = bbModule;
    const barretenberg = await Barretenberg.new();

    // Wrap Barretenberg's Fr-based API into our Uint8Array-based interface
    bb = {
      async pedersenHash(inputs: Uint8Array[]): Promise<Uint8Array> {
        const frInputs = inputs.map((b: Uint8Array) => new Fr(Buffer.from(b)));
        const result = await barretenberg.pedersenHash(frInputs, 0);
        return new Uint8Array(result.toBuffer());
      },
      async poseidonHash(inputs: Uint8Array[]): Promise<Uint8Array> {
        const frInputs = inputs.map((b: Uint8Array) => new Fr(Buffer.from(b)));
        const result = await barretenberg.poseidon2Hash(frInputs);
        return new Uint8Array(result.toBuffer());
      },
      async destroy(): Promise<void> {
        await barretenberg.destroy();
      },
    };
  } catch {
    // Fallback: use a JS implementation for environments without WASM
    bb = createFallbackHasher();
  }
}

/** Get the Barretenberg instance (throws if not initialized) */
function getBB(): BarretenbergLike {
  if (!bb) throw new Error('Barretenberg not initialized. Call initBarretenberg() first.');
  return bb;
}

/**
 * Pedersen hash -- matches Noir's std::hash::pedersen_hash
 * Used for: note commitments, Merkle tree nodes
 */
export async function pedersenHash(inputs: Bytes32[]): Promise<Bytes32> {
  const bArr = inputs.map(hexToBytes);
  const result = await getBB().pedersenHash(bArr);
  return bytesToHex(result);
}

/**
 * Poseidon hash (2 inputs) -- matches Noir's poseidon::bn254::hash_2
 * Used for: nullifier derivation
 */
export async function poseidonHash2(a: Bytes32, b: Bytes32): Promise<Bytes32> {
  const result = await getBB().poseidonHash([hexToBytes(a), hexToBytes(b)]);
  return bytesToHex(result);
}

/**
 * Compute note commitment: Pedersen(ownerPubkey, amount, salt)
 */
export async function computeCommitment(
  ownerPubkey: Bytes32,
  amount: bigint,
  salt: Bytes32,
): Promise<Bytes32> {
  return pedersenHash([ownerPubkey, bigintToField(amount), salt]);
}

/**
 * Compute nullifier: Poseidon(commitment, secretKey)
 */
export async function computeNullifier(
  commitment: Bytes32,
  secretKey: Bytes32,
): Promise<Bytes32> {
  return poseidonHash2(commitment, secretKey);
}

/**
 * Derive public key from secret key: Pedersen(secretKey)
 */
export async function derivePublicKey(secretKey: Bytes32): Promise<Bytes32> {
  return pedersenHash([secretKey]);
}

/** Pre-computed zero hashes for Merkle tree (computed lazily) */
let zeroHashes: Bytes32[] | null = null;

/** Compute zero hashes for each tree level (Poseidon, matching circuits + contracts) */
export async function getZeroHashes(): Promise<Bytes32[]> {
  if (zeroHashes) return zeroHashes;

  const zeros: Bytes32[] = [];
  zeros[0] = bigintToField(0n);

  for (let i = 1; i <= MERKLE_TREE_DEPTH; i++) {
    zeros[i] = await poseidonHash2(zeros[i - 1]!, zeros[i - 1]!);
  }

  zeroHashes = zeros;
  return zeros;
}

/** Destroy the Barretenberg instance (cleanup) */
export async function destroyBarretenberg(): Promise<void> {
  if (bb) {
    await bb.destroy();
    bb = null;
  }
}

/**
 * Fallback hasher using keccak256 for environments without WASM.
 * WARNING: Proofs generated with this will NOT verify on-chain.
 * Only use for testing/development.
 */
function createFallbackHasher(): BarretenbergLike {
  const { keccak256, AbiCoder } = require('ethers') as typeof import('ethers');
  const coder = new AbiCoder();

  return {
    async pedersenHash(inputs: Uint8Array[]): Promise<Uint8Array> {
      const encoded = coder.encode(
        inputs.map(() => 'bytes32'),
        inputs.map((b) => b),
      );
      const hash = keccak256(encoded);
      const result = new Uint8Array(32);
      const clean = hash.slice(2);
      for (let i = 0; i < 32; i++) {
        result[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
      }
      return result;
    },
    async poseidonHash(inputs: Uint8Array[]): Promise<Uint8Array> {
      // Use same keccak fallback
      return this.pedersenHash(inputs);
    },
    async destroy(): Promise<void> {},
  };
}
