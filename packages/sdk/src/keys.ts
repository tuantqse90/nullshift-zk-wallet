// ============================================================
// NullShift SDK -- Key Management
// ============================================================
// HD derivation, ZK key pairs, encrypted vault management.
// Uses ethers v6 for BIP-39/BIP-44 and Web Crypto for vault.
// ============================================================

import type { WalletKeys, EncryptedVault, Hex, Bytes32 } from '@nullshift/common';
import { DERIVATION_PATHS, VAULT_VERSION } from '@nullshift/common';
import { ethers } from 'ethers';

export class KeyManager {
  private keys: WalletKeys | null = null;

  /** Generate a new wallet from a random mnemonic */
  async createWallet(password: string): Promise<WalletKeys> {
    const entropy = ethers.randomBytes(32);
    const mnemonic = ethers.Mnemonic.fromEntropy(entropy);
    return this.deriveAndStore(mnemonic.phrase, password);
  }

  /** Import wallet from existing mnemonic */
  async importWallet(mnemonic: string, password: string): Promise<WalletKeys> {
    if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    return this.deriveAndStore(mnemonic, password);
  }

  /** Unlock wallet by decrypting vault with password */
  async unlock(password: string, vault: EncryptedVault): Promise<WalletKeys> {
    const salt = hexToBuffer(vault.salt);
    const iv = hexToBuffer(vault.iv);
    const ciphertext = hexToBuffer(vault.ciphertext);

    const aesKey = await deriveAESKey(password, salt);
    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      aesKey,
      ciphertext as unknown as ArrayBuffer,
    );

    const json = new TextDecoder().decode(plaintext);
    const keys: WalletKeys = JSON.parse(json);
    this.keys = keys;
    return keys;
  }

  /** Encrypt wallet keys into a vault */
  async encryptVault(keys: WalletKeys, password: string): Promise<EncryptedVault> {
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

    const aesKey = await deriveAESKey(password, salt);
    const plaintext = new TextEncoder().encode(JSON.stringify(keys));
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      aesKey,
      plaintext as unknown as ArrayBuffer,
    );

    return {
      ciphertext: bufferToHex(new Uint8Array(ciphertext)),
      iv: bufferToHex(iv),
      salt: bufferToHex(salt),
      version: VAULT_VERSION,
    };
  }

  /** Lock wallet -- clear keys from memory */
  lock(): void {
    this.keys = null;
  }

  /** Check if wallet is unlocked */
  isUnlocked(): boolean {
    return this.keys !== null;
  }

  /** Get current keys (throws if locked) */
  getKeys(): WalletKeys {
    if (!this.keys) throw new Error('Wallet is locked');
    return this.keys;
  }

  /** Get the public spending key (viewing key) -- safe to share */
  getViewingKey(): Bytes32 {
    return this.getKeys().viewingKey;
  }

  /** Get the ETH address */
  getAddress(): Hex {
    return this.getKeys().ethAddress;
  }

  /** Derive all keys from mnemonic and store in memory */
  private async deriveAndStore(mnemonic: string, _password: string): Promise<WalletKeys> {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);

    // Derive ETH keys via BIP-44
    const ethNode = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, DERIVATION_PATHS.eth);

    // Derive ZK spending key from a separate derivation path
    const spendingNode = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, DERIVATION_PATHS.spending);
    const spendingKey = spendingNode.privateKey as Bytes32;

    // Viewing key = keccak256(spendingKey) -- one-way derivation
    const viewingKey = ethers.keccak256(spendingKey) as Bytes32;

    // Nullifier key = keccak256(spendingKey || "nullifier")
    const nullifierKey = ethers.keccak256(
      ethers.concat([spendingKey, ethers.toUtf8Bytes('nullifier')]),
    ) as Bytes32;

    const keys: WalletKeys = {
      mnemonic,
      ethPrivateKey: ethNode.privateKey as Hex,
      ethPublicKey: ethNode.publicKey as Hex,
      ethAddress: ethNode.address as Hex,
      spendingKey,
      viewingKey,
      nullifierKey,
    };

    this.keys = keys;
    return keys;
  }
}

// -- Helpers --

async function deriveAESKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(password);
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    encoded as unknown as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function bufferToHex(buf: Uint8Array): string {
  return '0x' + Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
