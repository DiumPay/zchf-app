import { type Address, getAddress } from "viem";

// dev → local grenadier. prod → deployed grenadier behind cf.
const API_BASE = import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://grenadier-zchf.enni.ch";

const ACTIVE_CHALLENGES_URL = `${API_BASE}/challenges/active`;

/**
 * Raw shape returned by grenadier's /challenges/active endpoint.
 * Mirrors api.frankencoin.com /challenges/list row shape.
 */
interface ApiChallenge {
    id: string;
    position: Address;
    number: number;
    txHash: string;
    challenger: Address;
    start: number;       // unix seconds
    created: number;     // unix seconds
    duration: number;    // challenge period seconds
    size: string;        // collateral, bigint string
    liqPrice: string;    // position liq price at challenge time, 36 - decimals digits
    bids: number;
    filledSize: string;
    acquiredCollateral: string;
    status: string;      // 'Active' | 'Averted' | 'Success'
    version: number;
}

interface ApiResponse {
    num: number;
    list: ApiChallenge[];
}

export interface ActiveChallenge {
    id: string;
    position: Address;
    number: number;
    challenger: Address;
    start: number;
    duration: number;
    size: bigint;
    liqPrice: bigint;
    filledSize: bigint;
    acquiredCollateral: bigint;
    version: number;
}

let cache: { data: ActiveChallenge[]; at: number } | null = null;
const CACHE_TTL_MS = 15_000;

export async function loadActiveChallengesCached(): Promise<ActiveChallenge[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
    const res = await fetch(ACTIVE_CHALLENGES_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`challenges API ${res.status}`);
    const json = (await res.json()) as ApiResponse;
    const rows: ActiveChallenge[] = (json.list ?? []).map(c => ({
        id: c.id,
        position: getAddress(c.position),
        number: Number(c.number),
        challenger: getAddress(c.challenger),
        start: Number(c.start),
        duration: Number(c.duration),
        size: BigInt(c.size),
        liqPrice: BigInt(c.liqPrice ?? "0"),
        filledSize: BigInt(c.filledSize ?? "0"),
        acquiredCollateral: BigInt(c.acquiredCollateral ?? "0"),
        version: Number(c.version),
    }));
    cache = { data: rows, at: Date.now() };
    return rows;
}

export function clearActiveChallengesCache(): void {
    cache = null;
}

/**
 * Compute auction phase + current price from challenge state.
 * Mirrors official frankencoin: Phase 1 fixed at liqPrice, Phase 2 linear
 * decay liqPrice → 0 over `duration`, Phase 3 zero.
 */
export type AuctionPhase = "fixed" | "declining" | "zero";

export interface AuctionState {
    phase: AuctionPhase;
    priceZchf: number;          // current per-unit auction price in ZCHF
    msUntilNextPhase: number;   // ms until phase ends; for "zero" = 0
    declineStartMs: number;     // absolute ms timestamps for phase boundaries
    zeroStartMs: number;
}

export function auctionState(
    challengeStart: number,
    challengeDuration: number,
    challengeLiqPrice: bigint,
    positionExpiration: number,
    collateralDecimals: number,
    nowMs: number = Date.now(),
): AuctionState {
    const startMs = challengeStart * 1000;
    const durationMs = challengeDuration * 1000;
    const expMs = positionExpiration * 1000;

    // Phase 1 ends at min(challenge duration, time-to-position-expiration).
    const timeToExpMs = Math.max(0, expMs - startMs);
    const phase1Ms = Math.min(timeToExpMs, durationMs);
    const declineStartMs = startMs + phase1Ms;
    const zeroStartMs = declineStartMs + durationMs;

    const liqPriceZchf = Number(challengeLiqPrice) / Math.pow(10, 36 - collateralDecimals);

    if (nowMs < declineStartMs) {
        return {
            phase: "fixed",
            priceZchf: liqPriceZchf,
            msUntilNextPhase: declineStartMs - nowMs,
            declineStartMs,
            zeroStartMs,
        };
    }
    if (nowMs < zeroStartMs) {
        const remaining = zeroStartMs - nowMs;
        return {
            phase: "declining",
            priceZchf: liqPriceZchf * (remaining / durationMs),
            msUntilNextPhase: remaining,
            declineStartMs,
            zeroStartMs,
        };
    }
    return {
        phase: "zero",
        priceZchf: 0,
        msUntilNextPhase: 0,
        declineStartMs,
        zeroStartMs,
    };
}

/** Format ms duration as "1d 4h 12m" / "4h 12m" / "12m". */
export function fmtDuration(ms: number): string {
    if (ms <= 0) return "-";
    const totalMin = Math.floor(ms / 60_000);
    const d = Math.floor(totalMin / (60 * 24));
    const h = Math.floor((totalMin - d * 60 * 24) / 60);
    const m = totalMin - d * 60 * 24 - h * 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}