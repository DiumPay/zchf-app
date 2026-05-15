import { parseAbi } from "viem";

/**
 * StablecoinBridge 1:1 swap module. ZCHF and the source stablecoin trade
 * one-for-one (adjusted for decimal difference). The bridge expires after
 * 52 weeks from deployment.
 *
 * Source stablecoin → ZCHF: mint()
 * ZCHF → source stablecoin: burn()
 */
export const STABLECOIN_BRIDGE_ABI = parseAbi([
    // writes
    "function mint(uint256 amount)",
    "function burn(uint256 zchfAmount)",
    // reads
    "function minted() view returns (uint256)",
    "function limit() view returns (uint256)",
    "function horizon() view returns (uint256)",
    "function decimalMultiplier() view returns (uint256)",
    "function chf() view returns (address)",
    "function zchf() view returns (address)",
    // events
    "event Mint(address indexed target, uint256 amount)",
    "event Burn(address indexed zchfHolder, uint256 amount)",
]);