import { type Address } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI as PositionV2ABI } from "@abi/position";

/**
 * Read-side helpers for the CloneHelper write path. Pure preview math + input
 * validation. The actual write lives in borrowActions.executeCloneWithPrice.
 */

export const PPM = 1_000_000n;
export const ONE_ZCHF = 10n ** 18n;
export const PRICE_RAISE_COOLDOWN_SECONDS = 3 * 24 * 60 * 60;
export const OPEN_POSITION_MIN_VALUE_ZCHF = 5000n * ONE_ZCHF;

export interface CloneParentInfo {
    address: Address;
    price: bigint;
    minimumCollateral: bigint;
    collateralDecimals: number;
    reserveContribution: number;
    annualInterestPPM: number;
    expiration: number;
    availableForClones: bigint;
}

export interface CloneInputs {
    collateralAmount: bigint;
    mintAmount: bigint;
    expiration: number;
    newPrice: bigint;
}

export interface ClonePreview {
    triggersCooldown: boolean;
    cooldownSeconds: number;
    effectivePrice: bigint;
    mintLimitNow: bigint;
    mintLimitAfterCooldown: bigint;
    additionalMintable: bigint;
    mintEffectiveNow: bigint;
    reserveAmount: bigint;
    upfrontInterest: bigint;
    netToWallet: bigint;
    effectiveAnnualRate: number;
}

export interface ValidationIssue {
    field: "collateralAmount" | "mintAmount" | "expiration" | "newPrice";
    code: string;
    message: string;
}

export function validateCloneInputs(
    parent: CloneParentInfo,
    inputs: CloneInputs,
    nowSeconds: number = Math.floor(Date.now() / 1000),
): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (inputs.collateralAmount < parent.minimumCollateral) {
        issues.push({
            field: "collateralAmount",
            code: "below_minimum",
            message: `Collateral below minimum (${parent.minimumCollateral} raw units required).`,
        });
    }

    if (inputs.expiration <= nowSeconds) {
        issues.push({
            field: "expiration",
            code: "expiration_past",
            message: "Expiration must be in the future.",
        });
    }
    if (inputs.expiration > parent.expiration) {
        issues.push({
            field: "expiration",
            code: "expiration_after_parent",
            message: "Expiration cannot exceed the parent position's expiration.",
        });
    }

    if (inputs.newPrice <= 0n) {
        issues.push({
            field: "newPrice",
            code: "price_zero",
            message: "Liquidation price must be greater than zero.",
        });
    }

    // Initial mint runs BEFORE adjustPrice, so capacity is bounded by min(newPrice, parent.price).
    const effectivePrice = inputs.newPrice < parent.price ? inputs.newPrice : parent.price;
    const collValueZchf = (inputs.collateralAmount * effectivePrice) / ONE_ZCHF;
    const cap = collValueZchf < parent.availableForClones ? collValueZchf : parent.availableForClones;

    if (inputs.mintAmount > cap) {
        issues.push({
            field: "mintAmount",
            code: "exceeds_capacity",
            message: `Mint exceeds capacity (${cap} ZCHF max in this tx).`,
        });
    }

    return issues;
}

export function previewCloneWithPrice(
    parent: CloneParentInfo,
    inputs: CloneInputs,
    nowSeconds: number = Math.floor(Date.now() / 1000),
): ClonePreview {
    const triggersCooldown = inputs.newPrice > parent.price;
    const cooldownSeconds = triggersCooldown ? PRICE_RAISE_COOLDOWN_SECONDS : 0;

    // The on-chain mint runs before adjustPrice, so it's bounded by parent.price.
    // Post-cooldown, the clone's own price applies to further mints.
    const effectivePrice = inputs.newPrice < parent.price ? inputs.newPrice : parent.price;
    const valueAtEffective = (inputs.collateralAmount * effectivePrice) / ONE_ZCHF;
    const valueAtNew = (inputs.collateralAmount * inputs.newPrice) / ONE_ZCHF;

    const mintLimitNow = valueAtEffective < parent.availableForClones ? valueAtEffective : parent.availableForClones;
    const mintLimitAfterCooldown = valueAtNew < parent.availableForClones ? valueAtNew : parent.availableForClones;
    const additionalMintable = triggersCooldown && mintLimitAfterCooldown > mintLimitNow
        ? mintLimitAfterCooldown - mintLimitNow
        : 0n;

    const mintEffectiveNow = inputs.mintAmount < mintLimitNow ? inputs.mintAmount : mintLimitNow;

    const reserveAmount = (mintEffectiveNow * BigInt(parent.reserveContribution)) / PPM;

    // Mirrors PositionV2.calculateFee: feePPM = timePassed * annualInterestPPM / 365 days, capped at 100%.
    const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;
    const timePassed = BigInt(Math.max(0, inputs.expiration - nowSeconds));
    let feePPM = (timePassed * BigInt(parent.annualInterestPPM)) / SECONDS_PER_YEAR;
    if (feePPM > PPM) feePPM = PPM;
    const upfrontInterest = (mintEffectiveNow * feePPM) / PPM;

    let netToWallet = mintEffectiveNow - reserveAmount - upfrontInterest;
    if (netToWallet < 0n) netToWallet = 0n;

    // annualInterestPPM is rate-on-gross-mint; users see rate-on-received, so scale by 1/(1-reserve).
    const reserveFraction = parent.reserveContribution / 1_000_000;
    const grossRate = parent.annualInterestPPM / 1_000_000;
    const effectiveAnnualRate = reserveFraction < 1 ? grossRate / (1 - reserveFraction) : Infinity;

    return {
        triggersCooldown,
        cooldownSeconds,
        effectivePrice,
        mintLimitNow,
        mintLimitAfterCooldown,
        additionalMintable,
        mintEffectiveNow,
        reserveAmount,
        upfrontInterest,
        netToWallet,
        effectiveAnnualRate,
    };
}

export async function fetchParentForClone(parent: Address): Promise<CloneParentInfo> {
    const client = getPublicClient("ethereum");

    const calls = [
        { address: parent, abi: PositionV2ABI, functionName: "price" as const },
        { address: parent, abi: PositionV2ABI, functionName: "minimumCollateral" as const },
        { address: parent, abi: PositionV2ABI, functionName: "collateral" as const },
        { address: parent, abi: PositionV2ABI, functionName: "reserveContribution" as const },
        { address: parent, abi: PositionV2ABI, functionName: "annualInterestPPM" as const },
        { address: parent, abi: PositionV2ABI, functionName: "expiration" as const },
        { address: parent, abi: PositionV2ABI, functionName: "availableForClones" as const },
    ];
    const results = await client.multicall({ contracts: calls, allowFailure: false });

    const collateralAddress = results[2] as Address;
    const decimals = await client.readContract({
        address: collateralAddress,
        abi: [{ type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] }] as const,
        functionName: "decimals",
    });

    return {
        address: parent,
        price: results[0] as bigint,
        minimumCollateral: results[1] as bigint,
        collateralDecimals: Number(decimals),
        reserveContribution: Number(results[3]),
        annualInterestPPM: Number(results[4]),
        expiration: Number(results[5]),
        availableForClones: results[6] as bigint,
    };
}