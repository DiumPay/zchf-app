import { parseAbi } from "viem";

export const POSITION_V2_ABI = parseAbi([
    // Static / immutable
    "function collateral() view returns (address)",
    "function original() view returns (address)",
    "function limit() view returns (uint256)",
    "function minimumCollateral() view returns (uint256)",
    "function expiration() view returns (uint40)",
    "function start() view returns (uint40)",
    "function challengePeriod() view returns (uint40)",
    "function riskPremiumPPM() view returns (uint24)",
    "function reserveContribution() view returns (uint24)",

    // Mutable / live
    "function price() view returns (uint256)",
    "function minted() view returns (uint256)",
    "function availableForMinting() view returns (uint256)",
    "function availableForClones() view returns (uint256)",
    "function cooldown() view returns (uint40)",
    "function challengedAmount() view returns (uint256)",
    "function isClosed() view returns (bool)",
    "function annualInterestPPM() view returns (uint24)",
    "function calculateCurrentFee() view returns (uint24)",
    "function owner() view returns (address)",
]);