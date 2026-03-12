// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";

/// @title MerkleTree -- Incremental Poseidon Merkle tree
/// @notice Stores note commitments for the NullShift shielded pool
/// @dev Depth 20 supports ~1M notes. Uses Poseidon hash matching Noir circuits.
library MerkleTree {
    uint256 internal constant DEPTH = 20;
    uint256 internal constant MAX_LEAVES = 2 ** DEPTH;

    error MerkleTreeFull();

    struct Tree {
        uint256 nextIndex;
        mapping(uint256 => bytes32) filledSubtrees;
        bytes32 root;
    }

    /// @notice Insert a new leaf into the Merkle tree
    function insert(Tree storage self, bytes32 leaf) internal returns (uint256 index) {
        if (self.nextIndex >= MAX_LEAVES) revert MerkleTreeFull();

        index = self.nextIndex;
        bytes32 current = leaf;

        for (uint256 i = 0; i < DEPTH; ) {
            if (index % 2 == 0) {
                self.filledSubtrees[i] = current;
                current = _hashPair(current, zeros(i));
            } else {
                current = _hashPair(self.filledSubtrees[i], current);
            }
            index /= 2;
            unchecked { ++i; }
        }

        self.root = current;
        index = self.nextIndex;
        self.nextIndex += 1;
    }

    /// @notice Get the current Merkle root
    function getRoot(Tree storage self) internal view returns (bytes32) {
        return self.root;
    }

    /// @notice Get the next available leaf index
    function getNextIndex(Tree storage self) internal view returns (uint256) {
        return self.nextIndex;
    }

    /// @notice Pre-computed Poseidon zero hashes for each level
    /// @dev zeros(0) = 0, zeros(n) = Poseidon(zeros(n-1), zeros(n-1))
    /// These match the Noir circuit's Poseidon hash for the Merkle tree.
    function zeros(uint256 level) internal pure returns (bytes32) {
        if (level == 0) return bytes32(uint256(0));
        if (level == 1) return bytes32(uint256(14744269619966411208579211824598458697587494354926760081771325075741142829156));
        if (level == 2) return bytes32(uint256(7423237065226347324353380772367382631490014989348495481811164164159255474657));
        if (level == 3) return bytes32(uint256(11286972368698509976183087595462810875513684078608517520839298933882497716792));
        if (level == 4) return bytes32(uint256(3607627140608796879659380071776844901612302623152076817094415224584923813162));
        if (level == 5) return bytes32(uint256(19712377064642672829441595136074946683621277828620209496774504837737984048981));
        if (level == 6) return bytes32(uint256(20775607673010627194014556968476266066927294572720319469184847051418138353016));
        if (level == 7) return bytes32(uint256(3396914609616007258851405644437304192397291162432396347162513310381425243293));
        if (level == 8) return bytes32(uint256(21551820661461729022865262380882070649935529853313286572328683688269863701601));
        if (level == 9) return bytes32(uint256(6573136701248752079028194407151022595060682063033565181951145966236778420039));
        if (level == 10) return bytes32(uint256(12413880268183407374852357075976609371175688755676981206018884971008854919922));
        if (level == 11) return bytes32(uint256(14271763308400718165336499097156975241954733520325982997864342600795471836726));
        if (level == 12) return bytes32(uint256(20066985985293572387227381049700832219069292839614107140851619262827735677018));
        if (level == 13) return bytes32(uint256(9394776414966240069580838672673694685292165040808226440647796406499139370960));
        if (level == 14) return bytes32(uint256(11331146992410411304059858900317123658895005918277453009197229807340014528524));
        if (level == 15) return bytes32(uint256(15819538789928229930262697811477882737253464456578333862691129291651619515538));
        if (level == 16) return bytes32(uint256(19217088683336594659449020493828377907203207941212636669271704950158751593251));
        if (level == 17) return bytes32(uint256(21035245323335827719745544373081896983162834604456827698288649288827293579666));
        if (level == 18) return bytes32(uint256(6939770416153240137322503476966641397417391950902474480970945462551409848591));
        if (level == 19) return bytes32(uint256(10941962436777715901943463195175331263348098796018438960955633645115732864202));
        revert("Invalid level");
    }

    /// @notice Hash two children using Poseidon T3
    function _hashPair(bytes32 left, bytes32 right) private pure returns (bytes32) {
        return bytes32(PoseidonT3.hash([uint256(left), uint256(right)]));
    }
}
