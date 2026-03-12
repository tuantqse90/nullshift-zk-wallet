// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVerifier} from "./interfaces/IVerifier.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {ShieldedPool} from "./ShieldedPool.sol";

/// @title Relayer — Anonymous swap executor for NullShift
/// @notice Executes DEX swaps on behalf of users without revealing their identity
/// @dev The ZK proof binds swap output to the user's key — relayer cannot steal funds
contract Relayer {
    // ── Errors ──────────────────────────────────────────
    error InvalidProof();
    error SwapFailed();
    error InvalidParams();
    error InsufficientOutput();

    // ── Events ──────────────────────────────────────────
    event SwapExecuted(
        bytes32 indexed nullifier,
        uint256 timestamp
    );

    // ── Constants ────────────────────────────────────────
    address constant NATIVE_ETH = address(0);
    uint24 constant DEFAULT_POOL_FEE = 3000; // 0.3% Uniswap V3 fee tier

    // ── State ───────────────────────────────────────────

    ShieldedPool public immutable pool;
    IVerifier public immutable swapVerifier;
    ISwapRouter public immutable swapRouter;

    /// @notice Reentrancy guard
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "ReentrancyGuard: reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    // ── Structs ─────────────────────────────────────────

    struct SwapParams {
        bytes32 nullifier;
        bytes32 swapCommitment;
        bytes32 changeCommitment;
        bytes32 outputCommitment;
        address tokenIn;
        address tokenOut;
        uint256 swapAmount;
        uint256 minOutputAmount;
        uint256 relayerFee;
        bytes32 root;
    }

    // ── Constructor ─────────────────────────────────────

    constructor(address _pool, address _swapVerifier, address _swapRouter) {
        pool = ShieldedPool(payable(_pool));
        swapVerifier = IVerifier(_swapVerifier);
        swapRouter = ISwapRouter(_swapRouter);
    }

    // ── Execute Swap ────────────────────────────────────

    /// @notice Execute an anonymous swap on behalf of a user
    /// @param proof The ZK proof authorizing the swap
    /// @param params The swap parameters (bound by the proof)
    function executeSwap(
        bytes calldata proof,
        SwapParams calldata params
    ) external nonReentrant {
        if (params.swapAmount == 0) revert InvalidParams();

        // 1. Verify the ZK proof
        bytes32[] memory publicInputs = new bytes32[](6);
        publicInputs[0] = params.root;
        publicInputs[1] = params.nullifier;
        publicInputs[2] = params.swapCommitment;
        publicInputs[3] = params.changeCommitment;
        publicInputs[4] = bytes32(uint256(uint160(msg.sender)));
        publicInputs[5] = bytes32(params.relayerFee);

        if (!swapVerifier.verify(proof, publicInputs)) revert InvalidProof();

        // 2. Execute swap on Uniswap V3
        uint256 amountOut = _executeSwap(
            params.tokenIn,
            params.tokenOut,
            params.swapAmount,
            params.minOutputAmount
        );

        // 3. Re-shield output: deposit swap result as new commitment in the pool
        if (params.outputCommitment != bytes32(0)) {
            if (params.tokenOut == NATIVE_ETH) {
                pool.deposit{value: amountOut}(params.outputCommitment);
            } else {
                IERC20(params.tokenOut).approve(address(pool), amountOut);
                pool.deposit(params.outputCommitment);
            }
        }

        // 4. Insert change commitment into the pool (for leftover input)
        if (params.changeCommitment != bytes32(0)) {
            pool.deposit{value: 0}(params.changeCommitment);
        }

        // 5. Transfer relayer fee
        if (params.relayerFee > 0) {
            (bool success,) = msg.sender.call{value: params.relayerFee}("");
            if (!success) revert SwapFailed();
        }

        emit SwapExecuted(params.nullifier, block.timestamp);
    }

    // ── Internal ────────────────────────────────────────

    /// @dev Execute the actual token swap via Uniswap V3 Router
    function _executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        if (tokenIn == NATIVE_ETH) {
            // ETH → Token: send ETH with the call
            amountOut = swapRouter.exactInputSingle{value: amountIn}(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // WETH
                    tokenOut: tokenOut,
                    fee: DEFAULT_POOL_FEE,
                    recipient: address(this),
                    amountIn: amountIn,
                    amountOutMinimum: minAmountOut,
                    sqrtPriceLimitX96: 0
                })
            );
        } else if (tokenOut == NATIVE_ETH) {
            // Token → ETH
            IERC20(tokenIn).approve(address(swapRouter), amountIn);
            amountOut = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // WETH
                    fee: DEFAULT_POOL_FEE,
                    recipient: address(this),
                    amountIn: amountIn,
                    amountOutMinimum: minAmountOut,
                    sqrtPriceLimitX96: 0
                })
            );
        } else {
            // Token → Token
            IERC20(tokenIn).approve(address(swapRouter), amountIn);
            amountOut = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: DEFAULT_POOL_FEE,
                    recipient: address(this),
                    amountIn: amountIn,
                    amountOutMinimum: minAmountOut,
                    sqrtPriceLimitX96: 0
                })
            );
        }

        if (amountOut < minAmountOut) revert InsufficientOutput();
    }

    /// @notice Allow contract to receive ETH (for swap outputs)
    receive() external payable {}
}
