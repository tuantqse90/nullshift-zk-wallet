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
        address uniswapRouter = vm.envAddress("UNISWAP_ROUTER_ADDRESS");

        vm.startBroadcast(deployerKey);

        // 1. Deploy verifiers (generated from Noir circuits via bb)
        DepositVerifier depositVerifier = new DepositVerifier();
        TransferVerifier transferVerifier = new TransferVerifier();
        WithdrawVerifier withdrawVerifier = new WithdrawVerifier();
        SwapVerifier swapVerifier = new SwapVerifier();

        console.log("DepositVerifier:", address(depositVerifier));
        console.log("TransferVerifier:", address(transferVerifier));
        console.log("WithdrawVerifier:", address(withdrawVerifier));
        console.log("SwapVerifier:", address(swapVerifier));

        // 2. Deploy ShieldedPool
        ShieldedPool pool = new ShieldedPool(
            address(transferVerifier),
            address(depositVerifier),
            address(withdrawVerifier)
        );
        console.log("ShieldedPool:", address(pool));

        // 3. Deploy Relayer
        Relayer relayer = new Relayer(
            address(pool),
            address(swapVerifier),
            uniswapRouter
        );
        console.log("Relayer:", address(relayer));

        vm.stopBroadcast();
    }
}
