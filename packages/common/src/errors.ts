// ============================================================
// NullShift Error Types
// ============================================================

/** Base error for all NullShift errors */
export class NullShiftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NullShiftError';
  }
}

/** Wallet is locked — user must unlock first */
export class WalletLockedError extends NullShiftError {
  constructor() {
    super('Wallet is locked. Please unlock to continue.');
    this.name = 'WalletLockedError';
  }
}

/** No wallet exists — user must create or import */
export class NoWalletError extends NullShiftError {
  constructor() {
    super('No wallet found. Please create or import a wallet.');
    this.name = 'NoWalletError';
  }
}

/** Incorrect password */
export class InvalidPasswordError extends NullShiftError {
  constructor() {
    super('Invalid password.');
    this.name = 'InvalidPasswordError';
  }
}

/** ZK proof generation failed */
export class ProofGenerationError extends NullShiftError {
  circuit: string;

  constructor(circuit: string, reason: string) {
    super(`Proof generation failed for ${circuit}: ${reason}`);
    this.name = 'ProofGenerationError';
    this.circuit = circuit;
  }
}

/** Insufficient shielded balance */
export class InsufficientBalanceError extends NullShiftError {
  required: bigint;
  available: bigint;

  constructor(required: bigint, available: bigint) {
    super(`Insufficient shielded balance. Required: ${required}, Available: ${available}`);
    this.name = 'InsufficientBalanceError';
    this.required = required;
    this.available = available;
  }
}

/** Merkle tree sync error */
export class TreeSyncError extends NullShiftError {
  constructor(reason: string) {
    super(`Merkle tree sync failed: ${reason}`);
    this.name = 'TreeSyncError';
  }
}

/** Note not found in local store */
export class NoteNotFoundError extends NullShiftError {
  constructor(commitment: string) {
    super(`Note not found: ${commitment}`);
    this.name = 'NoteNotFoundError';
  }
}

/** Transaction submission failed */
export class TransactionError extends NullShiftError {
  txHash?: string;

  constructor(reason: string, txHash?: string) {
    super(`Transaction failed: ${reason}`);
    this.name = 'TransactionError';
    this.txHash = txHash;
  }
}

/** Network/RPC error */
export class NetworkError extends NullShiftError {
  constructor(reason: string) {
    super(`Network error: ${reason}`);
    this.name = 'NetworkError';
  }
}

/** dApp interaction error */
export class DAppError extends NullShiftError {
  origin: string;

  constructor(origin: string, reason: string) {
    super(`dApp error (${origin}): ${reason}`);
    this.name = 'DAppError';
    this.origin = origin;
  }
}
