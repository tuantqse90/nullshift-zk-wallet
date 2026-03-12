/**
 * NullShift — Hardhat Deploy Script for Sepolia
 *
 * Usage:
 *   npx hardhat run deploy/deploy-sepolia.ts --network sepolia
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY - Private key of deployer account
 *   SEPOLIA_RPC_URL      - Sepolia RPC endpoint
 *   ETHERSCAN_API_KEY    - For contract verification
 *   UNISWAP_ROUTER       - Uniswap V3 router address on Sepolia
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy Verifiers
  console.log("\n--- Deploying Verifiers ---");

  const DepositVerifier = await ethers.getContractFactory("DepositVerifier");
  const depositVerifier = await DepositVerifier.deploy();
  await depositVerifier.waitForDeployment();
  const depositAddr = await depositVerifier.getAddress();
  console.log("DepositVerifier:", depositAddr);

  const TransferVerifier = await ethers.getContractFactory("TransferVerifier");
  const transferVerifier = await TransferVerifier.deploy();
  await transferVerifier.waitForDeployment();
  const transferAddr = await transferVerifier.getAddress();
  console.log("TransferVerifier:", transferAddr);

  const WithdrawVerifier = await ethers.getContractFactory("WithdrawVerifier");
  const withdrawVerifier = await WithdrawVerifier.deploy();
  await withdrawVerifier.waitForDeployment();
  const withdrawAddr = await withdrawVerifier.getAddress();
  console.log("WithdrawVerifier:", withdrawAddr);

  const SwapVerifier = await ethers.getContractFactory("SwapVerifier");
  const swapVerifier = await SwapVerifier.deploy();
  await swapVerifier.waitForDeployment();
  const swapAddr = await swapVerifier.getAddress();
  console.log("SwapVerifier:", swapAddr);

  // 2. Deploy ShieldedPool
  console.log("\n--- Deploying ShieldedPool ---");
  const ShieldedPool = await ethers.getContractFactory("ShieldedPool");
  const pool = await ShieldedPool.deploy(transferAddr, depositAddr, withdrawAddr);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("ShieldedPool:", poolAddr);

  // 3. Deploy Relayer
  console.log("\n--- Deploying Relayer ---");
  const uniswapRouter = process.env.UNISWAP_ROUTER || "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // Sepolia V3 Router
  const Relayer = await ethers.getContractFactory("Relayer");
  const relayer = await Relayer.deploy(poolAddr, swapAddr, uniswapRouter);
  await relayer.waitForDeployment();
  const relayerAddr = await relayer.getAddress();
  console.log("Relayer:", relayerAddr);

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify({
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    contracts: {
      depositVerifier: depositAddr,
      transferVerifier: transferAddr,
      withdrawVerifier: withdrawAddr,
      swapVerifier: swapAddr,
      shieldedPool: poolAddr,
      relayer: relayerAddr,
    },
  }, null, 2));

  // Verification commands
  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network sepolia ${depositAddr}`);
  console.log(`npx hardhat verify --network sepolia ${transferAddr}`);
  console.log(`npx hardhat verify --network sepolia ${withdrawAddr}`);
  console.log(`npx hardhat verify --network sepolia ${swapAddr}`);
  console.log(`npx hardhat verify --network sepolia ${poolAddr} "${transferAddr}" "${depositAddr}" "${withdrawAddr}"`);
  console.log(`npx hardhat verify --network sepolia ${relayerAddr} "${poolAddr}" "${swapAddr}" "${uniswapRouter}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
