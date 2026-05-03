import { parseAbi } from "viem";

/**
 * CloneHelper bundles MintingHubV2.clone() + Position.adjustPrice() in one tx.
 * Used when the user wants a different liquidation price than the parent.
 *
 */
export const CLONE_HELPER_ABI = parseAbi([
    "function cloneWithPrice(address parent, uint256 initialCollateral, uint256 initialMint, uint40 expiration, uint256 newPrice) external returns (address pos)",
    // Reads — exposed so callers can verify the helper is wired to the expected hub
    "function HUB() view returns (address)",
]);