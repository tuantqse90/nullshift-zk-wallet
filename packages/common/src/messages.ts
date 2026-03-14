// ============================================================
// NullShift Message Protocol
// ============================================================
// Typed message bus between all extension contexts:
// popup <-> background <-> content <-> inpage <-> offscreen
// ============================================================

import type {
  Address,
  Bytes32,
  ChainId,
  CircuitType,
  DepositParams,
  ProofProgress,
  ProofResult,
  ShieldedTransferParams,
  SwapParams,
  WithdrawParams,
  ActivityEntry,
  OwnedNote,
  NetworkConfig,
} from './types';

// ── Message Source ───────────────────────────────────────

export type MessageSource =
  | 'popup'
  | 'dashboard'
  | 'sidepanel'
  | 'background'
  | 'content'
  | 'inpage'
  | 'offscreen';

// ── Message Types ───────────────────────────────────────

export type MessageType =
  // Wallet lifecycle
  | 'CREATE_WALLET'
  | 'IMPORT_WALLET'
  | 'UNLOCK_WALLET'
  | 'LOCK_WALLET'
  | 'GET_WALLET_STATUS'
  // Balances
  | 'GET_BALANCE'
  | 'GET_SHIELDED_BALANCE'
  | 'GET_PUBLIC_BALANCE'
  // Transactions
  | 'SEND_SHIELDED'
  | 'SHIELD_FUNDS'
  | 'UNSHIELD_FUNDS'
  | 'ANONYMOUS_SWAP'
  // Proof generation (background <-> offscreen)
  | 'GENERATE_PROOF'
  | 'PROOF_PROGRESS'
  | 'PROOF_COMPLETE'
  | 'PROOF_ERROR'
  // Notes
  | 'GET_NOTES'
  | 'SYNC_NOTES'
  // Merkle tree
  | 'SYNC_TREE'
  | 'SYNC_COMPLETE'
  // Activity
  | 'GET_ACTIVITY'
  | 'NEW_ACTIVITY'
  // dApp interaction (content <-> background)
  | 'DAPP_CONNECT'
  | 'DAPP_REQUEST'
  | 'DAPP_RESPONSE'
  | 'DAPP_DISCONNECT'
  // Network
  | 'GET_NETWORK'
  | 'SWITCH_NETWORK'
  // Gas
  | 'GET_GAS_ESTIMATE'
  // Settings
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS';

// ── Payload Map ─────────────────────────────────────────

export interface PayloadMap {
  // Wallet lifecycle
  CREATE_WALLET: { password: string };
  IMPORT_WALLET: { mnemonic: string; password: string };
  UNLOCK_WALLET: { password: string };
  LOCK_WALLET: undefined;
  GET_WALLET_STATUS: undefined;

  // Balances
  GET_BALANCE: { token?: Address };
  GET_SHIELDED_BALANCE: { token?: Address };
  GET_PUBLIC_BALANCE: { token?: Address };

  // Transactions
  SEND_SHIELDED: ShieldedTransferParams;
  SHIELD_FUNDS: DepositParams;
  UNSHIELD_FUNDS: WithdrawParams;
  ANONYMOUS_SWAP: SwapParams;

  // Proof generation
  GENERATE_PROOF: { circuit: CircuitType; inputs: Record<string, unknown> };
  PROOF_PROGRESS: ProofProgress;
  PROOF_COMPLETE: ProofResult;
  PROOF_ERROR: { circuit: CircuitType; error: string };

  // Notes
  GET_NOTES: { status?: 'unspent' | 'spent' | 'all' };
  SYNC_NOTES: undefined;

  // Merkle tree
  SYNC_TREE: undefined;
  SYNC_COMPLETE: { root: Bytes32; leafCount: number };

  // Activity
  GET_ACTIVITY: { limit?: number };
  NEW_ACTIVITY: ActivityEntry;

  // dApp
  DAPP_CONNECT: { origin: string; favicon?: string };
  DAPP_REQUEST: { method: string; params?: unknown[] };
  DAPP_RESPONSE: { result?: unknown; error?: string };
  DAPP_DISCONNECT: { origin: string };

  // Network
  GET_NETWORK: undefined;
  SWITCH_NETWORK: { chainId: ChainId; name: string };

  // Gas
  GET_GAS_ESTIMATE: { type: 'shield' | 'send' | 'withdraw' };

  // Settings
  GET_SETTINGS: undefined;
  UPDATE_SETTINGS: Record<string, unknown>;
}

// ── Response Map ────────────────────────────────────────

export interface ResponseMap {
  CREATE_WALLET: { address: Address; mnemonic: string };
  IMPORT_WALLET: { address: Address };
  UNLOCK_WALLET: { success: boolean; address?: Address };
  LOCK_WALLET: { success: boolean };
  GET_WALLET_STATUS: { locked: boolean; hasWallet: boolean; address?: Address };

  GET_BALANCE: { shielded: string; public: string; total: string };
  GET_SHIELDED_BALANCE: { balance: string };
  GET_PUBLIC_BALANCE: { balance: string };

  SEND_SHIELDED: { txHash: string; nullifiers: Bytes32[] };
  SHIELD_FUNDS: { txHash: string; commitment: Bytes32; leafIndex: number };
  UNSHIELD_FUNDS: { txHash: string; nullifier: Bytes32 };
  ANONYMOUS_SWAP: { txHash: string; amountOut: string };

  GENERATE_PROOF: { started: boolean };
  PROOF_PROGRESS: void;
  PROOF_COMPLETE: void;
  PROOF_ERROR: void;

  GET_NOTES: { notes: OwnedNote[] };
  SYNC_NOTES: { synced: number };

  SYNC_TREE: { started: boolean };
  SYNC_COMPLETE: void;

  GET_ACTIVITY: { entries: ActivityEntry[] };
  NEW_ACTIVITY: void;

  DAPP_CONNECT: { approved: boolean; address?: Address };
  DAPP_REQUEST: { result?: unknown; error?: string };
  DAPP_RESPONSE: void;
  DAPP_DISCONNECT: { success: boolean };

  GET_NETWORK: NetworkConfig;
  SWITCH_NETWORK: { success: boolean };

  GET_GAS_ESTIMATE: { gasPrice: string; estimatedCost: string; symbol: string };

  GET_SETTINGS: Record<string, unknown>;
  UPDATE_SETTINGS: { success: boolean };
}

// ── Message Envelope ────────────────────────────────────

export interface Message<T extends MessageType = MessageType> {
  type: T;
  payload: PayloadMap[T];
  id: string;
  source: MessageSource;
  timestamp: number;
}

export interface MessageResponse<T extends MessageType = MessageType> {
  type: T;
  payload: ResponseMap[T];
  id: string;
  error?: string;
}

// ── Helper to create messages ───────────────────────────

export function createMessage<T extends MessageType>(
  type: T,
  payload: PayloadMap[T],
  source: MessageSource,
): Message<T> {
  return {
    type,
    payload,
    id: crypto.randomUUID(),
    source,
    timestamp: Date.now(),
  };
}
