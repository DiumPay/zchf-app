import { parseAbi } from "viem";

/**
 * PositionRollerV2 atomically refinances debt from one V2 position into another
 * using a flash mint. The user only needs to approve the source position's
 * collateral token to the roller.
 *
 * Two outcomes:
 *   - Target owned by user with matching expiration → merge into existing
 *   - Otherwise → clone target with the user as new owner
 *
 * The roll() function takes 7 args and lets the caller pre-compute everything.
 * rollFully() is the convenience wrapper that derives all numbers from the
 * source position's current state — what users actually want.
 */
export const POSITION_ROLLER_V2_ABI = parseAbi([
    // Convenience: refinance everything from source into target.
    "function rollFully(address source, address target)",
    "function rollFullyWithExpiration(address source, address target, uint40 expiration)",

    // Read: how much ZCHF must be repaid to fully clear the source's debt.
    // Used for the "missing funds" preview before the user signs.
    "function findRepaymentAmount(address pos) view returns (uint256)",

    // Event emitted after a successful roll/merge.
    "event Roll(address source, uint256 collWithdraw, uint256 repay, address target, uint256 collDeposit, uint256 mint)",
]);