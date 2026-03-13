// ============================================================
// NullShift SDK -- Contract ABIs
// ============================================================

export const SHIELDED_POOL_ABI = [
  'function deposit(bytes32 commitment) external payable',
  'function transact(bytes calldata proof, bytes32[2] calldata nullifiers, bytes32[2] calldata newCommitments, bytes32 root) external',
  'function withdraw(bytes calldata proof, bytes32 nullifier, address recipient, uint256 amount, bytes32 root, bytes32 changeCommitment) external',
  'function getMerkleRoot() external view returns (bytes32)',
  'function getNextLeafIndex() external view returns (uint256)',
  'function isKnownRoot(bytes32 root) external view returns (bool)',
  'function isSpent(bytes32 nullifier) external view returns (bool)',
  'event Deposit(bytes32 indexed commitment, uint256 indexed leafIndex, uint256 timestamp)',
  'event ShieldedTransfer(bytes32 nullifier1, bytes32 nullifier2, bytes32 newCommitment1, bytes32 newCommitment2, uint256 timestamp)',
  'event Withdrawal(bytes32 indexed nullifier, uint256 timestamp)',
] as const;

export const RELAYER_ABI = [
  'function executeSwap(bytes calldata proof, tuple(bytes32 nullifier, bytes32 swapCommitment, bytes32 changeCommitment, bytes32 outputCommitment, address tokenIn, address tokenOut, uint256 swapAmount, uint256 minOutputAmount, uint256 relayerFee, bytes32 root) params) external',
  'event SwapExecuted(bytes32 indexed nullifier, uint256 timestamp)',
] as const;
