// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ShieldedPool} from "../src/ShieldedPool.sol";
import {IVerifier} from "../src/interfaces/IVerifier.sol";

/// @title MockVerifier -- always returns true
contract MockVerifier is IVerifier {
    function verify(bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return true;
    }
}

/// @title MockVerifierFail -- always returns false
contract MockVerifierFail is IVerifier {
    function verify(bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return false;
    }
}

/// @title ShieldedPool Tests
contract ShieldedPoolTest is Test {
    ShieldedPool public pool;
    MockVerifier public mockVerifier;

    function setUp() public {
        mockVerifier = new MockVerifier();
        pool = new ShieldedPool(
            address(mockVerifier), // transferVerifier
            address(mockVerifier), // depositVerifier
            address(mockVerifier)  // withdrawVerifier
        );
        // Fund the pool for withdrawal tests
        vm.deal(address(pool), 100 ether);
    }

    // ---- Deposit Tests ----

    function test_deposit_eth() public {
        bytes32 commitment = bytes32(uint256(123));
        pool.deposit{value: 1 ether}(commitment);

        assertEq(pool.getNextLeafIndex(), 1);
    }

    function test_deposit_revert_zero_amount() public {
        bytes32 commitment = bytes32(uint256(123));
        vm.expectRevert(ShieldedPool.ZeroAmount.selector);
        pool.deposit{value: 0}(commitment);
    }

    function test_deposit_revert_zero_commitment() public {
        vm.expectRevert(ShieldedPool.InvalidCommitment.selector);
        pool.deposit{value: 1 ether}(bytes32(0));
    }

    function test_merkle_root_updates_after_deposit() public {
        bytes32 rootBefore = pool.getMerkleRoot();
        pool.deposit{value: 1 ether}(bytes32(uint256(111)));
        bytes32 rootAfter = pool.getMerkleRoot();

        assertTrue(rootBefore != rootAfter, "Root should change after deposit");
    }

    function test_multiple_deposits_increment_index() public {
        pool.deposit{value: 1 ether}(bytes32(uint256(1)));
        pool.deposit{value: 1 ether}(bytes32(uint256(2)));
        pool.deposit{value: 1 ether}(bytes32(uint256(3)));

        assertEq(pool.getNextLeafIndex(), 3);
    }

    function test_deposit_root_is_known() public {
        pool.deposit{value: 1 ether}(bytes32(uint256(42)));
        bytes32 root = pool.getMerkleRoot();
        assertTrue(pool.isKnownRoot(root));
    }

    // ---- Shielded Transfer Tests ----

    function test_transact_valid_proof() public {
        // Insert two commitments first
        pool.deposit{value: 1 ether}(bytes32(uint256(100)));
        pool.deposit{value: 1 ether}(bytes32(uint256(200)));
        bytes32 root = pool.getMerkleRoot();

        bytes32[2] memory nulls = [bytes32(uint256(1)), bytes32(uint256(2))];
        bytes32[2] memory newComms = [bytes32(uint256(300)), bytes32(uint256(400))];

        pool.transact(hex"00", nulls, newComms, root);

        assertTrue(pool.isSpent(nulls[0]));
        assertTrue(pool.isSpent(nulls[1]));
        assertEq(pool.getNextLeafIndex(), 4); // 2 deposits + 2 new commitments
    }

    function test_transact_revert_spent_nullifier() public {
        pool.deposit{value: 1 ether}(bytes32(uint256(100)));
        bytes32 root = pool.getMerkleRoot();

        bytes32[2] memory nulls = [bytes32(uint256(1)), bytes32(uint256(2))];
        bytes32[2] memory newComms = [bytes32(uint256(300)), bytes32(uint256(400))];

        pool.transact(hex"00", nulls, newComms, root);

        // Second attempt with same nullifier should fail
        bytes32 newRoot = pool.getMerkleRoot();
        bytes32[2] memory newComms2 = [bytes32(uint256(500)), bytes32(uint256(600))];
        vm.expectRevert(ShieldedPool.NullifierAlreadySpent.selector);
        pool.transact(hex"00", nulls, newComms2, newRoot);
    }

    function test_transact_revert_invalid_root() public {
        bytes32[2] memory nulls = [bytes32(uint256(1)), bytes32(uint256(2))];
        bytes32[2] memory newComms = [bytes32(uint256(300)), bytes32(uint256(400))];
        bytes32 fakeRoot = bytes32(uint256(999));

        vm.expectRevert(ShieldedPool.InvalidMerkleRoot.selector);
        pool.transact(hex"00", nulls, newComms, fakeRoot);
    }

    function test_transact_revert_invalid_proof() public {
        MockVerifierFail failVerifier = new MockVerifierFail();
        ShieldedPool failPool = new ShieldedPool(
            address(failVerifier),
            address(mockVerifier),
            address(mockVerifier)
        );
        failPool.deposit{value: 1 ether}(bytes32(uint256(100)));
        bytes32 root = failPool.getMerkleRoot();

        bytes32[2] memory nulls = [bytes32(uint256(1)), bytes32(uint256(2))];
        bytes32[2] memory newComms = [bytes32(uint256(300)), bytes32(uint256(400))];

        vm.expectRevert(ShieldedPool.InvalidProof.selector);
        failPool.transact(hex"00", nulls, newComms, root);
    }

    // ---- Withdraw Tests ----

    function test_withdraw_full() public {
        pool.deposit{value: 1 ether}(bytes32(uint256(100)));
        bytes32 root = pool.getMerkleRoot();

        address recipient = address(0xBEEF);
        bytes32 nullifier = bytes32(uint256(42));
        uint256 amount = 1 ether;
        bytes32 changeCommitment = bytes32(0); // no change

        uint256 balBefore = recipient.balance;
        pool.withdraw(hex"00", nullifier, recipient, amount, root, changeCommitment);
        uint256 balAfter = recipient.balance;

        assertEq(balAfter - balBefore, amount);
        assertTrue(pool.isSpent(nullifier));
    }

    function test_withdraw_partial() public {
        pool.deposit{value: 2 ether}(bytes32(uint256(100)));
        bytes32 root = pool.getMerkleRoot();

        address recipient = address(0xBEEF);
        bytes32 nullifier = bytes32(uint256(42));
        uint256 amount = 1 ether;
        bytes32 changeCommitment = bytes32(uint256(999)); // change note

        pool.withdraw(hex"00", nullifier, recipient, amount, root, changeCommitment);

        assertTrue(pool.isSpent(nullifier));
        // Change commitment should have been inserted
        assertEq(pool.getNextLeafIndex(), 2); // 1 deposit + 1 change
    }

    function test_withdraw_revert_zero_amount() public {
        pool.deposit{value: 1 ether}(bytes32(uint256(100)));
        bytes32 root = pool.getMerkleRoot();

        vm.expectRevert(ShieldedPool.ZeroAmount.selector);
        pool.withdraw(hex"00", bytes32(uint256(1)), address(0xBEEF), 0, root, bytes32(0));
    }

    function test_withdraw_revert_insufficient_balance() public {
        // Deploy a new pool with no funds
        ShieldedPool emptyPool = new ShieldedPool(
            address(mockVerifier),
            address(mockVerifier),
            address(mockVerifier)
        );
        emptyPool.deposit{value: 1 wei}(bytes32(uint256(100)));
        bytes32 root = emptyPool.getMerkleRoot();

        vm.expectRevert(ShieldedPool.InsufficientPoolBalance.selector);
        emptyPool.withdraw(hex"00", bytes32(uint256(1)), address(0xBEEF), 1 ether, root, bytes32(0));
    }

    function test_withdraw_revert_spent_nullifier() public {
        pool.deposit{value: 2 ether}(bytes32(uint256(100)));
        bytes32 root = pool.getMerkleRoot();

        bytes32 nullifier = bytes32(uint256(42));
        pool.withdraw(hex"00", nullifier, address(0xBEEF), 1 ether, root, bytes32(0));

        bytes32 newRoot = pool.getMerkleRoot();
        vm.expectRevert(ShieldedPool.NullifierAlreadySpent.selector);
        pool.withdraw(hex"00", nullifier, address(0xDEAD), 1 ether, newRoot, bytes32(0));
    }

    // ---- Root History Tests ----

    function test_root_history_preserves_old_roots() public {
        bytes32 initialRoot = pool.getMerkleRoot();

        pool.deposit{value: 1 ether}(bytes32(uint256(1)));
        bytes32 root1 = pool.getMerkleRoot();

        pool.deposit{value: 1 ether}(bytes32(uint256(2)));

        // Both old roots should still be valid
        assertTrue(pool.isKnownRoot(initialRoot));
        assertTrue(pool.isKnownRoot(root1));
    }

    // ---- Fuzz Tests ----

    function testFuzz_deposit_any_amount(uint256 amount) public {
        vm.assume(amount > 0 && amount < 100 ether);
        vm.deal(address(this), amount);
        bytes32 commitment = bytes32(uint256(keccak256(abi.encode(amount))));
        pool.deposit{value: amount}(commitment);
        assertEq(pool.getNextLeafIndex(), 1);
    }

    receive() external payable {}
}
