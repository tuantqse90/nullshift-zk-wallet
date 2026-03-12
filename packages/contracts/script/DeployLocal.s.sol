// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ShieldedPool} from "../src/ShieldedPool.sol";
import {Relayer} from "../src/Relayer.sol";
import {DepositVerifier} from "../src/verifiers/DepositVerifier.sol";
import {TransferVerifier} from "../src/verifiers/TransferVerifier.sol";
import {WithdrawVerifier} from "../src/verifiers/WithdrawVerifier.sol";
import {SwapVerifier} from "../src/verifiers/SwapVerifier.sol";

/// @title DeployLocal -- Deploy all NullShift contracts to Anvil local chain
/// @notice Uses default Anvil account (no env vars needed)
contract DeployLocal is Script {
    // Anvil default account #0 private key
    uint256 constant ANVIL_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    // Placeholder for Uniswap router (not available on local)
    address constant MOCK_ROUTER = address(0xdead);

    function run() external {
        vm.startBroadcast(ANVIL_KEY);

        // 1. Deploy verifiers
        DepositVerifier depositVerifier = new DepositVerifier();
        TransferVerifier transferVerifier = new TransferVerifier();
        WithdrawVerifier withdrawVerifier = new WithdrawVerifier();
        SwapVerifier swapVerifier = new SwapVerifier();

        // 2. Deploy ShieldedPool
        ShieldedPool pool = new ShieldedPool(
            address(transferVerifier),
            address(depositVerifier),
            address(withdrawVerifier)
        );

        // 3. Deploy Relayer
        Relayer relayer = new Relayer(
            address(pool),
            address(swapVerifier),
            MOCK_ROUTER
        );

        vm.stopBroadcast();

        // Print addresses in JSON-parseable format
        console.log("--- DEPLOYMENT ADDRESSES ---");
        console.log("DEPOSIT_VERIFIER=%s", address(depositVerifier));
        console.log("TRANSFER_VERIFIER=%s", address(transferVerifier));
        console.log("WITHDRAW_VERIFIER=%s", address(withdrawVerifier));
        console.log("SWAP_VERIFIER=%s", address(swapVerifier));
        console.log("SHIELDED_POOL=%s", address(pool));
        console.log("RELAYER=%s", address(relayer));
        console.log("----------------------------");
    }
}
