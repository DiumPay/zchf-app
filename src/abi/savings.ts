import { parseAbi } from "viem";

export const SAVINGS_ABI = parseAbi([
    "function currentRatePPM() view returns (uint24)",
    "function nextRatePPM() view returns (uint24)",
    "function nextChange() view returns (uint40)",
    "function INTEREST_DELAY() view returns (uint64)",
    "function currentTicks() view returns (uint64)",
    "function savings(address) view returns (uint192 saved, uint64 ticks, address referrer, uint32 referralFeePPM)",
    "function accruedInterest(address) view returns (uint192)",
    "function save(uint192 amount)",
    "function withdraw(address target, uint192 amount) returns (uint256)",
    "function adjust(uint192 targetAmount)",
    "function refreshBalance(address owner) returns (uint192)",
    // Governance: propose a new leadrate. `helpers` is a delegation chain
    // proving caller meets the 2% veto threshold. The new rate enters a
    // 7-day veto window; if no counter-proposal arrives by `nextChange`,
    // anyone can call applyChange().
    "function proposeChange(uint24 newRatePPM, address[] helpers)",
    "function applyChange()",
]);