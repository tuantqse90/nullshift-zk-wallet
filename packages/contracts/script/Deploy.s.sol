// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ShieldedPool} from "../src/ShieldedPool.sol";
import {Relayer} from "../src/Relayer.sol";
import {DepositVerifier} from "../src/verifiers/DepositVerifier.sol";
import {TransferVerifier} from "../src/verifiers/TransferVerifier.sol";
import {WithdrawVerifier} from "../src/verifiers/WithdrawVerifier.sol";
import {SwapVerifier} from "../src/verifiers/SwapVerifier.sol";

/// @title Deploy -- NullShift contract deployment script
/// @notice Deploy order: Verifiers -> ShieldedPool -> Relayer
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address uniswapRouter = vm.envOr("UNISWAP_ROUTER_ADDRESS", address(0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E));

        vm.startBroadcast(deployerKey);

        // 1. Deploy verifiers (generated from Noir circuits via bb)
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
            uniswapRouter
        );

        vm.stopBroadcast();

        // Output parseable addresses
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
