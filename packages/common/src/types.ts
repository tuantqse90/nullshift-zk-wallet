// ============================================================
// NullShift Common Types
// ============================================================

/** Hex string (0x-prefixed) */
export type Hex = `0x${string}`;

/** Ethereum address */
export type Address = Hex;

/** Bytes32 hex string */
export type Bytes32 = Hex;

/** Supported chain IDs */
export type ChainId = 1 | 11155111 | 10143 | 31337; // mainnet, sepolia, monad testnet, anvil local

// ── Note Types ──────────────────────────────────────────

/** A shielded note (UTXO) */
export interface Note {
  commitment: Bytes32;
  amount: bigint;
  salt: Bytes32;
  ownerPubkey: Bytes32;
  leafIndex: number;
  token: Address;
}

/** Note with spending information */
export interface OwnedNote extends Note {
  /** Whether this note has been spent */
  spent: boolean;
  /** The nullifier for this note (derived from commitment + secret key) */
  nullifier: Bytes32;
  /** Merkle path for proving membership */
  merklePath: {
    pathIndex: number;
    siblings: Bytes32[];
  };
}

/** Note status in the local store */
export type NoteStatus = 'unspent' | 'spent' | 'pending';

// ── Key Types ───────────────────────────────────────────

/** HD wallet key hierarchy */
export interface WalletKeys {
  /** BIP-39 mnemonic (24 words) */
  mnemonic: string;
  /** Ethereum keypair derived via BIP-44 */
  ethPrivateKey: Hex;
  ethPublicKey: Hex;
  ethAddress: Address;
  /** ZK spending key (signs notes, derives nullifiers) */
  spendingKey: Bytes32;
  /** ZK viewing key (scan incoming notes, can't spend) */
  viewingKey: Bytes32;
  /** Nullifier derivation key */
  nullifierKey: Bytes32;
}

/** Encrypted vault stored in chrome.storage.local */
export interface EncryptedVault {
  /** AES-256-GCM encrypted wallet keys */
  ciphertext: string;
  /** Initialization vector */
  iv: string;
  /** Salt for password-based key derivation */
  salt: string;
  /** Version for migration */
  version: number;
}

// ── Transaction Types ───────────────────────────────────

/** Shielded transfer input parameters */
export interface ShieldedTransferParams {
  recipientPubkey: Bytes32;
  amount: bigint;
  token: Address;
}

/** Deposit (shield) parameters */
export interface DepositParams {
  amount: bigint;
  token: Address;
}

/** Withdraw (unshield) parameters */
export interface WithdrawParams {
  amount: bigint;
  recipient: Address;
  token: Address;
}

/** Anonymous swap parameters */
export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  relayerAddress?: Address;
}

// ── Proof Types ─────────────────────────────────────────

/** Circuit types available in the system */
export type CircuitType = 'shielded_transfer' | 'deposit' | 'withdraw' | 'anonymous_swap';

/** Result of proof generation */
export interface ProofResult {
  proof: Uint8Array;
  publicInputs: Bytes32[];
  circuit: CircuitType;
  provingTimeMs: number;
}

/** Proof generation progress */
export interface ProofProgress {
  circuit: CircuitType;
  stage: 'loading' | 'witnessing' | 'proving' | 'done';
  percent: number;
  elapsedMs: number;
}

// ── Network Types ───────────────────────────────────────

/** Network configuration */
export interface NetworkConfig {
  chainId: ChainId;
  name: string;
  rpcUrl: string;
  contracts: {
    shieldedPool: Address;
    relayer: Address;
  };
  blockExplorer?: string;
}

// ── Activity Types ──────────────────────────────────────

/** Activity log entry */
export interface ActivityEntry {
  id: string;
  type: 'SHIELD' | 'SEND' | 'RECV' | 'WITHDRAW' | 'SWAP' | 'PROOF' | 'DAPP' | 'ERROR';
  message: string;
  timestamp: number;
  txHash?: Hex;
  details?: Record<string, unknown>;
}
