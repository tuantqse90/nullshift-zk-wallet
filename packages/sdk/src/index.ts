export { KeyManager } from './keys';
export { NoteManager } from './notes';
export { Prover } from './prover';
export { MerkleTreeSync } from './tree';
export { TransactionBuilder } from './tx';
export {
  initBarretenberg,
  destroyBarretenberg,
  pedersenHash,
  poseidonHash2,
  computeCommitment,
  computeNullifier,
  derivePublicKey,
  hexToBytes,
  bytesToHex,
  bigintToField,
  fieldToBigint,
  randomFieldElement,
} from './crypto';
export { SHIELDED_POOL_ABI, RELAYER_ABI } from './abi';

export type { MerklePath } from './tree';
export type { TxResult } from './tx';
export type {
  ShieldedTransferInput,
  DepositInput,
  WithdrawInput,
  SwapInput,
  OnProgress,
} from './prover';
