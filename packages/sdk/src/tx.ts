// ============================================================
// NullShift SDK -- Transaction Builder
// ============================================================
// Composes full transaction flows:
// select UTXOs -> build circuit inputs -> generate proof ->
// format calldata -> submit to chain
// ============================================================

import type {
  Hex,
  Bytes32,
  ShieldedTransferParams,
  DepositParams,
  WithdrawParams,
  SwapParams,
  OwnedNote,
} from '@nullshift/common';
import { ETH_ADDRESS } from '@nullshift/common';
import { ethers } from 'ethers';
import { KeyManager } from './keys';
import { NoteManager } from './notes';
import { Prover } from './prover';
import { MerkleTreeSync } from './tree';
import { SHIELDED_POOL_ABI, RELAYER_ABI } from './abi';
import {
  computeCommitment,
  computeNullifier,
  derivePublicKey,
  bigintToField,
} from './crypto';

/** Transaction result */
export interface TxResult {
  txHash: Hex;
  blockNumber: number;
  gasUsed: bigint;
}

export class TransactionBuilder {
  constructor(
    private keys: KeyManager,
    private notes: NoteManager,
    private prover: Prover,
    private tree: MerkleTreeSync,
  ) {}

  /** Execute a shielded transfer */
  async shieldedTransfer(
    params: ShieldedTransferParams,
    signer: ethers.Signer,
    poolAddress: string,
  ): Promise<TxResult> {
    const walletKeys = this.keys.getKeys();
    const spendingKey = walletKeys.spendingKey;
    const senderPubkey = await derivePublicKey(spendingKey);

    // 1. Select UTXOs
    const selectedNotes = this.notes.selectNotes(params.amount, params.token);
    const totalInput = selectedNotes.reduce((sum, n) => sum + n.amount, 0n);
    const changeAmount = totalInput - params.amount;

    // 2. Pad to 2 input notes (circuit requires exactly 2)
    while (selectedNotes.length < 2) {
      // Create a zero-value dummy note
      const dummyNote = await this.notes.createNote(senderPubkey, 0n, params.token);
      const dummyOwned: OwnedNote = {
        ...dummyNote,
        spent: false,
        nullifier: bigintToField(0n),
        merklePath: { pathIndex: 0, siblings: Array(20).fill(bigintToField(0n)) },
      };
      selectedNotes.push(dummyOwned);
    }

    // 3. Get Merkle paths for input notes
    const inputNotes = await Promise.all(
      selectedNotes.map(async (note) => {
        const path = await this.tree.getMerklePath(note.leafIndex);
        return {
          amount: bigintToField(note.amount),
          salt: note.salt,
          pathIndex: path.pathIndex,
          siblings: path.siblings,
        };
      }),
    );

    // 4. Create output notes
    const recipientNote = await this.notes.createNote(
      params.recipientPubkey,
      params.amount,
      params.token,
    );
    const changeNote = await this.notes.createNote(senderPubkey, changeAmount, params.token);

    // 5. Compute nullifiers and commitments
    const nullifiers: Bytes32[] = await Promise.all(
      selectedNotes.map((n) => computeNullifier(n.commitment, spendingKey)),
    );

    // 6. Generate proof
    const proof = await this.prover.generateShieldedTransferProof({
      senderSecretKey: spendingKey,
      inputNotes,
      outputNotes: [
        {
          ownerPubkey: params.recipientPubkey,
          amount: bigintToField(params.amount),
          salt: recipientNote.salt,
        },
        {
          ownerPubkey: senderPubkey,
          amount: bigintToField(changeAmount),
          salt: changeNote.salt,
        },
      ],
      merkleRoot: this.tree.getRoot(),
    });

    // 7. Submit on-chain
    const pool = new ethers.Contract(poolAddress, SHIELDED_POOL_ABI, signer);
    const tx = await pool['transact']!(
      proof.proof,
      [nullifiers[0], nullifiers[1]],
      [recipientNote.commitment, changeNote.commitment],
      this.tree.getRoot(),
    );
    const receipt = await tx.wait();

    // 8. Update local state
    for (const note of selectedNotes) {
      if (note.amount > 0n) {
        this.notes.markSpent(note.commitment);
      }
    }

    return {
      txHash: receipt.hash as Hex,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /** Shield (deposit) funds into the private pool */
  async deposit(
    params: DepositParams,
    signer: ethers.Signer,
    poolAddress: string,
  ): Promise<TxResult> {
    const walletKeys = this.keys.getKeys();
    const ownerPubkey = await derivePublicKey(walletKeys.spendingKey);

    // 1. Create note
    const note = await this.notes.createNote(ownerPubkey, params.amount, params.token);

    // 2. Submit deposit on-chain
    const pool = new ethers.Contract(poolAddress, SHIELDED_POOL_ABI, signer);
    const value = params.token === ETH_ADDRESS ? params.amount : 0n;
    const tx = await pool['deposit']!(note.commitment, { value });
    const receipt = await tx.wait();

    // 3. Sync tree + add note to local store
    const leafIndex = await this.tree.insert(note.commitment);
    const merklePath = await this.tree.getMerklePath(leafIndex);
    const nullifier = await computeNullifier(note.commitment, walletKeys.spendingKey);

    this.notes.addNote({
      ...note,
      leafIndex,
      spent: false,
      nullifier,
      merklePath,
    });

    return {
      txHash: receipt.hash as Hex,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /** Unshield (withdraw) funds to a public address */
  async withdraw(
    params: WithdrawParams,
    signer: ethers.Signer,
    poolAddress: string,
  ): Promise<TxResult> {
    const walletKeys = this.keys.getKeys();
    const spendingKey = walletKeys.spendingKey;
    const ownerPubkey = await derivePublicKey(spendingKey);

    // 1. Select note to spend
    const [note] = this.notes.selectNotes(params.amount, params.token);
    if (!note) throw new Error('No suitable note found');

    const changeAmount = note.amount - params.amount;

    // 2. Get Merkle path
    const merklePath = await this.tree.getMerklePath(note.leafIndex);

    // 3. Create change salt
    const changeSalt = ('0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2)) as Bytes32;

    // 4. Compute change commitment
    const changeCommitment = changeAmount > 0n
      ? await computeCommitment(ownerPubkey, changeAmount, changeSalt)
      : bigintToField(0n);

    // 5. Compute nullifier
    const nullifier = await computeNullifier(note.commitment, spendingKey);

    // 6. Generate proof
    const proof = await this.prover.generateWithdrawProof({
      secretKey: spendingKey,
      amount: bigintToField(note.amount),
      salt: note.salt,
      pathIndex: merklePath.pathIndex,
      siblings: merklePath.siblings,
      changeSalt,
      merkleRoot: this.tree.getRoot(),
      recipientAddress: params.recipient,
      withdrawAmount: bigintToField(params.amount),
    });

    // 7. Submit on-chain
    const pool = new ethers.Contract(poolAddress, SHIELDED_POOL_ABI, signer);
    const tx = await pool['withdraw']!(
      proof.proof,
      nullifier,
      params.recipient,
      params.amount,
      this.tree.getRoot(),
      changeCommitment,
    );
    const receipt = await tx.wait();

    // 8. Update local state
    this.notes.markSpent(note.commitment);

    if (changeAmount > 0n) {
      const changeLeafIndex = await this.tree.insert(changeCommitment);
      const changePath = await this.tree.getMerklePath(changeLeafIndex);
      const changeNullifier = await computeNullifier(changeCommitment, spendingKey);

      this.notes.addNote({
        commitment: changeCommitment,
        amount: changeAmount,
        salt: changeSalt,
        ownerPubkey,
        leafIndex: changeLeafIndex,
        token: params.token,
        spent: false,
        nullifier: changeNullifier,
        merklePath: changePath,
      });
    }

    return {
      txHash: receipt.hash as Hex,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /** Execute an anonymous swap via relayer */
  async anonymousSwap(
    params: SwapParams,
    signer: ethers.Signer,
    relayerAddress: string,
  ): Promise<TxResult> {
    const walletKeys = this.keys.getKeys();
    const spendingKey = walletKeys.spendingKey;

    // 1. Select note for swap
    const [note] = this.notes.selectNotes(params.amountIn, params.tokenIn);
    if (!note) throw new Error('No suitable note found');

    // 2. Get Merkle path
    const merklePath = await this.tree.getMerklePath(note.leafIndex);

    // 3. Generate salts
    const outputNoteSalt = ('0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2)) as Bytes32;
    const changeNoteSalt = ('0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2)) as Bytes32;

    // 4. Compute nullifier
    const nullifier = await computeNullifier(note.commitment, spendingKey);

    const relayerFee = 0n; // Self-relay for now

    // 5. Generate proof
    const proof = await this.prover.generateSwapProof({
      secretKey: spendingKey,
      inputAmount: bigintToField(note.amount),
      inputTokenId: bigintToField(0n), // Token ID mapping
      inputSalt: note.salt,
      pathIndex: merklePath.pathIndex,
      siblings: merklePath.siblings,
      swapAmount: bigintToField(params.amountIn),
      minOutputAmount: bigintToField(params.minAmountOut),
      outputNoteSalt,
      changeNoteSalt,
      merkleRoot: this.tree.getRoot(),
      relayerAddress: params.relayerAddress ?? relayerAddress,
      relayerFee: bigintToField(relayerFee),
    });

    // 6. Submit to relayer contract
    const relayer = new ethers.Contract(relayerAddress, RELAYER_ABI, signer);
    const tx = await relayer['executeSwap']!(proof.proof, {
      nullifier,
      swapCommitment: proof.publicInputs[2],
      changeCommitment: proof.publicInputs[3],
      outputCommitment: bigintToField(0n),
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      swapAmount: params.amountIn,
      minOutputAmount: params.minAmountOut,
      relayerFee,
      root: this.tree.getRoot(),
    });
    const receipt = await tx.wait();

    // 7. Update local state
    this.notes.markSpent(note.commitment);

    return {
      txHash: receipt.hash as Hex,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /** Estimate gas for a transaction type */
  estimateGas(type: 'deposit' | 'transact' | 'withdraw'): bigint {
    const estimates: Record<string, bigint> = {
      deposit: 150_000n,
      transact: 450_000n,
      withdraw: 280_000n,
    };
    return estimates[type] ?? 300_000n;
  }
}
