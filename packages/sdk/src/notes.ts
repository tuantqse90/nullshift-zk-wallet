// ============================================================
// NullShift SDK -- Note Management
// ============================================================
// UTXO note creation, local storage, and selection algorithm.
// ============================================================

import type { OwnedNote, Note, Bytes32, Address, NoteStatus } from '@nullshift/common';
import { computeCommitment, computeNullifier, bigintToField } from './crypto';
import { ethers } from 'ethers';

export class NoteManager {
  private notes: Map<string, OwnedNote> = new Map();

  /** Create a new note commitment: Pedersen(pubkey, amount, salt) */
  async createNote(ownerPubkey: Bytes32, amount: bigint, token: Address): Promise<Note> {
    const salt = ('0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2)) as Bytes32;
    const commitment = await computeCommitment(ownerPubkey, amount, salt);

    return {
      commitment,
      amount,
      salt,
      ownerPubkey,
      leafIndex: -1,
      token,
    };
  }

  /** Encrypt note data for recipient using their viewing key (AES-GCM) */
  async encryptNote(note: Note, viewingKey: Bytes32): Promise<Uint8Array> {
    const keyData = ethers.getBytes(viewingKey);
    const aesKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyData as unknown as ArrayBuffer,
      'AES-GCM',
      false,
      ['encrypt'],
    );

    const plaintext = new TextEncoder().encode(
      JSON.stringify({
        amount: note.amount.toString(),
        salt: note.salt,
        ownerPubkey: note.ownerPubkey,
        token: note.token,
      }),
    );

    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      aesKey,
      plaintext as unknown as ArrayBuffer,
    );

    const result = new Uint8Array(12 + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), 12);
    return result;
  }

  /** Try to decrypt a note with our viewing key */
  async tryDecryptNote(
    encryptedData: Uint8Array,
    viewingKey: Bytes32,
    commitment: Bytes32,
    leafIndex: number,
  ): Promise<OwnedNote | null> {
    try {
      const keyData = ethers.getBytes(viewingKey);
      const aesKey = await globalThis.crypto.subtle.importKey(
        'raw',
        keyData as unknown as ArrayBuffer,
        'AES-GCM',
        false,
        ['decrypt'],
      );

      const iv = encryptedData.slice(0, 12);
      const ciphertext = encryptedData.slice(12);

      const plaintext = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
        aesKey,
        ciphertext as unknown as ArrayBuffer,
      );

      const data = JSON.parse(new TextDecoder().decode(plaintext));

      return {
        commitment,
        amount: BigInt(data.amount),
        salt: data.salt as Bytes32,
        ownerPubkey: data.ownerPubkey as Bytes32,
        leafIndex,
        token: data.token as Address,
        spent: false,
        nullifier: bigintToField(0n),
        merklePath: { pathIndex: leafIndex, siblings: [] },
      };
    } catch {
      return null;
    }
  }

  /** Scan new on-chain commitments for notes belonging to us */
  async scanForNotes(
    commitments: Array<{ commitment: Bytes32; leafIndex: number; encryptedData?: Uint8Array }>,
    viewingKey: Bytes32,
    secretKey: Bytes32,
  ): Promise<OwnedNote[]> {
    const found: OwnedNote[] = [];

    for (const entry of commitments) {
      if (!entry.encryptedData) continue;

      const note = await this.tryDecryptNote(
        entry.encryptedData,
        viewingKey,
        entry.commitment,
        entry.leafIndex,
      );

      if (note) {
        note.nullifier = await computeNullifier(note.commitment, secretKey);
        this.addNote(note);
        found.push(note);
      }
    }

    return found;
  }

  /** Select UTXOs for a transfer (max 2 notes due to circuit constraint) */
  selectNotes(amount: bigint, token: Address): OwnedNote[] {
    const unspent = Array.from(this.notes.values())
      .filter((n) => !n.spent && n.token === token)
      .sort((a, b) => (a.amount > b.amount ? -1 : 1));

    for (const note of unspent) {
      if (note.amount >= amount) {
        return [note];
      }
    }

    for (let i = 0; i < unspent.length; i++) {
      for (let j = i + 1; j < unspent.length; j++) {
        if (unspent[i]!.amount + unspent[j]!.amount >= amount) {
          return [unspent[i]!, unspent[j]!];
        }
      }
    }

    throw new Error('Insufficient shielded balance');
  }

  /** Get all notes with optional status filter */
  getNotes(status?: NoteStatus): OwnedNote[] {
    const all = Array.from(this.notes.values());
    if (!status) return all;
    return all.filter((n) => {
      if (status === 'unspent') return !n.spent;
      if (status === 'spent') return n.spent;
      return true;
    });
  }

  /** Get total shielded balance for a token */
  getBalance(token: Address): bigint {
    return this.getNotes('unspent')
      .filter((n) => n.token === token)
      .reduce((sum, n) => sum + n.amount, 0n);
  }

  /** Mark a note as spent */
  markSpent(commitment: Bytes32): void {
    const note = this.notes.get(commitment);
    if (note) {
      note.spent = true;
    }
  }

  /** Add a note to the local store */
  addNote(note: OwnedNote): void {
    this.notes.set(note.commitment, note);
  }

  /** Remove all notes */
  clear(): void {
    this.notes.clear();
  }
}
