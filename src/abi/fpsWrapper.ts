import { parseAbi } from "viem";

/**
 * FPSWrapper (WFPS) — wraps FPS 1:1.
 *
 * Why wrap:
 *   - WFPS transfers don't reset the underlying FPS's holding-duration anchor.
 *     The wrapper contract holds the FPS continuously; users move WFPS around.
 *   - WFPS can be listed on DEXs without disrupting per-holder holding times.
 *   - `unwrapAndSell` lets a user redeem in one tx without personally holding
 *     90 days — only works if the wrapper itself has held long enough.
 */
export const FPS_WRAPPER_ABI = parseAbi([
    // ERC-20
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",

    // Wrapper plumbing
    "function underlying() view returns (address)",

    // Writes
    "function wrap(uint256 amount)",
    "function unwrap(uint256 amount)",
    "function depositFor(address account, uint256 amount) returns (bool)",
    "function withdrawTo(address account, uint256 amount) returns (bool)",
    "function unwrapAndSell(uint256 amount)",
]);