import { describe, it, expect } from 'vitest';
import { KeyManager } from '../src/keys';

describe('KeyManager', () => {
  it('creates a new wallet with valid keys', async () => {
    const km = new KeyManager();
    const keys = await km.createWallet('testpassword123');

    expect(keys.mnemonic).toBeDefined();
    expect(keys.mnemonic.split(' ').length).toBeGreaterThanOrEqual(12);
    expect(keys.ethAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(keys.ethPrivateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(keys.spendingKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(keys.viewingKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(keys.nullifierKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('encrypts and decrypts vault correctly', async () => {
    const km = new KeyManager();
    const keys = await km.createWallet('mypassword');

    const vault = await km.encryptVault(keys, 'mypassword');
    expect(vault.ciphertext).toBeDefined();
    expect(vault.iv).toBeDefined();
    expect(vault.salt).toBeDefined();
    expect(vault.version).toBe(1);

    // Decrypt with correct password
    const km2 = new KeyManager();
    const decrypted = await km2.unlock('mypassword', vault);
    expect(decrypted.ethAddress).toBe(keys.ethAddress);
    expect(decrypted.spendingKey).toBe(keys.spendingKey);
    expect(decrypted.mnemonic).toBe(keys.mnemonic);
  });

  it('fails to decrypt with wrong password', async () => {
    const km = new KeyManager();
    const keys = await km.createWallet('rightpassword');
    const vault = await km.encryptVault(keys, 'rightpassword');

    const km2 = new KeyManager();
    await expect(km2.unlock('wrongpassword', vault)).rejects.toThrow();
  });

  it('imports wallet from mnemonic', async () => {
    const km1 = new KeyManager();
    const keys1 = await km1.createWallet('pass1');

    const km2 = new KeyManager();
    const keys2 = await km2.importWallet(keys1.mnemonic, 'pass2');

    // Same mnemonic should derive same keys
    expect(keys2.ethAddress).toBe(keys1.ethAddress);
    expect(keys2.ethPrivateKey).toBe(keys1.ethPrivateKey);
    expect(keys2.spendingKey).toBe(keys1.spendingKey);
  });

  it('rejects invalid mnemonic', async () => {
    const km = new KeyManager();
    await expect(km.importWallet('invalid mnemonic words here', 'pass')).rejects.toThrow();
  });

  it('isUnlocked returns false before wallet creation', () => {
    const km = new KeyManager();
    expect(km.isUnlocked()).toBe(false);
  });

  it('getKeys returns keys after wallet creation', async () => {
    const km = new KeyManager();
    await km.createWallet('pass');
    expect(km.isUnlocked()).toBe(true);
    expect(km.getKeys().ethAddress).toMatch(/^0x/);
  });

  it('lock clears keys and getKeys throws', async () => {
    const km = new KeyManager();
    await km.createWallet('pass');
    expect(km.isUnlocked()).toBe(true);
    km.lock();
    expect(km.isUnlocked()).toBe(false);
    expect(() => km.getKeys()).toThrow('Wallet is locked');
  });
});
