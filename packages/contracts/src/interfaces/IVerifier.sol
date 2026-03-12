// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IVerifier — Interface for UltraPlonk proof verifiers
/// @notice Auto-generated verifiers from Noir circuits implement this interface
interface IVerifier {
    /// @notice Verify a ZK proof against public inputs
    /// @param proof The serialized proof bytes
    /// @param publicInputs Array of public input values
    /// @return True if the proof is valid
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}
