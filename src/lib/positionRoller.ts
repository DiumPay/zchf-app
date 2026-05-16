// Position roller helpers for V2 → V2 refinancing.
//
// Flow:
//   1. findRollTargets(source)        → list of candidate positions
//   2. previewRoll(source, target)    → expected mint, missing funds (if any)
//   3. approveCollateralForRoller(...) → one-time ERC20 approval
//   4. executeRollFully(source, target) → flash-mint atomic swap
//
// All writes pin chain: mainnet for the same safety-net reason borrowActions.ts
// describes. The page is responsible for prompting a network switch.

import {
    erc20Abi, maxUint256, parseEventLogs,
    type Address, type WalletClient, type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { POSITION_ROLLER_V2_ABI } from "@abi/positionRoller";
import { POSITION_V2_ABI } from "@abi/position";
import { ADDRESSES } from "@config/addresses";
import { getPublicClient } from "@lib/client";

// dev → local grenadier. prod → deployed grenadier behind cf.
const API_BASE = import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://grenadier.frankencoin.win";

// ============================================================================
// TYPES
// ============================================================================

interface ApiPosition {
    version: number;
    position: Address;
    owner: Address;
    collateral: Address;
    collateralSymbol: string;
    collateralName: string;
    collateralDecimals: number;
    price: string;
    minted: string;
    collateralBalance: string;
    expiration: number;
    cooldown: number;
    closed: boolean;
    denied: boolean;
    annualInterestPPM: number;
    reserveContribution: number;
    availableForClones: string;
    availableForMinting: string;
}

/** Subset of source-position fields the roller needs. Matches MyPositionDetail
 *  so callers can pass either directly. */
export interface RollerSource {
    address: Address;
    collateral: Address;
    collateralSymbol: string;
    collateralDecimals: number;
    minted: bigint;
    collateralBalance: bigint;
    reserveContribution: number;
    expiration: number;
    owner?: Address; // optional; only used for merge-vs-roll label
}

/** A candidate target position the user can roll into. */
export interface RollTarget {
    address: Address;
    owner: Address;
    collateral: Address;
    collateralSymbol: string;
    collateralDecimals: number;
    price: bigint;                  // liquidation price, 36 - decimals digits
    annualInterestPPM: number;
    reserveContribution: number;
    expiration: number;
    cooldown: number;
    availableForClones: bigint;
    /** True when target.owner === source.owner — UI shows "Merge" instead of "Roll". */
    isOwnedBySource: boolean;
}

/** Output of previewRoll — drives the UI before the user signs. */
export interface RollPreview {
    /** ZCHF that must be repaid to fully clear the source position. */
    repayAmount: bigint;
    /** ZCHF that must be minted from the target to deliver `repayAmount` after the target's upfront fee. */
    mintAmount: bigint;
    /** Collateral chunk that has to back the new mint at the target's liq price. */
    requiredCollateral: bigint;
    /** Collateral available from the source position. */
    availableCollateral: bigint;
    /** If the source's collateral can't support the mint at target price, the user fronts the difference in ZCHF. */
    missingFunds: bigint;
    /** Target cooldown is in the future — roll will revert. */
    cooldownBlocking: boolean;
    /** Convenience: roller will revert if missing funds exceed the user's ZCHF balance. */
    sufficientForRoll: (userZchfBalance: bigint) => boolean;
}

// ============================================================================
// TARGET DISCOVERY
// ============================================================================

/**
 * Fetch all V2 positions from grenadier and filter to viable roll targets:
 *   - same collateral token
 *   - longer expiration than source (excludes source itself)
 *   - not closed, not denied
 *   - has enough headroom in availableForClones to absorb source's debt
 *
 * Active-challenge filtering happens via grenadier's challenge index if you
 * wire that in later. For now we accept that an active challenge on a target
 * makes the roll revert at signing time — the contract enforces this.
 */
export async function findRollTargets(source: RollerSource): Promise<RollTarget[]> {
    const res = await fetch(`${API_BASE}/positions`, {
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`positions API ${res.status}`);
    const json = (await res.json()) as { list: ApiPosition[] };

    const sourceColl = source.collateral.toLowerCase();
    const sourceAddr = source.address.toLowerCase();
    const sourceOwner = source.owner?.toLowerCase();

    const targets: RollTarget[] = [];
    for (const p of json.list ?? []) {
        if (p.version !== 2) continue;
        if (p.closed || p.denied) continue;
        if (p.position.toLowerCase() === sourceAddr) continue;
        if (p.collateral.toLowerCase() !== sourceColl) continue;
        if (p.expiration <= source.expiration) continue;

        // Headroom check: target must accept at least the source's current debt.
        const available = BigInt(p.availableForClones ?? "0");
        if (available <= source.minted) continue;

        targets.push({
            address: p.position,
            owner: p.owner,
            collateral: p.collateral,
            collateralSymbol: p.collateralSymbol,
            collateralDecimals: p.collateralDecimals,
            price: BigInt(p.price),
            annualInterestPPM: p.annualInterestPPM,
            reserveContribution: p.reserveContribution,
            expiration: p.expiration,
            cooldown: p.cooldown,
            availableForClones: available,
            isOwnedBySource: sourceOwner ? p.owner.toLowerCase() === sourceOwner : false,
        });
    }
    return targets;
}

// ============================================================================
// PREVIEW MATH
// ============================================================================

const ONE_E18 = 10n ** 18n;

/**
 * Computes the same numbers the on-chain rollFully() will use, so the UI can
 * show "missing funds" and disable the button when the user's ZCHF balance
 * isn't enough.
 *
 * Math mirrors PositionRoller.rollFullyWithExpiration:
 *   repay         = source.minted * (1e6 - source.reserveContribution) / 1e6
 *   mintAmount    = target.getMintAmount(repay)         // on-chain
 *   maxByCollat   = source.collateralBalance * target.price / 1e18
 *   missingFunds  = max(0, mintAmount - maxByCollat)    // user pays in ZCHF
 *
 * When missingFunds > 0 the contract caps mintAmount to maxByCollat and pulls
 * the shortfall from the caller's wallet via the flash-mint accounting.
 */
export async function previewRoll(
    source: RollerSource,
    target: RollTarget,
): Promise<RollPreview> {
    // Zero-debt positions don't roll — there's nothing to refinance. The
    // caller should hide the roller UI when source.minted === 0n, but we
    // short-circuit here too so we don't waste two read calls.
    if (source.minted === 0n) {
        return {
            repayAmount: 0n,
            mintAmount: 0n,
            requiredCollateral: 0n,
            availableCollateral: source.collateralBalance,
            missingFunds: 0n,
            cooldownBlocking: target.cooldown * 1000 > Date.now(),
            sufficientForRoll: () => true,
        };
    }

    const client = getPublicClient("ethereum");

    // 1. How much ZCHF must we repay to clear the source debt?
    //    findRepaymentAmount does the binary search the contract uses internally.
    const repayAmount = await client.readContract({
        address: ADDRESSES.ethereum.positionRollerV2!,
        abi: POSITION_ROLLER_V2_ABI,
        functionName: "findRepaymentAmount",
        args: [source.address],
    });

    // 2. How much must the target mint to deliver `repayAmount` after its fees?
    const mintAmount = await client.readContract({
        address: target.address,
        abi: POSITION_V2_ABI,
        functionName: "getMintAmount",
        args: [repayAmount],
    });

    // 3. Can source's collateral support that mint at the target's liq price?
    const requiredCollateral = (mintAmount * ONE_E18 + target.price - 1n) / target.price;
    const maxMintByCollateral = (source.collateralBalance * target.price) / ONE_E18;
    const missingFunds =
        mintAmount > maxMintByCollateral ? mintAmount - maxMintByCollateral : 0n;

    const cooldownBlocking = target.cooldown * 1000 > Date.now();

    return {
        repayAmount,
        mintAmount,
        requiredCollateral,
        availableCollateral: source.collateralBalance,
        missingFunds,
        cooldownBlocking,
        sufficientForRoll: (userBal: bigint) => userBal >= missingFunds,
    };
}

// ============================================================================
// APPROVALS
// ============================================================================

export async function getRollerAllowance(
    client: PublicClient,
    collateral: Address,
    owner: Address,
): Promise<bigint> {
    return await client.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, ADDRESSES.ethereum.positionRollerV2!],
    });
}

