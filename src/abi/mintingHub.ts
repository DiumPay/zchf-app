import { parseAbi } from "viem";

export const MINTING_HUB_V2_ABI = parseAbi([
    "function clone(address parent, uint256 _initialCollateral, uint256 _initialMint, uint40 expiration) external returns (address)",
    "function clone(address owner, address parent, uint256 _initialCollateral, uint256 _initialMint, uint40 expiration) external returns (address)",
    "event PositionOpened(address indexed owner, address indexed position, address original, address collateral, uint256 price)",
]);