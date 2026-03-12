// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleTree} from "./MerkleTree.sol";
import {IVerifier} from "./interfaces/IVerifier.sol";

/// @title ShieldedPool — Core NullShift privacy pool
/// @notice Manages deposits, shielded transfers, and withdrawals using ZK proofs
/// @dev Uses incremental Merkle tree for note commitments and nullifier registry for double-spend prevention
contract ShieldedPool {
    using MerkleTree for MerkleTree.Tree;

    // ── Errors ──────────────────────────────────────────
    error InvalidCommitment();
    error InvalidProof();
    error NullifierAlreadySpent();
    error InvalidMerkleRoot();
    error InsufficientPoolBalance();
    error TransferFailed();
    error ZeroAmount();
    error DuplicateNullifier();
    error InvalidRecipient();

    // ── Events ──────────────────────────────────────────
    event Deposit(
        bytes32 indexed commitment,
        uint256 indexed leafIndex,
        uint256 timestamp
    );

    event ShieldedTransfer(
        bytes32 nullifier1,
        bytes32 nullifier2,
        bytes32 newCommitment1,
        bytes32 newCommitment2,
        uint256 timestamp
    );

    event Withdrawal(
        bytes32 indexed nullifier,
        uint256 timestamp
    );

    // ── State ───────────────────────────────────────────

    /// @notice Merkle tree of note commitments
    MerkleTree.Tree internal tree;

    /// @notice Nullifier registry — true if nullifier has been spent
    mapping(bytes32 => bool) public nullifiers;

    /// @notice Root history — stores last N roots to handle reorgs
    mapping(bytes32 => bool) public rootHistory;
    uint256 public constant ROOT_HISTORY_SIZE = 100;
    bytes32[100] public roots;
    uint256 public currentRootIndex;

    /// @notice Verifier contracts for each circuit type
    IVerifier public immutable transferVerifier;
    IVerifier public immutable depositVerifier;
    IVerifier public immutable withdrawVerifier;

    /// @notice Reentrancy guard
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "ReentrancyGuard: reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    // ── Constructor ─────────────────────────────────────

    constructor(
        address _transferVerifier,
        address _depositVerifier,
        address _withdrawVerifier
    ) {
        transferVerifier = IVerifier(_transferVerifier);
        depositVerifier = IVerifier(_depositVerifier);
        withdrawVerifier = IVerifier(_withdrawVerifier);

        // Initialize root history with empty tree root
        bytes32 initialRoot = tree.getRoot();
        roots[0] = initialRoot;
        rootHistory[initialRoot] = true;
    }

    // ── Deposit (Shield) ────────────────────────────────

    /// @notice Deposit ETH into the shielded pool
    /// @param commitment The note commitment (Pedersen hash of pubkey, amount, salt)
    function deposit(bytes32 commitment) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        if (commitment == bytes32(0)) revert InvalidCommitment();

        uint256 leafIndex = tree.insert(commitment);
        _updateRootHistory();

        emit Deposit(commitment, leafIndex, block.timestamp);
    }

    // ── Shielded Transfer ───────────────────────────────

    /// @notice Execute a shielded transfer with ZK proof
    /// @param proof The serialized ZK proof
    /// @param _nullifiers Two nullifiers for the spent input notes
    /// @param newCommitments Two new note commitments
    /// @param root The Merkle root the proof was generated against
    function transact(
        bytes calldata proof,
        bytes32[2] calldata _nullifiers,
        bytes32[2] calldata newCommitments,
        bytes32 root
    ) external nonReentrant {
        // Verify Merkle root is valid (recent)
        if (!rootHistory[root]) revert InvalidMerkleRoot();

        // Check nullifiers are unique and unspent
        if (_nullifiers[0] == _nullifiers[1]) revert DuplicateNullifier();
        if (nullifiers[_nullifiers[0]]) revert NullifierAlreadySpent();
        if (nullifiers[_nullifiers[1]]) revert NullifierAlreadySpent();

        // Verify ZK proof
        bytes32[] memory publicInputs = new bytes32[](5);
        publicInputs[0] = root;
        publicInputs[1] = _nullifiers[0];
        publicInputs[2] = _nullifiers[1];
        publicInputs[3] = newCommitments[0];
        publicInputs[4] = newCommitments[1];

        if (!transferVerifier.verify(proof, publicInputs)) revert InvalidProof();

        // Mark nullifiers as spent
        nullifiers[_nullifiers[0]] = true;
        nullifiers[_nullifiers[1]] = true;

        // Insert new commitments
        tree.insert(newCommitments[0]);
        tree.insert(newCommitments[1]);
        _updateRootHistory();

        emit ShieldedTransfer(
            _nullifiers[0],
            _nullifiers[1],
            newCommitments[0],
            newCommitments[1],
            block.timestamp
        );
    }

    // ── Withdraw (Unshield) ─────────────────────────────

    /// @notice Withdraw from shielded pool to a public address
    /// @param proof The serialized ZK proof
    /// @param nullifier The nullifier for the spent note
    /// @param recipient Address to receive the funds
    /// @param amount Amount to withdraw
    /// @param root The Merkle root the proof was generated against
    /// @param changeCommitment Change note commitment (for partial withdrawal)
    function withdraw(
        bytes calldata proof,
        bytes32 nullifier,
        address recipient,
        uint256 amount,
        bytes32 root,
        bytes32 changeCommitment
    ) external nonReentrant {
        if (!rootHistory[root]) revert InvalidMerkleRoot();
        if (nullifiers[nullifier]) revert NullifierAlreadySpent();
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (address(this).balance < amount) revert InsufficientPoolBalance();

        // Verify ZK proof
        bytes32[] memory publicInputs = new bytes32[](5);
        publicInputs[0] = root;
        publicInputs[1] = nullifier;
        publicInputs[2] = bytes32(uint256(uint160(recipient)));
        publicInputs[3] = bytes32(amount);
        publicInputs[4] = changeCommitment;

        if (!withdrawVerifier.verify(proof, publicInputs)) revert InvalidProof();

        // Mark nullifier spent
        nullifiers[nullifier] = true;

        // Insert change commitment if non-zero
        if (changeCommitment != bytes32(0)) {
            tree.insert(changeCommitment);
            _updateRootHistory();
        }

        // Transfer funds to recipient
        (bool success,) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawal(nullifier, block.timestamp);
    }

    // ── View Functions ──────────────────────────────────

    /// @notice Get current Merkle root
    function getMerkleRoot() external view returns (bytes32) {
        return tree.getRoot();
    }

    /// @notice Get next available leaf index
    function getNextLeafIndex() external view returns (uint256) {
        return tree.getNextIndex();
    }

    /// @notice Check if a root is in the valid history
    function isKnownRoot(bytes32 root) external view returns (bool) {
        return rootHistory[root];
    }

    /// @notice Check if a nullifier has been spent
    function isSpent(bytes32 nullifier) external view returns (bool) {
        return nullifiers[nullifier];
    }

    // ── Internal ────────────────────────────────────────

    /// @dev Update root history ring buffer
    function _updateRootHistory() internal {
        bytes32 newRoot = tree.getRoot();
        currentRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        roots[currentRootIndex] = newRoot;
        rootHistory[newRoot] = true;
    }
}
