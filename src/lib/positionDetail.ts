import { erc20Abi, isAddress, type Address, zeroAddress } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI } from "@abi/position";
import { ADDRESSES } from "@config/addresses";

const API_BASE = "https://api.frankencoin.com";
const POSITIONS_URL = `${API_BASE}/positions/open`;

interface ApiPosition {
    version: number;
    position: Address;
    owner: Address;
    collateral: Address;
    price: string;
    isOriginal: boolean;
    isClone: boolean;
    denied: boolean;
    closed: boolean;
    original: Address;
    parent: Address;
    minimumCollateral: string;
    annualInterestPPM: number;
    riskPremiumPPM: number;
    reserveContribution: number;
    start: number;
    cooldown: number;
    expiration: number;
    challengePeriod: number;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    collateralBalance: string;
    limitForPosition: string;
    availableForClones: string;
    availableForMinting: string;
    minted: string;
}

interface ApiResponse {
    num: number;
    addresses: Address[];
    map: Record<string, ApiPosition>;
}

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
    price: bigint;
    minted: bigint;
    availableForClones: bigint;
    cooldown: number;
    challengedAmount: bigint;
    isClosed: boolean;
    annualInterestPPM: number;
    userBalance: bigint;
    allowanceHub: bigint;
    allowanceHelper: bigint;
}

export type PositionDetail = PositionStaticDetail & PositionLiveDetail;

// Tiny per-session cache of the bulk API response so the detail page doesn't
// refetch the whole map on every nav. We still re-pull live state from chain.
let apiCache: { map: Record<string, ApiPosition>; at: number } | null = null;
const API_TTL_MS = 30_000;

async function fetchApiMap(): Promise<Record<string, ApiPosition>> {
    if (apiCache && Date.now() - apiCache.at < API_TTL_MS) return apiCache.map;
    const res = await fetch(POSITIONS_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`positions API ${res.status}`);
    const json = (await res.json()) as ApiResponse;
    // Normalize keys to lowercase so address-casing variations resolve.
    const map: Record<string, ApiPosition> = {};
    for (const k of Object.keys(json.map)) map[k.toLowerCase()] = json.map[k];
    apiCache = { map, at: Date.now() };
    return map;
}

function staticFromApi(p: ApiPosition): PositionStaticDetail {
    return {
        address: p.position,
        original: p.original,
        isOriginal: p.isOriginal,
        collateral: p.collateral,
        collateralName: p.collateralName,
        collateralSymbol: p.collateralSymbol,
        collateralDecimals: Number(p.collateralDecimals),
        limit: BigInt(p.limitForPosition),
        minimumCollateral: BigInt(p.minimumCollateral),
        expiration: Number(p.expiration),
        start: Number(p.start),
        challengePeriod: Number(p.challengePeriod),
        riskPremiumPPM: Number(p.riskPremiumPPM),
        reserveContribution: Number(p.reserveContribution),
    };
}

/**
 * Resolve a position's static metadata.
 *
 * Strategy:
 *  1. Try the public API first — covers every open position and avoids the
 *     two multicalls the previous on-chain-only path required.
 *  2. Fall back to multicall if the position isn't in the API response (e.g.
 *     fully repaid / closed positions the API may have dropped).
 */
export async function findStaticPosition(address: string): Promise<PositionStaticDetail | null> {
    if (!isAddress(address)) return null;
    const addr = address as Address;

    // Fast path: API lookup.
    try {
        const map = await fetchApiMap();
        const hit = map[addr.toLowerCase()];
        if (hit) return staticFromApi(hit);
    } catch {
        // fall through to RPC
    }

    // Fallback: on-chain multicall (handles closed/non-listed positions).
    const client = getPublicClient("ethereum");
    let r: any[];
    try {
        r = await client.multicall({
            contracts: [
                { address: addr, abi: POSITION_V2_ABI, functionName: "original" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "collateral" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "limit" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "minimumCollateral" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "expiration" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "start" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "challengePeriod" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "riskPremiumPPM" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "reserveContribution" as const },
            ],
            allowFailure: false,
        });
    } catch {
        return null;
    }

    const original = r[0] as Address;
    const collateral = r[1] as Address;

    const meta = await client.multicall({
        contracts: [
            { address: collateral, abi: erc20Abi, functionName: "name" as const },
            { address: collateral, abi: erc20Abi, functionName: "symbol" as const },
            { address: collateral, abi: erc20Abi, functionName: "decimals" as const },
        ],
        allowFailure: false,
    });

    return {
        address: addr,
        original,
        isOriginal: addr.toLowerCase() === original.toLowerCase(),
        collateral,
        collateralName: meta[0] as string,
        collateralSymbol: meta[1] as string,
        collateralDecimals: Number(meta[2]),
        limit: r[2] as bigint,
        minimumCollateral: r[3] as bigint,
        expiration: Number(r[4]),
        start: Number(r[5]),
        challengePeriod: Number(r[6]),
        riskPremiumPPM: Number(r[7]),
        reserveContribution: Number(r[8]),
    };
}

export async function loadPositionDetail(
    p: PositionStaticDetail,
    user: Address | null
): Promise<PositionDetail> {
    const client = getPublicClient("ethereum");
    const userAddr = user ?? zeroAddress;

    const calls = [
        { address: p.address, abi: POSITION_V2_ABI, functionName: "price" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "minted" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "availableForClones" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "cooldown" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "challengedAmount" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "isClosed" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "annualInterestPPM" as const },
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

export function liqPriceUnits(p: { price: bigint; collateralDecimals: number }): number {
    return Number(p.price) / Math.pow(10, 36 - p.collateralDecimals);
}

export function detailStatus(p: PositionDetail): "active" | "cooldown" | "challenged" | "closed" | "expired" | "pending" {
    if (p.isClosed) return "closed";
    if (p.expiration * 1000 < Date.now()) return "expired";
    if (p.challengedAmount > 0n) return "challenged";
    if (p.start * 1000 > Date.now()) return "pending";
    if (p.cooldown * 1000 > Date.now()) return "cooldown";
    return "active";
}

export function requiredCollateral(mintAmount: bigint, price: bigint): bigint {
    if (price === 0n) return 0n;
    return (mintAmount * 10n ** 18n + price - 1n) / price;
}

export function maxMintFor(collAmount: bigint, price: bigint): bigint {
    return (collAmount * price) / 10n ** 18n;
}

export function reserveAmount(mintAmount: bigint, reserveContributionPPM: number): bigint {
    return (mintAmount * BigInt(reserveContributionPPM)) / 1_000_000n;
}

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

export function effectiveInterestPPM(
    annualInterestPPM: number,
    reserveContributionPPM: number
): number {
    const r = reserveContributionPPM / 1_000_000;
    return Math.round(annualInterestPPM / (1 - r));
}

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