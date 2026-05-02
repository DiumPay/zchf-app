import { erc20Abi, type Address, zeroAddress } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI } from "@abi/position";
import { ADDRESSES } from "@config/addresses";
import snapshot from "@data/positions-snapshot.json";

export interface PositionStaticDetail {
    address: Address;
    original: Address;
    isOriginal: boolean;
    collateral: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    limit: bigint;
    minimumCollateral: bigint;
    expiration: number;
    start: number;
    challengePeriod: number;
    riskPremiumPPM: number;
    reserveContribution: number;
}

export interface PositionLiveDetail {
    price: bigint;                 // liq price scaled to (36 - collDec)
    minted: bigint;
    availableForClones: bigint;
    cooldown: number;
    challengedAmount: bigint;
    isClosed: boolean;
    annualInterestPPM: number;     // includes leadrate already
    userBalance: bigint;
    allowanceHub: bigint;          // collateral allowance for mintingHubV2
    allowanceHelper: bigint;       // collateral allowance for cloneHelper
}

export type PositionDetail = PositionStaticDetail & PositionLiveDetail;

/** Look up a position from the static snapshot by address (case-insensitive). */
export function findStaticPosition(address: string): PositionStaticDetail | null {
    const target = address.toLowerCase();
    const found = snapshot.positions.find(p => p.address.toLowerCase() === target);
    if (!found) return null;
    return {
        ...found,
        address: found.address as Address,
        original: found.original as Address,
        collateral: found.collateral as Address,
        limit: BigInt(found.limit),
        minimumCollateral: BigInt(found.minimumCollateral),
    };
}

/** Single multicall: position state + collateral state for the user. */
export async function loadPositionDetail(
    p: PositionStaticDetail,
    user: Address | null
): Promise<PositionDetail> {
    const client = getPublicClient("ethereum");
    const userAddr = user ?? zeroAddress;

    const calls = [
        // Position state (7)
        { address: p.address, abi: POSITION_V2_ABI, functionName: "price" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "minted" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "availableForClones" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "cooldown" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "challengedAmount" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "isClosed" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "annualInterestPPM" as const },
        // User collateral state (3)
        { address: p.collateral, abi: erc20Abi, functionName: "balanceOf" as const, args: [userAddr] as const },
        { address: p.collateral, abi: erc20Abi, functionName: "allowance" as const, args: [userAddr, ADDRESSES.ethereum.mintingHubV2] as const },
        { address: p.collateral, abi: erc20Abi, functionName: "allowance" as const, args: [userAddr, ADDRESSES.ethereum.cloneHelper] as const },
    ];

    const r = await client.multicall({ contracts: calls, allowFailure: false });

    return {
        ...p,
        price: r[0] as bigint,
        minted: r[1] as bigint,
        availableForClones: r[2] as bigint,
        cooldown: Number(r[3]),
        challengedAmount: r[4] as bigint,
        isClosed: r[5] as boolean,
        annualInterestPPM: Number(r[6]),
        userBalance: r[7] as bigint,
        allowanceHub: r[8] as bigint,
        allowanceHelper: r[9] as bigint,
    };
}

/** ZCHF per 1 unit collateral, as a regular number (UI math only). */
export function liqPriceUnits(p: { price: bigint; collateralDecimals: number }): number {
    return Number(p.price) / Math.pow(10, 36 - p.collateralDecimals);
}

/** Status for badge rendering. */
export function detailStatus(p: PositionDetail): "active" | "cooldown" | "challenged" | "closed" | "expired" | "pending" {
    if (p.isClosed) return "closed";
    if (p.expiration * 1000 < Date.now()) return "expired";
    if (p.challengedAmount > 0n) return "challenged";
    if (p.start * 1000 > Date.now()) return "pending";
    if (p.cooldown * 1000 > Date.now()) return "cooldown";
    return "active";
}

/* ================================================================== */
/* Pure math — runs on every keystroke. All bigint, no async.          */
/* ================================================================== */

/** Required collateral (rounded up) for a chosen mint at a chosen price. */
export function requiredCollateral(mintAmount: bigint, price: bigint): bigint {
    if (price === 0n) return 0n;
    return (mintAmount * 10n ** 18n + price - 1n) / price;
}

/** Max mintable for a chosen collateral at a chosen price. */
export function maxMintFor(collAmount: bigint, price: bigint): bigint {
    return (collAmount * price) / 10n ** 18n;
}

/** Reserve contribution withheld from mint (in ZCHF). */
export function reserveAmount(mintAmount: bigint, reserveContributionPPM: number): bigint {
    return (mintAmount * BigInt(reserveContributionPPM)) / 1_000_000n;
}

/** Upfront interest fee. Linear in time-to-expiration. */
export function upfrontFee(
    mintAmount: bigint,
    annualInterestPPM: number,
    secondsToExpiry: number
): bigint {
    if (secondsToExpiry <= 0) return 0n;
    const YEAR = 365 * 24 * 60 * 60;
    return (mintAmount * BigInt(secondsToExpiry) * BigInt(annualInterestPPM))
        / (BigInt(YEAR) * 1_000_000n);
}

/** Effective annual interest rate (PPM) — accounts for reserve cut. */
export function effectiveInterestPPM(
    annualInterestPPM: number,
    reserveContributionPPM: number
): number {
    const r = reserveContributionPPM / 1_000_000;
    return Math.round(annualInterestPPM / (1 - r));
}

/** Final ZCHF actually transferred to the borrower's wallet. */
export function sentToWallet(
    mintAmount: bigint,
    reserveContributionPPM: number,
    annualInterestPPM: number,
    secondsToExpiry: number
): bigint {
    const reserve = reserveAmount(mintAmount, reserveContributionPPM);
    const fee = upfrontFee(mintAmount, annualInterestPPM, secondsToExpiry);
    if (mintAmount < reserve + fee) return 0n;
    return mintAmount - reserve - fee;
}