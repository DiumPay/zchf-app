import { erc20Abi, type Address } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI } from "@abi/position";
import { SAVINGS_ABI } from "@abi/savings";
import { ADDRESSES } from "@config/addresses";
import snapshot from "@data/positions-snapshot.json";

export interface PositionStatic {
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

export interface PositionLive {
    price: bigint;
    minted: bigint;
    availableForMinting: bigint;
    cooldown: number;
    challengedAmount: bigint;
    isClosed: boolean;
    collateralBalance: bigint;
    /** annualInterestPPM = leadrate + riskPremium */
    annualInterestPPM: number;
}

export type Position = PositionStatic & PositionLive;

const READS_PER_POSITION = 8;

/** Read live state for every position in the snapshot, merged with static data. */
export async function loadPositions(): Promise<Position[]> {
    const client = getPublicClient("ethereum");
    const statics = snapshot.positions.map(p => ({
        ...p,
        address: p.address as Address,
        original: p.original as Address,
        collateral: p.collateral as Address,
        limit: BigInt(p.limit),
        minimumCollateral: BigInt(p.minimumCollateral),
    })) as PositionStatic[];

    const positionCalls = statics.flatMap(p => [
    { address: p.address, abi: POSITION_V2_ABI, functionName: "price" as const },
    { address: p.address, abi: POSITION_V2_ABI, functionName: "minted" as const },
    { address: p.address, abi: POSITION_V2_ABI, functionName: "availableForMinting" as const },
    { address: p.address, abi: POSITION_V2_ABI, functionName: "cooldown" as const },
    { address: p.address, abi: POSITION_V2_ABI, functionName: "challengedAmount" as const },
    { address: p.address, abi: POSITION_V2_ABI, functionName: "isClosed" as const },
    { address: p.collateral, abi: erc20Abi, functionName: "balanceOf" as const, args: [p.address] as const },
    { address: p.address, abi: POSITION_V2_ABI, functionName: "annualInterestPPM" as const },
    ]);

    // Global leadrate (one read, used for every position's annual interest)
    const leadrateCall = {
        address: ADDRESSES.ethereum.savings,
        abi: SAVINGS_ABI,
        functionName: "currentRatePPM" as const,
    };

    const allResults = await client.multicall({
    contracts: positionCalls,
    allowFailure: false,
    });

    const leadrate = Number(allResults[allResults.length - 1]);

    return statics.map((p, i) => {
    const base = i * READS_PER_POSITION;
    return {
        ...p,
        price: allResults[base + 0] as bigint,
        minted: allResults[base + 1] as bigint,
        availableForMinting: allResults[base + 2] as bigint,
        cooldown: Number(allResults[base + 3]),
        challengedAmount: allResults[base + 4] as bigint,
        isClosed: allResults[base + 5] as boolean,
        collateralBalance: allResults[base + 6] as bigint,
        annualInterestPPM: Number(allResults[base + 7]),
    };
    });
}

/** Returns ZCHF per 1 unit of collateral (UI-friendly number, not bigint). */
export function liquidationPriceUnits(p: PositionStatic & { price: bigint }): number {
    // Contract stores price scaled to (36 - collateralDecimals) decimals.
    // i.e. price * collateralAmount / 1e18 = ZCHF.
    // Per 1 collateral unit (in human terms): price / 10^(36 - decimals)
    const scale = 36 - p.collateralDecimals;
    return Number(p.price) / Math.pow(10, scale);
}

/** Effective annual interest = nominal / (1 - reserve%). Higher than nominal because the reserve cut isn't returned to the borrower. */
export function effectiveInterestPPM(p: { annualInterestPPM: number; reserveContribution: number }): number {
    const r = p.reserveContribution / 1_000_000;
    return Math.round(p.annualInterestPPM / (1 - r));
}

/** Status helpers for the UI. */
export function positionStatus(p: Position): "active" | "cooldown" | "challenged" | "closed" | "expired" {
    if (p.isClosed) return "closed";
    if (p.expiration * 1000 < Date.now()) return "expired";
    if (p.challengedAmount > 0n) return "challenged";
    if (p.cooldown * 1000 > Date.now()) return "cooldown";
    return "active";
}

/* ------------------------------------------------------------------ */
/* localStorage cache for the borrow table                              */
/* ------------------------------------------------------------------ */
// The borrow table is pure read-only position data with no user-specific
// state, so it's safe to cache the whole multicall result for a short TTL.
// Returning visitors get an instant render; first-load behaviour unchanged.
//
// JSON.stringify can't handle bigint by default — we tag it with a "$bn:"
// prefix on write and parse it back on read. Same trick most wallets use.

const POSITIONS_CACHE_KEY = "fc-positions:v1";
const POSITIONS_TTL_MS = 60 * 1000;

const replacer = (_k: string, v: unknown) =>
    typeof v === "bigint" ? `$bn:${v.toString()}` : v;

const reviver = (_k: string, v: unknown) =>
    typeof v === "string" && v.startsWith("$bn:") ? BigInt(v.slice(4)) : v;

function readPositionsCache(): Position[] | null {
    try {
        const raw = localStorage.getItem(POSITIONS_CACHE_KEY);
        if (!raw) return null;
        const { t, data } = JSON.parse(raw) as { t: number; data: string };
        if (Date.now() - t > POSITIONS_TTL_MS) return null;
        return JSON.parse(data, reviver) as Position[];
    } catch {
        return null;
    }
}

function writePositionsCache(positions: Position[]): void {
    try {
        const payload = JSON.stringify({
            t: Date.now(),
            data: JSON.stringify(positions, replacer),
        });
        localStorage.setItem(POSITIONS_CACHE_KEY, payload);
    } catch { /* quota / private mode */ }
}

/** Borrow-table-friendly variant: returns cached data if fresh, otherwise fetches and caches. */
export async function loadPositionsCached(): Promise<Position[]> {
    const cached = readPositionsCache();
    if (cached) return cached;
    const fresh = await loadPositions();
    writePositionsCache(fresh);
    return fresh;
}

/** Force-bust the borrow-table cache (useful after a successful borrow tx). */
export function clearPositionsCache(): void {
    try { localStorage.removeItem(POSITIONS_CACHE_KEY); } catch { /* ignore */ }
}