/**
 * Approve the source position's collateral to the roller. Required before
 * executeRollFully — the roller pulls collateral from the user's wallet
 * during the atomic flash-mint sequence (even when re-depositing it into
 * the target, the path goes through msg.sender).
 *
 * Approval is maxUint256 so subsequent rolls on the same collateral don't
 * re-prompt.
 */
export async function approveCollateralForRoller(
    walletClient: WalletClient,
    publicClient: PublicClient,
    collateral: Address,
    account: Address,
): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "approve",
        args: [ADDRESSES.ethereum.positionRollerV2!, maxUint256],
        account,
        chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

// ============================================================================
// EXECUTE
// ============================================================================

export interface RollResult {
    hash: `0x${string}`;
    /** Final target — when the contract clones a fresh position (different
     *  expiration or different owner), this is the new clone address parsed
     *  from the Roll event. When merging into an existing target, this is
     *  just the input target address. */
    target: Address;
    /** True when the contract took the merge path (target owned by caller
     *  with matching expiration). */
    merged: boolean;
}

/**
 * rollFully(source, target). Behavior depends on target ownership and expiration:
 *   - target owned by caller + matching expiration → merges debt+collateral in
 *   - otherwise → clones the target with the caller as new owner; the returned
 *     `target` is that fresh clone, not the input.
 *
 * Pre-conditions (caller must satisfy):
 *   - Source's collateral approved to the roller (approveCollateralForRoller)
 *   - User has at least `preview.missingFunds` ZCHF in wallet
 *   - Wallet is on mainnet
 */
export async function executeRollFully(
    walletClient: WalletClient,
    publicClient: PublicClient,
    args: {
        source: Address;
        target: Address;
        account: Address;
    },
): Promise<RollResult> {
    const hash = await walletClient.writeContract({
        address: ADDRESSES.ethereum.positionRollerV2!,
        abi: POSITION_ROLLER_V2_ABI,
        functionName: "rollFully",
        args: [args.source, args.target],
        account: args.account,
        chain: mainnet,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Decode the Roll event to find the actual target address (clone path
    // replaces it with a fresh address).
    let finalTarget = args.target;
    try {
        const events = parseEventLogs({
            abi: POSITION_ROLLER_V2_ABI,
            eventName: "Roll",
            logs: receipt.logs as any,
        });
        if (events.length > 0) {
            const e = events[0] as any;
            if (e.args?.target) finalTarget = e.args.target as Address;
        }
    } catch {
        // Best-effort; if parsing fails we return the input target.
    }

    const merged = finalTarget.toLowerCase() === args.target.toLowerCase();
    return { hash, target: finalTarget, merged };
}