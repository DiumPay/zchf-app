import { parseAbi } from "viem";

/**
 * Frankencoin (ZCHF) ABI — only the non-ERC20 methods we actually call.
 * Standard ERC20 (transfer, balanceOf, allowance, approve) comes from viem's
 * erc20Abi.
 *
 * transferAndCall is the ERC-677 single-tx pattern. When called with the
 * Equity contract as target, it transfers ZCHF and triggers FPS minting in
 * one transaction — no allowance step.
 */
export const FRANKENCOIN_ABI = parseAbi([
    "function transferAndCall(address recipient, uint256 amount, bytes data) returns (bool)",
    "function equity() view returns (uint256)",
    "function minterReserve() view returns (uint256)",
    "function isMinter(address) view returns (bool)",
]);