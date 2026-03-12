// ============================================================
// NullShift SDK -- Merkle Tree Sync
// ============================================================
// Maintains a local mirror of the on-chain Merkle tree.
// Generates membership proofs for owned notes.
// ============================================================

import type { Bytes32 } from '@nullshift/common';
import { MERKLE_TREE_DEPTH } from '@nullshift/common';
import { pedersenHash, getZeroHashes, bigintToField } from './crypto';
import { ethers } from 'ethers';
import { SHIELDED_POOL_ABI } from './abi';

/** Merkle path for proving note membership */
export interface MerklePath {
  pathIndex: number;
  siblings: Bytes32[];
}

export class MerkleTreeSync {
  private leaves: Bytes32[] = [];
  private layers: Bytes32[][] = [];
  private root: Bytes32 = bigintToField(0n);
  private lastSyncedBlock = 0;
  private zeroHashes: Bytes32[] | null = null;

  /** Get current tree root */
  getRoot(): Bytes32 {
    return this.root;
  }

  /** Get total number of leaves */
  getLeafCount(): number {
    return this.leaves.length;
  }

  /** Get last synced block number */
  getLastSyncedBlock(): number {
    return this.lastSyncedBlock;
  }

  /** Insert a new leaf and recompute root */
  async insert(leaf: Bytes32): Promise<number> {
    const index = this.leaves.length;
    this.leaves.push(leaf);
    await this.rebuildTree();
    return index;
  }

  /** Get Merkle path for a leaf at given index */
  async getMerklePath(leafIndex: number): Promise<MerklePath> {
    if (leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds (${this.leaves.length} leaves)`);
    }

    if (!this.zeroHashes) {
      this.zeroHashes = await getZeroHashes();
    }

    const siblings: Bytes32[] = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < MERKLE_TREE_DEPTH; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const layer = this.layers[level];

      if (layer && siblingIndex < layer.length) {
        siblings.push(layer[siblingIndex]!);
      } else {
        siblings.push(this.zeroHashes![level]!);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathIndex: leafIndex, siblings };
  }

  /** Sync new leaves from on-chain events */
  async syncFromChain(
    provider: ethers.Provider,
    poolAddress: string,
    fromBlock: number,
  ): Promise<number> {
    const pool = new ethers.Contract(poolAddress, SHIELDED_POOL_ABI, provider);

    // Query Deposit events
    const depositFilter = pool.filters['Deposit']!();
    const events = await pool.queryFilter(depositFilter, fromBlock);

    let insertedCount = 0;
    for (const event of events) {
      if ('args' in event && event.args) {
        const commitment = event.args[0] as string as Bytes32;
        await this.insert(commitment);
        insertedCount++;
      }
    }

    // Query ShieldedTransfer events for new commitments
    const transferFilter = pool.filters['ShieldedTransfer']!();
    const transferEvents = await pool.queryFilter(transferFilter, fromBlock);

    for (const event of transferEvents) {
      if ('args' in event && event.args) {
        await this.insert(event.args[2] as string as Bytes32);
        await this.insert(event.args[3] as string as Bytes32);
        insertedCount += 2;
      }
    }

    const allEvents = [...events, ...transferEvents];
    if (allEvents.length > 0) {
      allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
      this.lastSyncedBlock = allEvents[allEvents.length - 1]!.blockNumber;
    }

    return insertedCount;
  }

  /** Verify local root matches on-chain root */
  async verifyRoot(provider: ethers.Provider, poolAddress: string): Promise<boolean> {
    const pool = new ethers.Contract(poolAddress, SHIELDED_POOL_ABI, provider);
    const onChainRoot: string = await pool['getMerkleRoot']!();
    return this.root === (onChainRoot as Bytes32);
  }

  /** Rebuild the tree from all leaves */
  private async rebuildTree(): Promise<void> {
    if (!this.zeroHashes) {
      this.zeroHashes = await getZeroHashes();
    }

    this.layers = [];
    this.layers[0] = [...this.leaves];

    for (let level = 0; level < MERKLE_TREE_DEPTH; level++) {
      const currentLayer = this.layers[level] ?? [];
      const nextLayer: Bytes32[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i]!;
        const right = currentLayer[i + 1] ?? this.zeroHashes![level]!;
        nextLayer.push(await pedersenHash([left, right]));
      }

      if (nextLayer.length === 0) {
        nextLayer.push(this.zeroHashes![level + 1]!);
      }

      this.layers[level + 1] = nextLayer;
    }

    const topLayer = this.layers[MERKLE_TREE_DEPTH];
    this.root = topLayer?.[0] ?? this.zeroHashes![MERKLE_TREE_DEPTH]!;
  }
}
