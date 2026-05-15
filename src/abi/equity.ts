import { parseAbi } from "viem";

/**
 * Equity (Frankencoin Pool Share / FPS).
 * The reserve pool share contract. ERC-20 with extra invest/redeem mechanics
 * driven by a cubic-root bonding curve.
 *
 *   Invest path: zchf.transferAndCall(equityAddr, amount, "")
 *     → no allowance needed (hardcoded in Frankencoin), triggers
 *       Equity.onTokenTransfer which mints FPS to the sender.
 *   Direct invest: invest(amount, expectedShares) — requires ZCHF approval to
 *     this contract first. Use transferAndCall instead for 1-tx UX.
 *
 *   Redeem: redeemExpected(target, shares, expectedProceeds) — slippage-
 *     protected. Requires holding-period average ≥ 90 days.
 */
export const EQUITY_ABI = parseAbi([
    // ERC-20 reads we care about
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",

    // Pool share economics
    "function price() view returns (uint256)",
    "function calculateShares(uint256 investment) view returns (uint256)",
    "function calculateProceeds(uint256 shares) view returns (uint256)",
    "function canRedeem(address owner) view returns (bool)",
    "function holdingDuration(address holder) view returns (uint256)",
    "function votes(address holder) view returns (uint256)",
    "function totalVotes() view returns (uint256)",
    "function relativeVotes(address holder) view returns (uint256)",

    // Writes
    "function invest(uint256 amount, uint256 expectedShares) returns (uint256)",
    "function redeem(address target, uint256 shares) returns (uint256)",
    "function redeemExpected(address target, uint256 shares, uint256 expectedProceeds) returns (uint256)",

    // Events
    "event Trade(address who, int256 amount, uint256 totPrice, uint256 newprice)",
    "event Delegation(address indexed from, address indexed to)",
]);