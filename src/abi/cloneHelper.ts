import { parseAbi } from "viem";

export const CLONE_HELPER_ABI = parseAbi([
    "function cloneWithPrice(address parent, uint256 initialCollateral, uint256 initialMint, uint40 expiration, uint256 newPrice) external returns (address)",
]);