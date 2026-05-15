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
    // Governance: propose a new minting module. Costs MIN_APPLICATION_FEE
    // ZCHF (1000 by default), opens a veto window of `applicationPeriod`
    // seconds. Anyone holding 2% of FPS votes (alone or via helpers) can
    // call denyMinter() during that window.
    "function suggestMinter(address minter, uint256 applicationPeriod, uint256 applicationFee, string message)",
    // Veto a pending minter. Helpers chain must add up to ≥2% of FPS votes.
    "function denyMinter(address minter, address[] helpers, string message)",
    "function MIN_APPLICATION_PERIOD() view returns (uint256)",
    "function MIN_FEE() view returns (uint256)",
]);