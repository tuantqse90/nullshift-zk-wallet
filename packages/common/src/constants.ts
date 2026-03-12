// ============================================================
// NullShift Constants
// ============================================================

import type { ChainId, NetworkConfig, Address } from './types';

/** Merkle tree depth — supports ~1M notes */
export const MERKLE_TREE_DEPTH = 20;

/** Maximum number of notes (2^20) */
export const MAX_NOTES = 2 ** MERKLE_TREE_DEPTH;

/** Root history size — how many past roots are considered valid */
export const ROOT_HISTORY_SIZE = 100;

/** Auto-lock timeout (15 minutes) */
export const AUTO_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

/** Maximum activity entries in side panel */
export const MAX_ACTIVITY_ENTRIES = 500;

/** ETH address (zero address used as token identifier for native ETH) */
export const ETH_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

/** Default networks */
export const NETWORKS: Record<ChainId, NetworkConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: '', // User must configure
    contracts: {
      shieldedPool: '0x0000000000000000000000000000000000000000',
      relayer: '0x0000000000000000000000000000000000000000',
    },
    blockExplorer: 'https://etherscan.io',
  },
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: '', // User must configure
    contracts: {
      shieldedPool: '0x0000000000000000000000000000000000000000',
      relayer: '0x0000000000000000000000000000000000000000',
    },
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  10143: {
    chainId: 10143,
    name: 'Monad Testnet',
    rpcUrl: '', // User must configure
    contracts: {
      shieldedPool: '0x0000000000000000000000000000000000000000',
      relayer: '0x0000000000000000000000000000000000000000',
    },
  },
  31337: {
    chainId: 31337,
    name: 'Anvil Local',
    rpcUrl: 'http://127.0.0.1:8545',
    contracts: {
      shieldedPool: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      relayer: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    },
  },
};

/** BIP-44 derivation paths */
export const DERIVATION_PATHS = {
  /** Standard ETH key */
  eth: "m/44'/60'/0'/0/0",
  /** ZK spending key (custom path) */
  spending: "m/44'/60'/0'/1/0",
} as const;

/** Vault encryption version (for future migrations) */
export const VAULT_VERSION = 1;
